import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useTransactions } from "@/context/TransactionContext";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";

function formatRupiah(amount: number) {
  return "Rp " + amount.toLocaleString("id-ID");
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TransactionDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions } = useTransactions();

  const trx = transactions.find((t) => t.id === id);

  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<string | null>(null);

  const handleCheckStatus = async () => {
    if (!trx?.ref_id) return;
    setCheckLoading(true);
    try {
      const result = await api.checkStatus(trx.ref_id);
      setCheckResult(result.message || result.status);
    } catch {
      setCheckResult("Gagal mengecek status");
    } finally {
      setCheckLoading(false);
    }
  };

  if (!trx) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 48 }}>🔍</Text>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Transaksi tidak ditemukan</Text>
        <Button title="Kembali" onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  const isSuccess = trx.status === "success";
  const rows = [
    { label: "Ref. ID", value: trx.ref_id },
    { label: "Produk", value: trx.product_name },
    { label: "Kategori", value: trx.category },
    { label: "Nomor Tujuan", value: trx.customer_no },
    { label: "Nominal", value: formatRupiah(trx.amount) },
    ...(trx.sn ? [{ label: "Serial Number", value: trx.sn }] : []),
    { label: "Waktu", value: formatDate(trx.created_at) },
    { label: "Status", value: isSuccess ? "Berhasil" : trx.status === "pending" ? "Diproses" : "Gagal" },
  ];

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
        <Text style={[styles.title, { color: colors.foreground }]}>Detail Transaksi</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 20) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: isSuccess
                ? colors.successLight
                : trx.status === "pending"
                ? colors.warningLight
                : "#fee2e2",
              borderRadius: colors.radius,
            },
          ]}
        >
          <Text style={{ fontSize: 28 }}>
            {isSuccess ? "✅" : trx.status === "pending" ? "⏳" : "❌"}
          </Text>
          <Text
            style={[
              styles.statusText,
              {
                color: isSuccess
                  ? colors.success
                  : trx.status === "pending"
                  ? colors.warning
                  : colors.destructive,
              },
            ]}
          >
            {isSuccess ? "Transaksi Berhasil" : trx.status === "pending" ? "Sedang Diproses" : "Transaksi Gagal"}
          </Text>
        </View>

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
                      row.label === "Status"
                        ? isSuccess
                          ? colors.success
                          : trx.status === "pending"
                          ? colors.warning
                          : colors.destructive
                        : row.label === "Nominal"
                        ? colors.primary
                        : colors.foreground,
                    fontFamily: row.label === "Nominal" ? "Inter_700Bold" : "Inter_500Medium",
                  },
                ]}
                numberOfLines={2}
                selectable
              >
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        {checkResult && (
          <View style={[styles.checkResultBox, { backgroundColor: colors.accent, borderRadius: colors.radius }]}>
            <Text style={{ fontSize: 16 }}>ℹ️</Text>
            <Text style={[styles.checkResultText, { color: colors.accentForeground }]}>{checkResult}</Text>
          </View>
        )}

        <Button
          title={checkLoading ? "Mengecek..." : "Cek Status Transaksi"}
          onPress={handleCheckStatus}
          loading={checkLoading}
          variant="outline"
          fullWidth
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
    gap: 16,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  statusText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
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
    paddingVertical: 13,
    gap: 12,
  },
  rowLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  rowValue: {
    fontSize: 13,
    flex: 1,
    textAlign: "right",
  },
  checkResultBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
  },
  checkResultText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  notFound: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    marginVertical: 12,
  },
});
