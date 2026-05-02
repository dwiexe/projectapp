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
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useTransactions } from "@/context/TransactionContext";
import { api } from "@/services/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function formatRupiah(amount: number) {
  return "Rp " + amount.toLocaleString("id-ID");
}

const PRESETS = [10000, 25000, 50000, 100000, 200000, 500000];
const METHODS = [
  { id: "qris", name: "QRIS (Semua Bank & E-Wallet)", emoji: "📲", highlight: true },
  { id: "bca", name: "BCA Virtual Account", emoji: "🏦", highlight: false },
  { id: "mandiri", name: "Mandiri Virtual Account", emoji: "🏦", highlight: false },
  { id: "bni", name: "BNI Virtual Account", emoji: "🏦", highlight: false },
];

export default function TopUpScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateBalance } = useAuth();
  const { addTransaction } = useTransactions();

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("qris");
  const [loading, setLoading] = useState(false);

  const numAmount = parseInt(amount.replace(/\D/g, "") || "0", 10);

  const handlePreset = (val: number) => {
    setAmount(val.toString());
  };

  const handleAmountChange = (text: string) => {
    const digits = text.replace(/\D/g, "");
    setAmount(digits);
  };

  const handleTopUp = async () => {
    if (numAmount < 10000) {
      Alert.alert("Nominal Kurang", "Minimal top up Rp 10.000");
      return;
    }
    if (numAmount > 10000000) {
      Alert.alert("Nominal Terlalu Besar", "Maksimal top up Rp 10.000.000");
      return;
    }

    if (method === "qris") {
      router.push({ pathname: "/qris-payment", params: { amount: numAmount.toString() } });
      return;
    }

    setLoading(true);
    try {
      await api.topUp(numAmount, method);

      await addTransaction({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        ref_id: `TU${Date.now()}`,
        type: "credit",
        category: "TopUp",
        product_name: `Top Up Saldo`,
        buyer_sku_code: "TOPUP",
        customer_no: user?.phone || user?.email || "",
        amount: numAmount,
        status: "success",
        created_at: new Date().toISOString(),
        desc: `Top Up via ${METHODS.find((m) => m.id === method)?.name}`,
      });

      await updateBalance((user?.balance ?? 0) + numAmount);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        "Top Up Berhasil!",
        `Saldo ${formatRupiah(numAmount)} telah berhasil ditambahkan.`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch {
      Alert.alert("Gagal", "Top up gagal. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

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
        <Text style={[styles.title, { color: colors.foreground }]}>Top Up Saldo</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 20) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.balanceBox, { backgroundColor: colors.primaryLight, borderRadius: colors.radius }]}>
          <Text style={[styles.balanceLabel, { color: colors.primary }]}>Saldo Saat Ini</Text>
          <Text style={[styles.balanceValue, { color: colors.primary }]}>
            {formatRupiah(user?.balance ?? 0)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Nominal Top Up</Text>
          <Input
            placeholder="Masukkan nominal"
            keyboardType="numeric"
            leftIcon="dollar-sign"
            value={amount ? formatRupiah(numAmount).replace("Rp ", "") : ""}
            onChangeText={handleAmountChange}
          />
          <View style={styles.presets}>
            {PRESETS.map((val) => (
              <TouchableOpacity
                key={val}
                onPress={() => handlePreset(val)}
                style={[
                  styles.presetBtn,
                  {
                    backgroundColor: numAmount === val ? colors.primary : colors.secondary,
                    borderRadius: 8,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.presetText,
                    { color: numAmount === val ? "#fff" : colors.mutedForeground },
                  ]}
                >
                  {formatRupiah(val)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Metode Pembayaran</Text>
          {METHODS.map((m) => (
            <TouchableOpacity
              key={m.id}
              onPress={() => setMethod(m.id)}
              style={[
                styles.methodBtn,
                {
                  backgroundColor: method === m.id ? colors.primaryLight : colors.card,
                  borderColor: method === m.id ? colors.primary : (m.highlight ? "#10b98130" : colors.border),
                  borderRadius: colors.radius,
                  borderWidth: m.highlight ? 1.5 : 1,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 20 }}>{m.emoji}</Text>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text
                  style={[
                    styles.methodText,
                    { flex: 1, color: method === m.id ? colors.primary : colors.foreground },
                  ]}
                >
                  {m.name}
                </Text>
                {m.highlight && (
                  <View style={{ backgroundColor: "#10b981", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ color: "#fff", fontSize: 9, fontFamily: "Inter_700Bold" }}>REKOMENDASI</Text>
                  </View>
                )}
              </View>
              {method === m.id && (
                <Text style={{ fontSize: 18 }}>✅</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {numAmount >= 10000 && (
          <View style={[styles.summaryBox, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Nominal</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>{formatRupiah(numAmount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Biaya Admin</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>Gratis</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Total Bayar</Text>
              <Text style={[styles.summaryValue, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>{formatRupiah(numAmount)}</Text>
            </View>
          </View>
        )}

        <Button
          title={method === "qris" ? "📲  Bayar via QRIS" : "Top Up Sekarang"}
          onPress={handleTopUp}
          loading={loading}
          fullWidth
          size="lg"
          disabled={numAmount < 10000}
        />
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
    gap: 20,
  },
  balanceBox: {
    padding: 16,
    gap: 4,
  },
  balanceLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  balanceValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  presets: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  presetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  presetText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  methodBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1.5,
  },
  methodText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  summaryBox: {
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  summaryDivider: {
    height: 1,
  },
});
