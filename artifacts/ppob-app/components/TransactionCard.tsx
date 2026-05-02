import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { type Transaction } from "@/context/TransactionContext";

function formatRupiah(amount: number) {
  return "Rp " + amount.toLocaleString("id-ID");
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCategoryEmoji(category: string): string {
  switch (category) {
    case "Pulsa": return "📱";
    case "Data": return "📶";
    case "PLN": return "⚡";
    case "E-Wallet": return "💳";
    case "Game": return "🎮";
    case "TopUp": return "💰";
    case "TV": return "📺";
    case "BPJS": return "🏥";
    default: return "🔷";
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case "Pulsa": return "#3b82f6";
    case "Data": return "#8b5cf6";
    case "PLN": return "#f59e0b";
    case "E-Wallet": return "#10b981";
    case "Game": return "#ef4444";
    case "TopUp": return "#06b6d4";
    case "TV": return "#06b6d4";
    case "BPJS": return "#64748b";
    default: return "#a855f7";
  }
}

interface TransactionCardProps {
  transaction: Transaction;
  onPress?: () => void;
}

export function TransactionCard({ transaction, onPress }: TransactionCardProps) {
  const colors = useColors();
  const catColor = getCategoryColor(transaction.category);
  const emoji = getCategoryEmoji(transaction.category);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.icon,
          { backgroundColor: catColor + "18", borderRadius: 12, borderWidth: 1, borderColor: catColor + "30" },
        ]}
      >
        <Text style={styles.emoji}>{emoji}</Text>
      </View>

      <View style={styles.info}>
        <Text
          style={[styles.productName, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {transaction.product_name}
        </Text>
        <Text style={[styles.customerNo, { color: colors.mutedForeground }]} numberOfLines={1}>
          {transaction.customer_no}
        </Text>
        <Text style={[styles.date, { color: colors.mutedForeground }]}>
          {formatDate(transaction.created_at)}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.amount, { color: colors.foreground }]}>
          {formatRupiah(transaction.amount)}
        </Text>
        <View
          style={[
            styles.badge,
            {
              backgroundColor:
                transaction.status === "success"
                  ? colors.successLight
                  : transaction.status === "pending"
                  ? colors.warningLight
                  : "#fee2e2",
              borderRadius: 20,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color:
                  transaction.status === "success"
                    ? colors.success
                    : transaction.status === "pending"
                    ? colors.warning
                    : colors.destructive,
              },
            ]}
          >
            {transaction.status === "success"
              ? "✓ Berhasil"
              : transaction.status === "pending"
              ? "⏳ Proses"
              : "✕ Gagal"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  icon: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 22,
    textAlign: "center",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  productName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  customerNo: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  date: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  right: {
    alignItems: "flex-end",
    gap: 6,
  },
  amount: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
});
