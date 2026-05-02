import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/useColors";
import { admin, type AdminStatus } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const ADMIN_TOKEN_KEY = "admin_token";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: valueColor || colors.foreground }]}>{value}</Text>
    </View>
  );
}

export default function AdminScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [token, setToken] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [savedToken, setSavedToken] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [username, setUsername] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [ttlStr, setTtlStr] = useState("");
  const [midtransKey, setMidtransKey] = useState("");
  const [midtransSandbox, setMidtransSandbox] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);

  const [syncLoading, setSyncLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const loadStatus = useCallback(async (tok: string) => {
    setStatusLoading(true);
    try {
      const s = await admin.getStatus(tok);
      setStatus(s);
      setUsername(s.digiflazz_username === "(belum diset)" ? "" : s.digiflazz_username);
      setTtlStr(String(s.cache_ttl_minutes));
      if (typeof (s as any).midtrans_sandbox === "boolean") {
        setMidtransSandbox((s as any).midtrans_sandbox);
      }
    } catch (e) {
      Alert.alert("Error", String(e));
    } finally {
      setStatusLoading(false);
    }
  }, []);

  React.useEffect(() => {
    AsyncStorage.getItem(ADMIN_TOKEN_KEY).then((saved) => {
      if (saved) {
        setSavedToken(saved);
        setToken(saved);
        admin.login(saved).then(() => {
          setIsLoggedIn(true);
          loadStatus(saved);
        }).catch(() => {});
      }
    });
  }, [loadStatus]);

  const handleLogin = async () => {
    if (!token.trim()) return;
    setLoginLoading(true);
    try {
      await admin.login(token.trim());
      await AsyncStorage.setItem(ADMIN_TOKEN_KEY, token.trim());
      setSavedToken(token.trim());
      setIsLoggedIn(true);
      await loadStatus(token.trim());
    } catch (e) {
      Alert.alert("Login Gagal", String(e));
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    const ttl = parseInt(ttlStr, 10);
    if (isNaN(ttl) || ttl < 5) {
      Alert.alert("Error", "Interval sync minimal 5 menit");
      return;
    }
    setConfigSaving(true);
    try {
      const payload: Record<string, string | number | boolean> = {
        cache_ttl_minutes: ttl,
        midtrans_sandbox: midtransSandbox,
      };
      if (username.trim()) payload.digiflazz_username = username.trim();
      if (apiKey.trim()) payload.digiflazz_api_key = apiKey.trim();
      if (midtransKey.trim()) payload.midtrans_server_key = midtransKey.trim();
      await admin.updateConfig(savedToken, payload);
      setApiKey("");
      setMidtransKey("");
      Alert.alert("Berhasil", "Konfigurasi disimpan.");
      await loadStatus(savedToken);
    } catch (e) {
      Alert.alert("Error", String(e));
    } finally {
      setConfigSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncLoading(true);
    try {
      const res = await admin.triggerSync(savedToken);
      Alert.alert("Sync Berhasil", res.message);
      await loadStatus(savedToken);
    } catch (e) {
      Alert.alert("Sync Gagal", String(e));
    } finally {
      setSyncLoading(false);
    }
  };

  const handleClearCache = async () => {
    Alert.alert("Hapus Cache", "Cache produk akan dikosongkan. Sync otomatis dijalankan saat ada permintaan produk berikutnya.", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          setClearLoading(true);
          try {
            await admin.clearCache(savedToken);
            Alert.alert("Berhasil", "Cache dikosongkan.");
            await loadStatus(savedToken);
          } catch (e) {
            Alert.alert("Error", String(e));
          } finally {
            setClearLoading(false);
          }
        },
      },
    ]);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem(ADMIN_TOKEN_KEY);
    setIsLoggedIn(false);
    setToken("");
    setSavedToken("");
    setStatus(null);
  };

  function formatDate(d: string | null) {
    if (!d) return "Belum pernah";
    return new Date(d).toLocaleString("id-ID");
  }

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
        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>🛡️</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Panel Admin</Text>
        </View>
        {isLoggedIn ? (
          <TouchableOpacity onPress={handleLogout} hitSlop={10}>
            <Text style={{ fontSize: 12, color: colors.destructive, fontFamily: "Inter_500Medium" }}>Logout</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 40 }} />}
      </View>

      {!isLoggedIn ? (
        <View style={styles.loginContainer}>
          <View style={[styles.loginCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <Text style={{ fontSize: 44, textAlign: "center" }}>🔐</Text>
            <Text style={[styles.loginTitle, { color: colors.foreground }]}>Masuk sebagai Admin</Text>
            <Text style={[styles.loginSubtitle, { color: colors.mutedForeground }]}>
              Masukkan token admin untuk mengakses panel kontrol
            </Text>
            <Input
              placeholder="Token admin"
              value={token}
              onChangeText={setToken}
              leftIcon="key"
              isPassword={!showApiKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.showKeyRow}>
              <Text style={[styles.showKeyLabel, { color: colors.mutedForeground }]}>Tampilkan token</Text>
              <Switch
                value={showApiKey}
                onValueChange={setShowApiKey}
                trackColor={{ true: colors.primary }}
              />
            </View>
            <Button
              title={loginLoading ? "Memverifikasi..." : "Masuk"}
              onPress={handleLogin}
              fullWidth
              disabled={loginLoading || !token.trim()}
            />
          </View>
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + (Platform.OS === "web" ? 80 : 100) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <Section title="STATUS SERVER">
            {statusLoading ? (
              <ActivityIndicator color={colors.primary} style={{ paddingVertical: 20 }} />
            ) : status ? (
              <>
                <Row
                  label="Mode"
                  value={status.mode === "live" ? "🟢 LIVE (Digiflazz)" : "🟡 DEMO"}
                  valueColor={status.mode === "live" ? colors.success : colors.warning}
                />
                <Row label="Total Produk Cache" value={String(status.total_cached_products)} />
                <Row label="Sync Terakhir" value={formatDate(status.last_sync)} />
                <Row label="Sync Berikutnya" value={formatDate(status.next_sync)} />
                <Row label="Interval Sync" value={`${status.cache_ttl_minutes} menit`} />
              </>
            ) : null}
            <TouchableOpacity
              onPress={() => loadStatus(savedToken)}
              style={[styles.refreshBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.refreshText, { color: colors.primary }]}>🔄 Refresh Status</Text>
            </TouchableOpacity>
          </Section>

          <Section title="KONTROL PRODUK">
            <View style={styles.controlRow}>
              <TouchableOpacity
                onPress={handleSync}
                disabled={syncLoading}
                style={[styles.controlBtn, { backgroundColor: colors.primary, borderRadius: colors.radius, flex: 1 }]}
              >
                {syncLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.controlBtnText}>⚡ Sync Sekarang</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClearCache}
                disabled={clearLoading}
                style={[styles.controlBtn, { backgroundColor: colors.warning + "20", borderRadius: colors.radius, flex: 1, borderWidth: 1, borderColor: colors.warning + "50" }]}
              >
                {clearLoading ? (
                  <ActivityIndicator color={colors.warning} size="small" />
                ) : (
                  <Text style={[styles.controlBtnText, { color: colors.warning }]}>🗑️ Hapus Cache</Text>
                )}
              </TouchableOpacity>
            </View>
          </Section>

          <Section title="👥 MANAJEMEN AKUN PENGGUNA">
            <TouchableOpacity
              onPress={() => router.push({ pathname: "/admin/users", params: { token: savedToken } })}
              activeOpacity={0.8}
              style={[styles.controlBtn, { backgroundColor: "#7c3aed", borderRadius: colors.radius }]}
            >
              <Text style={styles.controlBtnText}>👥  Lihat & Kelola Semua Akun</Text>
            </TouchableOpacity>
            <Text style={[styles.tokenHint, { color: colors.mutedForeground, marginTop: 6 }]}>
              Lihat daftar akun terdaftar, saldo, password, riwayat login, dan statistik transaksi tiap pengguna.
            </Text>
          </Section>

          <Section title="KONFIGURASI DIGIFLAZZ">
            {status && (
              <View style={[styles.statusBadge, {
                backgroundColor: status.mode === "live" ? colors.success + "15" : colors.warning + "15",
                borderColor: status.mode === "live" ? colors.success + "40" : colors.warning + "40",
                borderRadius: 8,
                borderWidth: 1,
                marginBottom: 12,
              }]}>
                <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: status.mode === "live" ? colors.success : colors.warning }}>
                  {status.mode === "live"
                    ? `✅ Terhubung · ${status.digiflazz_username} · API Key: ${status.digiflazz_api_key_preview}`
                    : "⚠️ Mode Demo — isi Username & API Key untuk aktifkan LIVE"}
                </Text>
              </View>
            )}

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Username Digiflazz</Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="contoh: nama_user_anda"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.textField, {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.foreground,
                borderRadius: 10,
                fontFamily: "Inter_400Regular",
              }]}
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 10 }]}>API Key Digiflazz</Text>
            <TextInput
              value={apiKey}
              onChangeText={setApiKey}
              placeholder={status?.digiflazz_api_key_set ? "API Key sudah diset (isi untuk ubah)" : "Paste API Key di sini"}
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.textField, {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.foreground,
                borderRadius: 10,
                fontFamily: "Inter_400Regular",
              }]}
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginTop: 10 }]}>
              Interval Auto-Sync (menit, min. 5)
            </Text>
            <TextInput
              value={ttlStr}
              onChangeText={setTtlStr}
              keyboardType="numeric"
              placeholder="30"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.textField, {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.foreground,
                borderRadius: 10,
                fontFamily: "Inter_400Regular",
              }]}
            />

          </Section>

          <Section title="💳 KONFIGURASI MIDTRANS (QRIS)">
            <View style={{ backgroundColor: "#f0fdf4", borderRadius: 8, padding: 10, marginBottom: 8 }}>
              <Text style={{ fontSize: 12, color: "#166534", fontFamily: "Inter_400Regular", lineHeight: 18 }}>
                {"Daftarkan akun di midtrans.com, lalu copy Server Key dari menu Settings → Access Keys.\n\nMode Sandbox untuk testing, produksi gunakan mode Live."}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginBottom: 0 }]}>
                Mode Sandbox (Testing)
              </Text>
              <Switch
                value={midtransSandbox}
                onValueChange={setMidtransSandbox}
                trackColor={{ true: "#10b981", false: colors.muted }}
                thumbColor="#fff"
              />
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Midtrans Server Key</Text>
            <TextInput
              value={midtransKey}
              onChangeText={setMidtransKey}
              placeholder={
                (status as any)?.midtrans_configured
                  ? "Server Key sudah diset (isi untuk ubah)"
                  : `${midtransSandbox ? "SB-" : ""}Mid-server-xxxx... (kosong = Demo QRIS)`
              }
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.textField, {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.foreground,
                borderRadius: 10,
                fontFamily: "Inter_400Regular",
              }]}
            />
            {(status as any)?.midtrans_configured ? (
              <Text style={{ fontSize: 11, color: "#10b981", fontFamily: "Inter_500Medium", marginTop: 4 }}>
                ✅ Midtrans Server Key aktif · Mode {midtransSandbox ? "Sandbox" : "Live"}
              </Text>
            ) : (
              <Text style={{ fontSize: 11, color: "#f59e0b", fontFamily: "Inter_400Regular", marginTop: 4 }}>
                ⚠️ Server Key belum diset — QRIS berjalan dalam mode Demo
              </Text>
            )}
          </Section>

          <Section title="INFO TOKEN ADMIN">
            <Row label="Token aktif" value={`${savedToken.slice(0, 6)}****`} />
            <Text style={[styles.tokenHint, { color: colors.mutedForeground }]}>
              Ubah token admin melalui environment variable ADMIN_TOKEN di server.
            </Text>
          </Section>
        </ScrollView>
        </KeyboardAvoidingView>
      )}

      {isLoggedIn && (
        <View
          style={[
            styles.saveBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + (Platform.OS === "web" ? 20 : 12),
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleSaveConfig}
            disabled={configSaving}
            activeOpacity={0.8}
            style={[
              styles.saveBtn,
              { backgroundColor: configSaving ? colors.muted : colors.primary, borderRadius: colors.radius },
            ]}
          >
            {configSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>💾  Simpan Semua Konfigurasi</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { fontSize: 24, fontWeight: "300", width: 32 },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerEmoji: { fontSize: 20 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loginCard: {
    padding: 24,
    borderWidth: 1,
    gap: 14,
  },
  loginTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  loginSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  showKeyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  showKeyLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  loginHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  section: {
    padding: 16,
    borderWidth: 1,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  rowValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
    flex: 1,
  },
  refreshBtn: {
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 8,
    borderTopWidth: 1,
  },
  refreshText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  controlRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  controlBtn: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  controlBtnText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  statusBadge: {
    padding: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 6,
  },
  textField: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  tokenHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    paddingTop: 8,
    lineHeight: 18,
  },
  saveBar: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  saveBtn: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
});
