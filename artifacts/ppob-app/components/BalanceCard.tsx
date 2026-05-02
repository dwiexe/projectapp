import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";

function formatRupiah(amount: number) {
  return "Rp " + amount.toLocaleString("id-ID");
}

export function BalanceCard() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(true);

  return (
    <LinearGradient
      colors={["#1d4ed8", "#7c3aed"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.row}>
        <View>
          <Text style={styles.greeting}>Selamat datang,</Text>
          <Text style={styles.name} numberOfLines={1}>
            {user?.name || "Pengguna"}
          </Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || "P"}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View>
        <Text style={styles.balanceLabel}>Saldo Anda</Text>
        <View style={styles.balanceRow}>
          <Text style={styles.balance}>
            {visible ? formatRupiah(user?.balance ?? 0) : "Rp ••••••"}
          </Text>
          <TouchableOpacity onPress={() => setVisible(!visible)} hitSlop={12}>
            <Text style={styles.eyeIcon}>{visible ? "🙈" : "👁"}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.phone}>{user?.phone || "-"}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  name: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  balanceLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  balance: {
    color: "#fff",
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  eyeIcon: {
    fontSize: 18,
  },
  phone: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    marginTop: 4,
    fontFamily: "Inter_400Regular",
  },
});
