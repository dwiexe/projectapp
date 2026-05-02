import React from "react";
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const ADMIN_WA = "6285783385872";
const WA_MESSAGE = encodeURIComponent(
  "Halo Admin PayKita 👋\n\nSaya ingin meminta bantuan reset password akun saya.\n\nMohon segera dibantu, terima kasih 🙏"
);

export default function ResetPasswordScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleOpenWA = () => {
    const url = `https://wa.me/${ADMIN_WA}?text=${WA_MESSAGE}`;
    Linking.openURL(url);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 40),
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>🔐</Text>

        <Text style={[styles.title, { color: colors.foreground }]}>
          Keamanan Akun
        </Text>

        <Text style={[styles.desc, { color: colors.mutedForeground }]}>
          Hubungi admin kami melalui WhatsApp untuk mereset password akun kamu.
          Siapkan email yang terdaftar untuk verifikasi.
        </Text>

        <TouchableOpacity
          onPress={handleOpenWA}
          activeOpacity={0.85}
          style={[styles.waBtn, { borderRadius: colors.radius }]}
        >
          <Text style={styles.waIcon}>💬</Text>
          <View>
            <Text style={styles.waBtnTitle}>Chat Admin via WhatsApp</Text>
            <Text style={styles.waBtnSub}>Respons cepat · Senin–Minggu</Text>
          </View>
        </TouchableOpacity>

        <View style={[styles.infoBox, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>📋 Siapkan informasi ini:</Text>
          <Text style={[styles.infoItem, { color: colors.mutedForeground }]}>• Email yang terdaftar di akun</Text>
          <Text style={[styles.infoItem, { color: colors.mutedForeground }]}>• Nama lengkap kamu</Text>
          <Text style={[styles.infoItem, { color: colors.mutedForeground }]}>• Nomor HP yang terdaftar</Text>
        </View>
      </View>

      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={[styles.backText, { color: colors.primary }]}>← Kembali ke Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  icon: {
    fontSize: 64,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  desc: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 23,
  },
  waBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#25D366",
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: "100%",
    shadowColor: "#25D366",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  waIcon: {
    fontSize: 28,
  },
  waBtnTitle: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  waBtnSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  infoBox: {
    width: "100%",
    padding: 16,
    gap: 6,
  },
  infoTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  infoItem: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  backBtn: {
    alignItems: "center",
    paddingVertical: 16,
  },
  backText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});
