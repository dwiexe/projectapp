import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useTransactions } from "@/context/TransactionContext";
import { api, userApi } from "@/services/api";
import { Button } from "@/components/ui/Button";

function formatRupiah(amount: number) {
  return "Rp " + amount.toLocaleString("id-ID");
}

export default function ConfirmScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateBalance } = useAuth();
  const { addTransaction } = useTransactions();

  const { sku, no, price, name, category } = useLocalSearchParams<{
    sku: string;
    no: string;
    price: string;
    name: string;
    category: string;
  }>();

  const priceNum = parseInt(price || "0", 10);
  const [loading, setLoading] = useState(false);

  const handleConfirmWithBalance = async () => {
    if (!user) return;
    if (user.balance < priceNum) {
      Alert.alert("Saldo Tidak Cukup", "Saldo Anda tidak mencukupi untuk transaksi ini.");
      return;
    }

    setLoading(true);
    try {
      const ref_id = `TX${Date.now()}`;
      const result = await api.doTransaction({
        buyer_sku_code: sku || "",
        customer_no: no || "",
        ref_id,
      });

      const isSuccess = result.status === "Sukses";
      const trxStatus = isSuccess ? "success" : ("failed" as const);

      await addTransaction({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        ref_id,
        type: "debit",
        category: category || "Lainnya",
        product_name: name || sku || "",
        buyer_sku_code: sku || "",
        customer_no: no || "",
        amount: priceNum,
        status: trxStatus,
        sn: result.sn,
        created_at: new Date().toISOString(),
        desc: result.desc,
      });

      const balanceBefore = user.balance;
      const balanceAfter = isSuccess ? user.balance - priceNum : user.balance;

      if (isSuccess) {
        await updateBalance(balanceAfter);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      userApi.recordTransactionFull({
        user_id: user.id,
        ref_id,
        product_name: name || sku || "",
        category: category || "Lainnya",
        buyer_sku_code: sku || "",
        customer_no: no || "",
        amount: priceNum,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        status: trxStatus,
        sn: result.sn,
      });

      router.replace(
        `/transaction/result?status=${trxStatus}&name=${encodeURIComponent(name || "")}&no=${no}&sn=${result.sn || ""}&ref=${ref_id}&price=${priceNum}`
      );
    } catch {
      Alert.alert("Error", "Transaksi gagal. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayWithQris = () => {
    router.push({
      pathname: "/qris-payment",
      params: {
        amount: priceNum.toString(),
        mode: "transaction",
        sku: sku || "",
        no: no || "",
        name: name || "",
        category: category || "",
      },
    });
  };

  const rows = [
    { label: "Produk", value: name || "-" },
    { label: "Kategori", value: category || "-" },
    { label: "Nomor Tujuan", value: no || "-" },
    { label: "Harga", value: formatRupiah(priceNum) },
    { label: "Saldo Anda", value: formatRupiah(user?.balance ?? 0) },
    { label: "Sisa Saldo", value: formatRupiah((user?.balance ?? 0) - priceNum) },
  ];

  const isInsufficient = (user?.balance ?? 0) < priceNum;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Text style={{ fontSize: 22, fontWeight: "300", color: colors.foreground }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Konfirmasi Pembelian</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 20) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 16 }]}>
          {rows.map((row, i) => (
            <View
              key={row.label}
              style={[
                styles.row,
                {
                  borderBottomColor: colors.border,
                  borderBottomWidth: i < rows.length - 1 ? 1 : 0,
                },
              ]}
            >
              <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
              <Text
                style={[
                  styles.rowValue,
                  {
                    color:
                      row.label === "Sisa Saldo"
                        ? isInsufficient
                          ? colors.destructive
                          : colors.success
                        : row.label === "Harga"
                        ? colors.primary
                        : colors.foreground,
                    fontFamily:
                      row.label === "Harga" || row.label === "Saldo Anda" || row.label === "Sisa Saldo"
                        ? "Inter_700Bold"
                        : "Inter_500Medium",
                  },
                ]}
                numberOfLines={2}
              >
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[styles.payLabel, { color: colors.mutedForeground }]}>Pilih metode pembayaran</Text>

        <TouchableOpacity
          onPress={handlePayWithQris}
          activeOpacity={0.85}
          style={[styles.qrisBtn, { backgroundColor: colors.card, borderColor: colors.primary, borderRadius: colors.radius }]}
        >
          <View style={[styles.qrisBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.qrisBadgeText}>QRIS</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.qrisBtnTitle, { color: colors.foreground }]}>Bayar Langsung via QRIS</Text>
            <Text style={[styles.qrisBtnSub, { color: colors.mutedForeground }]}>GoPay · OVO · Dana · ShopeePay · Semua bank</Text>
          </View>
          <Text style={{ fontSize: 20, color: colors.primary }}>›</Text>
        </TouchableOpacity>

        {isInsufficient ? (
          <View style={[styles.alertBox, { backgroundColor: "#fee2e2", borderRadius: colors.radius }]}>
            <Text style={{ fontSize: 18 }}>⚠️</Text>
            <Text style={[styles.alertText, { color: colors.destructive }]}>
              Saldo tidak mencukupi untuk bayar dengan saldo. Gunakan QRIS atau top up dulu.
            </Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button
            title={isInsufficient ? "Top Up Saldo" : `Bayar dengan Saldo  (${formatRupiah(user?.balance ?? 0)})`}
            onPress={isInsufficient ? () => router.push("/topup") : handleConfirmWithBalance}
            loading={loading}
            fullWidth
            size="lg"
            variant={isInsufficient ? "default" : "outline"}
            testID="confirm-buy-button"
          />
          <Button
            title="Batal"
            onPress={() => router.back()}
            variant="outline"
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  content: {
    padding: 16,
    gap: 14,
  },
  card: {
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  rowValue: {
    fontSize: 14,
    flex: 1,
    textAlign: "right",
  },
  payLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: -4,
  },
  qrisBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2,
    padding: 14,
  },
  qrisBadge: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  qrisBadgeText: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  qrisBtnTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  qrisBtnSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  alertBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    lineHeight: 18,
  },
  actions: {
    gap: 10,
  },
});
