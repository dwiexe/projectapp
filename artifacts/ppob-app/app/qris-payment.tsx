import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useTransactions } from "@/context/TransactionContext";
import { qrisApi, api, userApi, type QrisOrder } from "@/services/api";

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function formatCountdown(ms: number) {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function QrisPaymentScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateBalance } = useAuth();
  const { addTransaction } = useTransactions();

  const {
    amount: amountStr,
    mode,
    sku,
    no,
    name: productName,
    category,
  } = useLocalSearchParams<{
    amount: string;
    mode?: string;
    sku?: string;
    no?: string;
    name?: string;
    category?: string;
  }>();

  const isTransactionMode = mode === "transaction";
  const amount = parseInt(amountStr || "0", 10);

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<QrisOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"pending" | "paid" | "expired">("pending");
  const [countdown, setCountdown] = useState(0);
  const [simulating, setSimulating] = useState(false);
  const [txResult, setTxResult] = useState<{ sn?: string; ref_id: string; txStatus: "success" | "failed" } | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  const executeTransaction = useCallback(async (ord: QrisOrder) => {
    const ref_id = `QX${Date.now()}`;
    try {
      const result = await api.doTransaction({
        buyer_sku_code: sku || "",
        customer_no: no || "",
        ref_id,
      });
      const isSuccess = result.status === "Sukses";
      const trxStatus = isSuccess ? "success" : ("failed" as const);

      if (!isSuccess) {
        // Digiflazz gagal — refund otomatis ke saldo dompet
        const balanceBefore = user?.balance ?? 0;
        const balanceAfter = balanceBefore + ord.amount;
        await updateBalance(balanceAfter);
        if (user) {
          userApi.recordTopup({
            user_id: user.id,
            amount: ord.amount,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            method: "Refund Otomatis (Digiflazz Gagal)",
            ref_id: `REFUND-${ref_id}`,
          });
        }
        await addTransaction({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          ref_id: `REFUND-${ref_id}`,
          type: "credit",
          category: "Refund",
          product_name: `Refund: ${productName || sku || ""}`,
          buyer_sku_code: "REFUND",
          customer_no: no || "",
          amount: ord.amount,
          status: "success",
          created_at: new Date().toISOString(),
          desc: "Refund otomatis — transaksi Digiflazz gagal",
        });
      }

      await addTransaction({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        ref_id,
        type: "debit",
        category: category || "Lainnya",
        product_name: productName || sku || "",
        buyer_sku_code: sku || "",
        customer_no: no || "",
        amount: ord.amount,
        status: trxStatus,
        sn: result.sn,
        created_at: new Date().toISOString(),
        desc: isSuccess ? (result.desc || "Bayar via QRIS") : "Transaksi gagal — saldo dikembalikan otomatis",
      });
      setTxResult({ sn: result.sn, ref_id, txStatus: trxStatus });
      return { trxStatus, ref_id, sn: result.sn };
    } catch {
      // Error jaringan — refund otomatis ke saldo dompet
      const balanceBefore = user?.balance ?? 0;
      const balanceAfter = balanceBefore + ord.amount;
      await updateBalance(balanceAfter);
      if (user) {
        userApi.recordTopup({
          user_id: user.id,
          amount: ord.amount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          method: "Refund Otomatis (Error Koneksi)",
          ref_id: `REFUND-${ref_id}`,
        });
      }
      await addTransaction({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        ref_id,
        type: "debit",
        category: category || "Lainnya",
        product_name: productName || sku || "",
        buyer_sku_code: sku || "",
        customer_no: no || "",
        amount: ord.amount,
        status: "failed",
        created_at: new Date().toISOString(),
        desc: "Gagal eksekusi — saldo dikembalikan otomatis",
      });
      setTxResult({ ref_id, txStatus: "failed" });
      return { trxStatus: "failed" as const, ref_id, sn: undefined };
    }
  }, [sku, no, productName, category, addTransaction, user, updateBalance]);

  const handlePaid = useCallback(async (ord: QrisOrder) => {
    clearTimers();
    setStatus("paid");
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    if (isTransactionMode) {
      const { trxStatus, ref_id, sn } = await executeTransaction(ord);
      setTimeout(() => {
        const refundParam = trxStatus === "failed" ? "&refund=1" : "";
        router.replace(
          `/transaction/result?status=${trxStatus}&name=${encodeURIComponent(productName || "")}&no=${no}&sn=${sn || ""}&ref=${ref_id}&price=${ord.amount}${refundParam}`
        );
      }, 1500);
    } else {
      const balanceBefore = user?.balance ?? 0;
      const balanceAfter = balanceBefore + ord.amount;
      await addTransaction({
        id: Date.now().toString(),
        ref_id: ord.order_id,
        type: "credit",
        category: "TopUp",
        product_name: "Top Up Saldo via QRIS",
        buyer_sku_code: "TOPUP-QRIS",
        customer_no: user?.phone || user?.email || "",
        amount: ord.amount,
        status: "success",
        created_at: new Date().toISOString(),
        desc: `Top Up via QRIS ${ord.provider === "midtrans" ? "(Midtrans)" : "(Demo)"}`,
      });
      await updateBalance(balanceAfter);
      if (user) {
        userApi.recordTopup({
          user_id: user.id,
          amount: ord.amount,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          method: ord.provider === "midtrans" ? "QRIS Midtrans" : "QRIS Demo",
          ref_id: ord.order_id,
        });
      }
    }
  }, [isTransactionMode, executeTransaction, addTransaction, updateBalance, user, productName, no, router]);

  const startPolling = useCallback((ord: QrisOrder) => {
    const expiry = new Date(ord.expires_at).getTime();
    countdownRef.current = setInterval(() => {
      const remaining = expiry - Date.now();
      setCountdown(Math.max(0, remaining));
      if (remaining <= 0) {
        clearTimers();
        setStatus("expired");
      }
    }, 1000);

    pollRef.current = setInterval(async () => {
      try {
        const s = await qrisApi.checkStatus(ord.order_id);
        if (s.status === "paid") {
          await handlePaid(ord);
        } else if (s.status === "expired") {
          clearTimers();
          setStatus("expired");
        }
      } catch {}
    }, 3000);
  }, [handlePaid]);

  useEffect(() => {
    if (!amount || amount < 1000) {
      setError("Nominal tidak valid");
      setLoading(false);
      return;
    }
    qrisApi.create(amount)
      .then((ord) => {
        setOrder(ord);
        setCountdown(new Date(ord.expires_at).getTime() - Date.now());
        startPolling(ord);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
    return clearTimers;
  }, [amount, startPolling]);

  const handleSimulatePay = async () => {
    if (!order || status !== "pending") return;
    setSimulating(true);
    try {
      await qrisApi.simulatePay(order.order_id);
      await handlePaid(order);
    } catch (e) {
      Alert.alert("Error", String(e));
    } finally {
      setSimulating(false);
    }
  };

  const handleBack = () => {
    clearTimers();
    router.back();
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Membuat QRIS...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 48 }}>⚠️</Text>
        <Text style={[styles.errorText, { color: colors.destructive }]}>{error || "Gagal membuat QRIS"}</Text>
        <TouchableOpacity onPress={handleBack} style={[styles.actionBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
          <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold" }}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === "paid") {
    if (isTransactionMode) {
      return (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <ActivityIndicator color={colors.success} size="large" />
          <Text style={[styles.paidTitle, { color: colors.success }]}>Pembayaran Diterima!</Text>
          <Text style={[styles.paidSub, { color: colors.mutedForeground }]}>Memproses transaksi...</Text>
        </View>
      );
    }
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 72 }}>✅</Text>
        <Text style={[styles.paidTitle, { color: colors.success }]}>Pembayaran Berhasil!</Text>
        <Text style={[styles.paidAmount, { color: colors.foreground }]}>{formatRupiah(order.amount)}</Text>
        <Text style={[styles.paidSub, { color: colors.mutedForeground }]}>Saldo telah ditambahkan ke akun Anda</Text>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          style={[styles.actionBtn, { backgroundColor: colors.success, borderRadius: colors.radius }]}
        >
          <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 }}>🏠  Ke Beranda</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === "expired") {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 64 }}>⏰</Text>
        <Text style={[styles.paidTitle, { color: colors.warning }]}>QRIS Kedaluwarsa</Text>
        <Text style={[styles.paidSub, { color: colors.mutedForeground }]}>Batas waktu pembayaran telah habis</Text>
        <TouchableOpacity onPress={handleBack} style={[styles.actionBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
          <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold" }}>Buat QRIS Baru</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isDemo = order.provider === "demo";

  const steps = isTransactionMode
    ? [
        "Buka aplikasi bank/e-wallet (GoPay, OVO, Dana, dll)",
        "Pilih menu 'Scan QR' atau 'QRIS'",
        "Arahkan kamera ke kode QR di atas",
        "Konfirmasi pembayaran sesuai jumlah",
        "Transaksi diproses otomatis setelah pembayaran berhasil",
      ]
    : [
        "Buka aplikasi bank/e-wallet (GoPay, OVO, Dana, dll)",
        "Pilih menu 'Scan QR' atau 'QRIS'",
        "Arahkan kamera ke kode QR di atas",
        "Konfirmasi jumlah pembayaran",
        "Saldo otomatis bertambah setelah pembayaran dikonfirmasi",
      ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <TouchableOpacity onPress={handleBack} hitSlop={10}>
          <Text style={[styles.backIcon, { color: colors.foreground }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {isTransactionMode ? "Bayar via QRIS" : "Top Up via QRIS"}
        </Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {isDemo && (
          <View style={[styles.demoBanner, { backgroundColor: "#fef3c7", borderColor: "#f59e0b30", borderRadius: 10 }]}>
            <Text style={styles.demoText}>
              ⚠️ Mode Demo — QRIS ini tidak dapat digunakan untuk pembayaran nyata. Set Midtrans Server Key di Panel Admin untuk mode Live.
            </Text>
          </View>
        )}

        {isTransactionMode && (
          <View style={[styles.txInfoBox, { backgroundColor: colors.primaryLight, borderRadius: colors.radius }]}>
            <Text style={[styles.txInfoProduct, { color: colors.primary }]}>📦  {productName}</Text>
            <Text style={[styles.txInfoNo, { color: colors.mutedForeground }]}>Nomor: {no}</Text>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.amountLabel, { color: colors.mutedForeground }]}>
            {isTransactionMode ? "Total Pembayaran" : "Total Top Up"}
          </Text>
          <Text style={[styles.amountValue, { color: colors.primary }]}>{formatRupiah(order.amount)}</Text>

          <View style={[styles.qrWrap, { borderColor: colors.border }]}>
            <QRCode
              value={order.qr_string || "DEMO-QRIS"}
              size={220}
              color="#000"
              backgroundColor="#fff"
            />
          </View>

          <View
            style={[
              styles.timerBox,
              {
                backgroundColor: countdown < 60000 ? "#fef2f2" : colors.secondary,
                borderRadius: 10,
              },
            ]}
          >
            <Text style={{ fontSize: 18 }}>{countdown < 60000 ? "⚡" : "⏱️"}</Text>
            <Text style={[styles.timerText, { color: countdown < 60000 ? colors.destructive : colors.foreground }]}>
              Berlaku {formatCountdown(countdown)}
            </Text>
          </View>
        </View>

        <View style={[styles.stepsCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.stepsTitle, { color: colors.foreground }]}>Cara Bayar</Text>
          {steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.mutedForeground }]}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.infoBox, { backgroundColor: colors.secondary, borderRadius: 10 }]}>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>ℹ️ Informasi</Text>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Order ID: {order.order_id}{"\n"}
            Provider: {isDemo ? "Demo (tidak aktif)" : "Midtrans (Live)"}{"\n"}
            {isTransactionMode
              ? "Transaksi diproses otomatis setelah QR dibayar."
              : "Saldo akan otomatis bertambah setelah pembayaran dikonfirmasi."}
          </Text>
        </View>

        {isDemo && (
          <TouchableOpacity
            onPress={handleSimulatePay}
            disabled={simulating}
            activeOpacity={0.8}
            style={[styles.simBtn, { backgroundColor: colors.success, borderRadius: colors.radius }]}
          >
            {simulating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.simBtnText}>🧪  Simulasi Pembayaran Berhasil</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  errorText: { fontSize: 15, fontFamily: "Inter_500Medium", textAlign: "center" },
  actionBtn: { paddingHorizontal: 28, paddingVertical: 12, marginTop: 8 },
  paidTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  paidAmount: { fontSize: 28, fontFamily: "Inter_700Bold" },
  paidSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  backIcon: { fontSize: 24, fontWeight: "300" },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  content: { padding: 16, gap: 16 },
  demoBanner: { padding: 12, borderWidth: 1 },
  demoText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#92400e", lineHeight: 18 },
  txInfoBox: { padding: 14, gap: 4 },
  txInfoProduct: { fontSize: 14, fontFamily: "Inter_700Bold" },
  txInfoNo: { fontSize: 13, fontFamily: "Inter_400Regular" },
  card: { borderWidth: 1, padding: 20, alignItems: "center", gap: 14 },
  amountLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  amountValue: { fontSize: 28, fontFamily: "Inter_700Bold" },
  qrWrap: { borderWidth: 1, borderRadius: 12, padding: 16, backgroundColor: "#fff" },
  timerBox: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  timerText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  stepsCard: { borderWidth: 1, padding: 16, gap: 12 },
  stepsTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 4 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  stepNum: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  stepNumText: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold" },
  stepText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  infoBox: { padding: 14, gap: 6 },
  infoTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  infoText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  simBtn: { padding: 16, alignItems: "center", justifyContent: "center" },
  simBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
});
