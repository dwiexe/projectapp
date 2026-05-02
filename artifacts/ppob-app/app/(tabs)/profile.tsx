import React, { useRef } from "react";
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
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useTransactions } from "@/context/TransactionContext";

function formatRupiah(amount: number) {
  return "Rp " + amount.toLocaleString("id-ID");
}

interface MenuItemProps {
  emoji: string;
  label: string;
  value?: string;
  onPress?: () => void;
  color?: string;
  showArrow?: boolean;
}

function MenuItem({ emoji, label, value, onPress, color, showArrow = true }: MenuItemProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.menuItem, { borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, { backgroundColor: (color || colors.primary) + "15", borderRadius: 10 }]}>
        <Text style={styles.menuEmoji}>{emoji}</Text>
      </View>
      <View style={styles.menuInfo}>
        <Text style={[styles.menuLabel, { color: colors.foreground }]}>{label}</Text>
        {value && <Text style={[styles.menuValue, { color: colors.mutedForeground }]}>{value}</Text>}
      </View>
      {showArrow && <Text style={[styles.arrowIcon, { color: colors.mutedForeground }]}>›</Text>}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { transactions } = useTransactions();

  const successCount = transactions.filter((t) => t.status === "success").length;

  const [versionTapCount, setVersionTapCount] = React.useState(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleVersionTap = () => {
    const newCount = versionTapCount + 1;
    setVersionTapCount(newCount);
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (newCount >= 5) {
      setVersionTapCount(0);
      router.push("/admin");
    } else {
      tapTimer.current = setTimeout(() => setVersionTapCount(0), 2000);
    }
  };

  const handleLogout = () => {
    Alert.alert("Keluar", "Apakah Anda yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/auth/login");
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20),
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90),
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Profil</Text>

      <View style={[styles.profileCard, { backgroundColor: colors.primary, borderRadius: 20 }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || "P"}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <Text style={styles.profilePhone}>{user?.phone}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{transactions.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total Transaksi</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.statValue, { color: colors.success }]}>{successCount}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Berhasil</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>{formatRupiah(user?.balance ?? 0).replace("Rp ", "")}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Saldo</Text>
        </View>
      </View>

      <View style={[styles.menuGroup, { borderColor: colors.border }]}>
        <MenuItem
          emoji="💰"
          label="Top Up Saldo"
          onPress={() => router.push("/topup")}
        />
        <MenuItem
          emoji="📋"
          label="Riwayat Transaksi"
          onPress={() => router.push("/(tabs)/history")}
        />
        <MenuItem
          emoji="🔒"
          label="Keamanan Akun"
          onPress={() => router.push("/auth/reset-password")}
        />
      </View>

      <View style={[styles.menuGroup, { borderColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleVersionTap}
          activeOpacity={0.6}
          style={[styles.menuItem, { borderColor: colors.border }]}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.primary + "15", borderRadius: 10 }]}>
            <Text style={styles.menuEmoji}>ℹ️</Text>
          </View>
          <View style={styles.menuInfo}>
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>Versi Aplikasi</Text>
            <Text style={[styles.menuValue, { color: colors.mutedForeground }]}>
              1.0.0
            </Text>
          </View>
        </TouchableOpacity>
        <MenuItem
          emoji="❓"
          label="Bantuan & FAQ"
          onPress={() => router.push("/bantuan")}
        />
      </View>

      <TouchableOpacity
        onPress={handleLogout}
        style={[styles.logoutBtn, { backgroundColor: "#fee2e2", borderRadius: colors.radius }]}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutIcon}>🚪</Text>
        <Text style={[styles.logoutText, { color: colors.destructive }]}>Keluar dari Akun</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 16,
  },
  pageTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  profileEmail: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  profilePhone: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  menuGroup: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  menuIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  menuEmoji: {
    fontSize: 20,
    textAlign: "center",
  },
  menuInfo: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  menuValue: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  arrowIcon: {
    fontSize: 22,
    fontWeight: "300",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    marginBottom: 8,
  },
  logoutIcon: {
    fontSize: 20,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
