import React, { useState, useMemo } from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const ADMIN_WA = "6285783385872";

const CATEGORIES = [
  { id: "all", label: "Semua", icon: "🔍" },
  { id: "akun", label: "Akun & Login", icon: "👤" },
  { id: "topup", label: "Top Up", icon: "💰" },
  { id: "transaksi", label: "Transaksi", icon: "⚡" },
  { id: "komplain", label: "Komplain", icon: "🔄" },
  { id: "keamanan", label: "Keamanan", icon: "🔒" },
  { id: "admin", label: "Layanan Admin", icon: "🎧" },
];

const FAQS = [
  {
    id: 1,
    category: "akun",
    q: "Bagaimana cara daftar akun?",
    a: "Buka aplikasi → tap Daftar di halaman login → isi nama, email, nomor HP, dan password → tap Daftar Sekarang. Akun langsung aktif dan kamu mendapat saldo awal.",
  },
  {
    id: 2,
    category: "akun",
    q: "Saya lupa password, harus bagaimana?",
    a: "Tap 'Lupa Password?' di halaman login → kamu akan diarahkan ke WhatsApp admin. Siapkan email terdaftar, nama lengkap, dan nomor HP untuk verifikasi.",
  },
  {
    id: 3,
    category: "akun",
    q: "Apakah akun bisa dipakai di beberapa HP?",
    a: "Bisa. Login dengan email dan password yang sama di HP lain. Data saldo dan transaksi tersimpan di server.",
  },
  {
    id: 4,
    category: "topup",
    q: "Bagaimana cara top up saldo?",
    a: "Buka menu Top Up Saldo di Profil atau halaman utama → pilih nominal → lakukan pembayaran via QRIS yang muncul → saldo otomatis masuk setelah pembayaran berhasil.",
  },
  {
    id: 5,
    category: "topup",
    q: "Saldo belum masuk padahal sudah bayar?",
    a: "Tunggu 1–5 menit, sistem sedang memproses. Jika lebih dari 10 menit belum masuk, hubungi admin dengan sertakan bukti transfer dan nominal top up.",
  },
  {
    id: 6,
    category: "topup",
    q: "Minimal top up berapa?",
    a: "Minimal top up Rp 1.000. Tidak ada batas maksimal, tapi sesuaikan dengan kebutuhan transaksi kamu.",
  },
  {
    id: 7,
    category: "transaksi",
    q: "Kenapa transaksi saya masih pending?",
    a: "Pending artinya transaksi sedang diproses oleh provider. Biasanya selesai dalam 1–15 menit. Cek kembali di Riwayat Transaksi. Jika lebih dari 30 menit, hubungi admin.",
  },
  {
    id: 8,
    category: "transaksi",
    q: "Saldo terpotong tapi transaksi gagal?",
    a: "Tenang — jika transaksi benar-benar gagal, saldo akan otomatis dikembalikan dalam waktu 1×24 jam. Jika belum kembali, hubungi admin dengan menyertakan ID transaksi.",
  },
  {
    id: 9,
    category: "transaksi",
    q: "Produk sudah dibeli tapi belum masuk ke nomor tujuan?",
    a: "Pastikan nomor tujuan sudah benar. Tunggu 5–15 menit. Jika tetap belum masuk, cek status di Riwayat Transaksi. Status 'Sukses' tapi produk belum masuk → hubungi admin.",
  },
  {
    id: 10,
    category: "transaksi",
    q: "Nomor tujuan salah, bisa dibatalkan?",
    a: "Jika transaksi sudah diproses ke provider, biasanya tidak bisa dibatalkan. Pastikan selalu cek nomor tujuan sebelum tap Konfirmasi Pembayaran.",
  },
  {
    id: 11,
    category: "transaksi",
    q: "Bagaimana cara cek riwayat transaksi?",
    a: "Buka tab Riwayat di menu bawah aplikasi. Semua transaksi (berhasil, pending, gagal) tersimpan di sana lengkap dengan detail dan ID transaksi.",
  },
  {
    id: 12,
    category: "komplain",
    q: "Bagaimana cara komplain transaksi?",
    a: "Siapkan: ID transaksi, nomor tujuan, nominal, dan kronologi singkat. Kirim ke admin via WhatsApp agar bisa diproses lebih cepat.",
  },
  {
    id: 13,
    category: "komplain",
    q: "Apakah saldo bisa direfund?",
    a: "Refund mengikuti kebijakan layanan dan status transaksi dari provider. Jika ada kendala, kirim detail transaksi ke admin untuk pengecekan dan proses lebih lanjut.",
  },
  {
    id: 14,
    category: "keamanan",
    q: "Bagaimana cara ganti password?",
    a: "Hubungi admin via WhatsApp dari menu Keamanan Akun. Admin akan memverifikasi identitas kamu sebelum mereset password.",
  },
  {
    id: 15,
    category: "admin",
    q: "Kapan admin bisa dihubungi?",
    a: "Admin melayani Senin–Minggu, pukul 08.00–21.00 WIB. Di luar jam tersebut, pesan tetap bisa dikirim dan akan dibalas saat jam aktif.",
  },
];

