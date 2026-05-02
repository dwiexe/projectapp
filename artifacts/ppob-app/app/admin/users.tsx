import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { adminUserApi, type StoredUser } from "@/services/api";

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function formatDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
}

function maskPassword(pw: string) {
  if (!pw) return "—";
  return pw;
}

export default function AdminUsersScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useLocalSearchParams<{ token: string }>();

  const [users, setUsers] = useState<StoredUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editBalanceId, setEditBalanceId] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState("");
  const [editPassId, setEditPassId] = useState<string | null>(null);
  const [newPass, setNewPass] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showPass, setShowPass] = useState<Record<string, boolean>>({});

  const loadUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await adminUserApi.listUsers(token);
      setUsers(data);
      setLoaded(true);
    } catch (e) {
      Alert.alert("Error", String(e));
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q);
  });

  const handleUpdateBalance = async (userId: string) => {
    const bal = parseInt(newBalance.replace(/\D/g, ""), 10);
    if (isNaN(bal) || bal < 0) {
      Alert.alert("Error", "Saldo tidak valid");
      return;
    }
    setActionLoading(true);
    try {
      await adminUserApi.updateBalance(token!, userId, bal);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, balance: bal } : u));
      setEditBalanceId(null);
      setNewBalance("");
      Alert.alert("Berhasil", "Saldo diperbarui.");
    } catch (e) {
      Alert.alert("Error", String(e));
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!newPass || newPass.length < 6) {
      Alert.alert("Error", "Password minimal 6 karakter");
      return;
    }
    setActionLoading(true);
    try {
      await adminUserApi.resetPassword(token!, userId, newPass);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, password: newPass } : u));
      setEditPassId(null);
      setNewPass("");
      Alert.alert("Berhasil", "Password diubah.");
    } catch (e) {
      Alert.alert("Error", String(e));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (userId: string, name: string) => {
    Alert.alert(
      "Hapus Akun",
      `Hapus akun "${name}"? Data tidak bisa dipulihkan.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            try {
              await adminUserApi.deleteUser(token!, userId);
              setUsers((prev) => prev.filter((u) => u.id !== userId));
              if (expandedId === userId) setExpandedId(null);
            } catch (e) {
              Alert.alert("Error", String(e));
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Text style={[styles.backBtn, { color: colors.foreground }]}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>👥  Manajemen Akun</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {loaded ? `${users.length} akun terdaftar` : "Memuat..."}
          </Text>
        </View>
        <TouchableOpacity onPress={loadUsers} hitSlop={10} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text style={[styles.refreshBtn, { color: colors.primary }]}>↻</Text>
          )}
        </TouchableOpacity>
      </View>

      {users.length === 0 && loaded && (
        <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border, margin: 16, borderRadius: colors.radius }]}>
          <Text style={{ fontSize: 40 }}>👤</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Belum ada akun</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Akun pengguna akan muncul di sini setelah mereka mendaftar dan login setidaknya sekali.
          </Text>
        </View>
      )}

      {users.length > 0 && (
        <>
          <View style={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 }}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Cari nama, email, atau HP..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
                borderRadius: 10,
              }]}
            />
          </View>

          <View style={[styles.statsRow, { paddingHorizontal: 12 }]}>
            {[
              { label: "Total Akun", value: users.length.toString() },
              { label: "Total Saldo", value: formatRupiah(users.reduce((s, u) => s + u.balance, 0)) },
              { label: "Total Transaksi", value: users.reduce((s, u) => s + u.transaction_count, 0).toString() },
            ].map((s) => (
              <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 10 }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 12, gap: 10, paddingBottom: insets.bottom + 40 }}>
            {filtered.map((u) => {
              const isExpanded = expandedId === u.id;
              const isEditBal = editBalanceId === u.id;
              const isEditPass = editPassId === u.id;
              const passVisible = showPass[u.id];

              return (
                <View key={u.id} style={[styles.userCard, { backgroundColor: colors.card, borderColor: isExpanded ? colors.primary : colors.border, borderRadius: colors.radius }]}>
                  <TouchableOpacity
                    onPress={() => setExpandedId(isExpanded ? null : u.id)}
                    activeOpacity={0.8}
                    style={styles.userCardHeader}
                  >
                    <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                      <Text style={styles.avatarText}>{u.name.charAt(0).toUpperCase() || "?"}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.userName, { color: colors.foreground }]}>{u.name || "(tanpa nama)"}</Text>
                      <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{u.email}</Text>
                      <Text style={[styles.userBalance, { color: colors.success }]}>{formatRupiah(u.balance)}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 4 }}>
                      <Text style={[styles.chevron, { color: colors.mutedForeground }]}>{isExpanded ? "▲" : "▼"}</Text>
                      <Text style={[styles.txCount, { color: colors.mutedForeground }]}>{u.transaction_count} trx</Text>
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={[styles.userDetail, { borderTopColor: colors.border }]}>
                      {[
                        { label: "ID", value: u.id },
                        { label: "No. HP", value: u.phone || "—" },
                        { label: "Daftar", value: formatDate(u.registered_at) },
                        { label: "Login Terakhir", value: formatDate(u.last_login) },
                        { label: "Total Login", value: `${u.login_count}×` },
                        { label: "Total Belanja", value: formatRupiah(u.total_spent) },
                      ].map((row) => (
                        <View key={row.label} style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                          <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                          <Text style={[styles.detailValue, { color: colors.foreground }]}>{row.value}</Text>
                        </View>
                      ))}

                      <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Password</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <Text style={[styles.detailValue, { color: colors.foreground }]}>
                            {passVisible ? maskPassword(u.password) : "••••••••"}
                          </Text>
                          <TouchableOpacity onPress={() => setShowPass((p) => ({ ...p, [u.id]: !p[u.id] }))}>
                            <Text style={{ fontSize: 13, color: colors.primary }}>{passVisible ? "Sembunyikan" : "Tampilkan"}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.actionBtns}>
                        <TouchableOpacity
                          onPress={() => { setEditBalanceId(isEditBal ? null : u.id); setNewBalance(u.balance.toString()); setEditPassId(null); }}
                          style={[styles.actionBtn, { backgroundColor: colors.primaryLight, borderRadius: 8 }]}
                        >
                          <Text style={[styles.actionBtnText, { color: colors.primary }]}>💰 Edit Saldo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => { setEditPassId(isEditPass ? null : u.id); setNewPass(""); setEditBalanceId(null); }}
                          style={[styles.actionBtn, { backgroundColor: "#fef3c7", borderRadius: 8 }]}
                        >
                          <Text style={[styles.actionBtnText, { color: "#92400e" }]}>🔑 Reset PW</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDelete(u.id, u.name)}
                          style={[styles.actionBtn, { backgroundColor: "#fee2e2", borderRadius: 8 }]}
                        >
                          <Text style={[styles.actionBtnText, { color: colors.destructive }]}>🗑️ Hapus</Text>
                        </TouchableOpacity>
                      </View>

                      {isEditBal && (
                        <View style={[styles.editBox, { backgroundColor: colors.secondary, borderRadius: 10 }]}>
                          <Text style={[styles.editLabel, { color: colors.foreground }]}>Saldo Baru</Text>
                          <TextInput
                            value={newBalance}
                            onChangeText={setNewBalance}
                            keyboardType="numeric"
                            placeholder="Masukkan saldo"
                            placeholderTextColor={colors.mutedForeground}
                            style={[styles.editInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, borderRadius: 8 }]}
                          />
                          <View style={{ flexDirection: "row", gap: 8 }}>
                            {[50000, 100000, 200000, 500000].map((preset) => (
                              <TouchableOpacity key={preset} onPress={() => setNewBalance(preset.toString())}
                                style={[styles.presetBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Text style={{ fontSize: 10, color: colors.mutedForeground }}>{(preset / 1000).toFixed(0)}rb</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                          <TouchableOpacity
                            onPress={() => handleUpdateBalance(u.id)}
                            disabled={actionLoading}
                            style={[styles.saveBtn, { backgroundColor: colors.primary, borderRadius: 8 }]}
                          >
                            {actionLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Simpan Saldo</Text>}
                          </TouchableOpacity>
                        </View>
                      )}

                      {isEditPass && (
                        <View style={[styles.editBox, { backgroundColor: "#fef3c7", borderRadius: 10 }]}>
                          <Text style={[styles.editLabel, { color: "#92400e" }]}>Password Baru</Text>
                          <TextInput
                            value={newPass}
                            onChangeText={setNewPass}
                            placeholder="Min. 6 karakter"
                            placeholderTextColor="#92400e80"
                            style={[styles.editInput, { backgroundColor: "#fff", borderColor: "#f59e0b", color: "#000", borderRadius: 8 }]}
                          />
                          <TouchableOpacity
                            onPress={() => handleResetPassword(u.id)}
                            disabled={actionLoading}
                            style={[styles.saveBtn, { backgroundColor: "#f59e0b", borderRadius: 8 }]}
                          >
                            {actionLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Simpan Password</Text>}
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  backBtn: { fontSize: 24, fontWeight: "300" },
  refreshBtn: { fontSize: 22, fontWeight: "300" },
  title: { fontSize: 17, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular" },
  emptyBox: { padding: 32, alignItems: "center", gap: 12, borderWidth: 1 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  statCard: { flex: 1, padding: 10, alignItems: "center", borderWidth: 1 },
  statValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  searchInput: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular" },
  userCard: { borderWidth: 1 },
  userCardHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  userName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  userEmail: { fontSize: 12, fontFamily: "Inter_400Regular" },
  userBalance: { fontSize: 13, fontFamily: "Inter_700Bold" },
  chevron: { fontSize: 12 },
  txCount: { fontSize: 11, fontFamily: "Inter_400Regular" },
  userDetail: { borderTopWidth: 1, paddingTop: 4 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 0.5 },
  detailLabel: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  detailValue: { fontSize: 12, fontFamily: "Inter_500Medium", flex: 2, textAlign: "right" },
  actionBtns: { flexDirection: "row", padding: 12, gap: 8 },
  actionBtn: { flex: 1, paddingVertical: 8, alignItems: "center" },
  actionBtnText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  editBox: { margin: 12, marginTop: 0, padding: 14, gap: 10 },
  editLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  editInput: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular" },
  presetBtn: { flex: 1, paddingVertical: 6, alignItems: "center", borderWidth: 1, borderRadius: 6 },
  saveBtn: { paddingVertical: 12, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
});
