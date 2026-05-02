import React from "react";
import {
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

export default function ResultScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { status, name, no, sn, ref, price, refund } = useLocalSearchParams<{
    status: string;
    name: string;
    no: string;
    sn: string;
    ref: string;
    price: string;
    refund?: string;
  }>();

  const isSuccess = status === "success";
  const isRefunded = refund === "1";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 40),
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 20),
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.resultBox}>
        {isSuccess ? (
          <Text style={styles.illustration}>✅</Text>
        ) : (
          <Text style={styles.illustration}>❌</Text>
        )}

        <Text
          style={[
            styles.statusText,
            { color: isSuccess ? colors.success : colors.destructive },
          ]}
        >
          {isSuccess ? "Transaksi Berhasil!" : "Transaksi Gagal"}
        </Text>
        <Text style={[styles.statusDesc, { color: colors.mutedForeground }]}>
          {isSuccess
            ? "Pembayaran Anda telah berhasil diproses."
            : isRefunded
            ? "Transaksi gagal diproses. Dana Anda telah dikembalikan ke saldo dompet secara otomatis."
            : "Transaksi gagal diproses. Saldo tidak dipotong."}
        </Text>
        {!isSuccess && isRefunded && (
          <View style={[styles.refundBox, { backgroundColor: "#d1fae5", borderRadius: 12 }]}>
            <Text style={styles.refundIcon}>↩️</Text>
            <Text style={[styles.refundText, { color: "#065f46" }]}>
              {formatRupiah(parseInt(price || "0", 10))} dikembalikan ke saldo dompet Anda
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 16 }]}>
        <Text style={[styles.detailTitle, { color: colors.foreground }]}>Detail Transaksi</Text>

        {[
          { label: "Produk", value: name || "-" },
          { label: "Nomor Tujuan", value: no || "-" },
          ...(sn ? [{ label: "Serial Number", value: sn }] : []),
          { label: "Nominal", value: formatRupiah(parseInt(price || "0", 10)) },
          { label: "Ref. ID", value: ref || "-" },
          { label: "Waktu", value: formatDate(new Date().toISOString()) },
          { label: "Status", value: isSuccess ? "Berhasil" : "Gagal" },
        ].map((row, i, arr) => (
          <View
            key={row.label}
            style={[
              styles.detailRow,
              {
                borderTopColor: colors.border,
                borderTopWidth: i === 0 ? 1 : 0,
                borderBottomColor: colors.border,
                borderBottomWidth: i === arr.length - 1 ? 0 : 1,
              },
            ]}
          >
            <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
            <Text
              style={[
                styles.detailValue,
                {
                  color:
                    row.label === "Status"
                      ? isSuccess
                        ? colors.success
                        : colors.destructive
                      : colors.foreground,
                  fontFamily:
                    row.label === "Nominal" ? "Inter_700Bold" : "Inter_500Medium",
                },
              ]}
              numberOfLines={2}
            >
              {row.value}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          title="Kembali ke Beranda"
          onPress={() => router.replace("/(tabs)")}
          fullWidth
          size="lg"
        />
        <Button
          title="Lihat Riwayat"
          onPress={() => router.replace("/(tabs)/history")}
          variant="outline"
          fullWidth
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 24,
  },
  resultBox: {
    alignItems: "center",
    gap: 12,
    paddingTop: 20,
  },
  illustration: {
    fontSize: 90,
    textAlign: "center",
  },
  statusText: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  statusDesc: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  detailCard: {
    borderWidth: 1,
    overflow: "hidden",
    padding: 16,
    gap: 0,
  },
  detailTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    gap: 12,
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    flex: 1,
    textAlign: "right",
  },
  actions: {
    gap: 10,
  },
  refundBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 4,
  },
  refundIcon: {
    fontSize: 22,
  },
  refundText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 20,
  },
});