function AccordionItem({ item, colors }: { item: typeof FAQS[0]; colors: ReturnType<typeof useColors> }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      onPress={() => setOpen((v) => !v)}
      activeOpacity={0.8}
      style={[styles.faqItem, { borderColor: colors.border, backgroundColor: colors.card }]}
    >
      <View style={styles.faqHeader}>
        <Text style={[styles.faqQ, { color: colors.foreground, flex: 1 }]}>{item.q}</Text>
        <Text style={[styles.faqChevron, { color: colors.primary }]}>{open ? "▲" : "▼"}</Text>
      </View>
      {open && (
        <Text style={[styles.faqA, { color: colors.mutedForeground }]}>{item.a}</Text>
      )}
    </TouchableOpacity>
  );
}

export default function BantuanScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = useMemo(() => {
    return FAQS.filter((f) => {
      const matchCat = activeCategory === "all" || f.category === activeCategory;
      const matchSearch =
        search.trim() === "" ||
        f.q.toLowerCase().includes(search.toLowerCase()) ||
        f.a.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  const openWA = (msg?: string) => {
    const text = encodeURIComponent(
      msg || "Halo Admin PayKita 👋\n\nSaya butuh bantuan terkait akun/transaksi saya.\n\nMohon bantuannya ya, terima kasih 🙏"
    );
    Linking.openURL(`https://wa.me/${ADMIN_WA}?text=${text}`);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: insets.top + (Platform.OS === "web" ? 20 : 16),
        paddingBottom: insets.bottom + 40,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Bantuan & FAQ</Text>
        <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>
          Temukan jawaban cepat untuk kendala akun, saldo, dan transaksi Anda.
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={[styles.quickActions, { paddingHorizontal: 16 }]}>
        <TouchableOpacity
          onPress={() => openWA()}
          style={[styles.qaBtn, { backgroundColor: "#25D366", borderRadius: colors.radius }]}
          activeOpacity={0.85}
        >
          <Text style={styles.qaIcon}>💬</Text>
          <View>
            <Text style={styles.qaBtnLabel}>Chat Admin</Text>
            <Text style={styles.qaBtnSub}>via WhatsApp</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/auth/reset-password")}
          style={[styles.qaBtn, { backgroundColor: colors.primary, borderRadius: colors.radius, flex: 0.9 }]}
          activeOpacity={0.85}
        >
          <Text style={styles.qaIcon}>🔒</Text>
          <View>
            <Text style={styles.qaBtnLabel}>Keamanan</Text>
            <Text style={styles.qaBtnSub}>Reset Password</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/history")}
          style={[styles.qaBtn, { backgroundColor: colors.muted, borderRadius: colors.radius, flex: 0.9 }]}
          activeOpacity={0.85}
        >
          <Text style={styles.qaIcon}>📋</Text>
          <View>
            <Text style={[styles.qaBtnLabel, { color: colors.foreground }]}>Riwayat</Text>
            <Text style={[styles.qaBtnSub, { color: colors.mutedForeground }]}>Transaksi</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { paddingHorizontal: 16 }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.muted, borderRadius: colors.radius, borderColor: colors.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Cari pertanyaan..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text style={{ color: colors.mutedForeground, fontSize: 16, paddingRight: 4 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setActiveCategory(cat.id)}
              style={[
                styles.catChip,
                {
                  backgroundColor: active ? colors.primary : colors.muted,
                  borderColor: active ? colors.primary : colors.border,
                  borderRadius: 20,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text style={styles.catIcon}>{cat.icon}</Text>
              <Text style={[styles.catLabel, { color: active ? "#fff" : colors.foreground }]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* FAQ List */}
      <View style={[styles.faqList, { paddingHorizontal: 16 }]}>
        <Text style={[styles.faqCount, { color: colors.mutedForeground }]}>
          {filtered.length} pertanyaan ditemukan
        </Text>
        {filtered.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
            <Text style={styles.emptyIcon}>🤔</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Tidak ditemukan</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Coba kata kunci lain atau hubungi admin langsung
            </Text>
          </View>
        ) : (
          filtered.map((item) => (
            <AccordionItem key={item.id} item={item} colors={colors} />
          ))
        )}
      </View>

      {/* Info Footer */}
      <View style={[styles.infoFooter, { marginHorizontal: 16, backgroundColor: colors.muted, borderRadius: colors.radius }]}>
        <Text style={[styles.infoTitle, { color: colors.foreground }]}>🎧 Layanan Admin</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🕐</Text>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Jam operasional: Senin–Minggu, 08.00–21.00 WIB
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>⚡</Text>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Estimasi respons: 5–30 menit di jam aktif
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📄</Text>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Saat komplain, siapkan ID transaksi agar bisa diproses lebih cepat
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => openWA("Halo Admin PayKita 👋\n\nSaya ingin menyampaikan komplain transaksi.\n\nID Transaksi: [isi di sini]\nKendala: [jelaskan singkat]\n\nMohon bantuannya 🙏")}
          style={[styles.komplainBtn, { backgroundColor: "#25D366", borderRadius: colors.radius }]}
          activeOpacity={0.85}
        >
          <Text style={styles.komplainBtnText}>💬  Hubungi Admin Sekarang</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { gap: 6, marginBottom: 20 },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  pageTitle: { fontSize: 26, fontFamily: "Inter_700Bold" },
  pageSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },

  quickActions: { flexDirection: "row", gap: 8, marginBottom: 20 },
  qaBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  qaIcon: { fontSize: 20 },
  qaBtnLabel: { color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold" },
  qaBtnSub: { color: "rgba(255,255,255,0.8)", fontSize: 10, fontFamily: "Inter_400Regular" },

  searchWrap: { marginBottom: 16 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },

  categories: { paddingHorizontal: 16, gap: 8, marginBottom: 20, paddingVertical: 2 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  catIcon: { fontSize: 13 },
  catLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },

  faqList: { gap: 10, marginBottom: 24 },
  faqCount: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 4 },
  faqItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  faqHeader: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  faqQ: { fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 20 },
  faqChevron: { fontSize: 11, marginTop: 2 },
  faqA: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },

  emptyBox: { alignItems: "center", padding: 32, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },

  infoFooter: { padding: 16, gap: 10, marginBottom: 8 },
  infoTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 4 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  infoIcon: { fontSize: 14, marginTop: 1 },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  komplainBtn: { marginTop: 8, paddingVertical: 12, alignItems: "center" },
  komplainBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
});
