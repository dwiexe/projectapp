import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useTransactions } from "@/context/TransactionContext";
import { BalanceCard } from "@/components/BalanceCard";
import { ServiceGrid } from "@/components/ServiceGrid";
import { TransactionCard } from "@/components/TransactionCard";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BANNER_WIDTH = SCREEN_WIDTH - 32;

const BANNERS = [
  {
    id: 1,
    gradient: ["#1e40af", "#6d28d9"] as [string, string],
    tag: "🎉 PROMO SPESIAL",
    title: "Cashback 5%",
    desc: "untuk semua transaksi pulsa bulan ini",
    cta: "Beli Sekarang →",
    route: "/transaction/products?category=Pulsa",
    illus: "📱💸",
  },
  {
    id: 2,
    gradient: ["#065f46", "#0d9488"] as [string, string],
    tag: "⚡ HEMAT LEBIH",
    title: "Token PLN Murah",
    desc: "Beli token listrik tanpa biaya admin",
    cta: "Beli Token →",
    route: "/transaction/products?category=PLN",
    illus: "💡⚡",
  },
];

function PromoBannerCarousel() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * BANNER_WIDTH, animated: true });
    setActiveIndex(index);
  };

  useEffect(() => {
    autoRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % BANNERS.length;
        scrollRef.current?.scrollTo({ x: next * BANNER_WIDTH, animated: true });
        return next;
      });
    }, 3500);
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, []);

  const handleScrollEnd = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
    setActiveIndex(index);
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % BANNERS.length;
        scrollRef.current?.scrollTo({ x: next * BANNER_WIDTH, animated: true });
        return next;
      });
    }, 3500);
  };

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        decelerationRate="fast"
        snapToInterval={BANNER_WIDTH}
        snapToAlignment="start"
        style={{ width: BANNER_WIDTH }}
      >
        {BANNERS.map((b) => (
          <LinearGradient
            key={b.id}
            colors={b.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.promoBanner, { width: BANNER_WIDTH, borderRadius: 14 }]}
          >
            <View style={styles.promoLeft}>
              <Text style={styles.promoTag}>{b.tag}</Text>
              <Text style={styles.promoTitle}>{b.title}</Text>
              <Text style={styles.promoDesc}>{b.desc}</Text>
              <TouchableOpacity
                style={styles.promoCta}
                onPress={() => router.push(b.route as never)}
              >
                <Text style={styles.promoCtaText}>{b.cta}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.promoIllus}>{b.illus}</Text>
          </LinearGradient>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {BANNERS.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)}>
            <View
              style={[
                styles.dot,
                i === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { transactions } = useTransactions();

  const recentTrx = transactions.slice(0, 3);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90),
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topRow}>
        <View>
          <View style={styles.appNameRow}>
            <Text style={[styles.appName, { color: colors.primary }]}>⚡ PayKita</Text>
          </View>
          <Text style={[styles.welcomeText, { color: colors.mutedForeground }]}>
            Halo, {user?.name?.split(" ")[0] || "Pengguna"}!
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/profile")}
          style={[styles.notifBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={styles.notifIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <BalanceCard />

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
          activeOpacity={0.8}
          onPress={() => router.push("/topup")}
        >
          <Text style={styles.quickBtnIcon}>⬆️</Text>
          <Text style={styles.quickBtnText}>Top Up</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickBtn, { backgroundColor: colors.success, borderRadius: colors.radius }]}
          activeOpacity={0.8}
          onPress={() => router.push("/(tabs)/history")}
        >
          <Text style={styles.quickBtnIcon}>📋</Text>
          <Text style={styles.quickBtnText}>Riwayat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickBtn, { backgroundColor: colors.warning, borderRadius: colors.radius }]}
          activeOpacity={0.8}
          onPress={() => router.push("/transaction/products?category=Semua")}
        >
          <Text style={styles.quickBtnIcon}>🛒</Text>
          <Text style={styles.quickBtnText}>Beli</Text>
        </TouchableOpacity>
      </View>

      <PromoBannerCarousel />

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Layanan Prabayar</Text>
        <ServiceGrid
          onSelectService={(category) =>
            router.push(`/transaction/operator?category=${encodeURIComponent(category)}`)
          }
        />
      </View>

      {recentTrx.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Transaksi Terkini
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/history")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>Lihat Semua →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.trxList}>
            {recentTrx.map((trx) => (
              <TransactionCard
                key={trx.id}
                transaction={trx}
                onPress={() => router.push(`/transaction/detail?id=${trx.id}`)}
              />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 20,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  appName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  welcomeText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notifIcon: {
    fontSize: 18,
  },
  quickActions: {
    flexDirection: "row",
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 12,
  },
  quickBtnIcon: {
    fontSize: 16,
  },
  quickBtnText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  promoBanner: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 130,
    overflow: "hidden",
  },
  promoLeft: {
    flex: 1,
    gap: 4,
  },
  promoTag: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  promoTitle: {
    color: "#fff",
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  promoDesc: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  promoCta: {
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  promoCtaText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  promoIllus: {
    fontSize: 48,
    paddingLeft: 16,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
  dotActive: {
    width: 20,
    backgroundColor: "#1e40af",
  },
  dotInactive: {
    width: 7,
    backgroundColor: "#cbd5e1",
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  seeAll: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  trxList: {
    gap: 8,
  },
});
