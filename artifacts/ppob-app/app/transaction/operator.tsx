import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { api } from "@/services/api";
import { PRABAYAR_SERVICES } from "@/components/ServiceGrid";

const OPERATOR_EMOJI: Record<string, string> = {
  "Telkomsel": "🔴",
  "XL Axiata": "🔵",
  "XL": "🔵",
  "Indosat Ooredoo": "🟡",
  "Tri": "⚫",
  "Smartfren": "🟣",
  "PLN": "⚡",
  "GoPay": "🟢",
  "OVO": "🟣",
  "DANA": "🔵",
  "ShopeePay": "🟠",
  "LinkAja": "🔴",
  "Free Fire": "🔥",
  "Mobile Legends": "⚔️",
  "PUBG Mobile": "🎯",
  "Genshin Impact": "✨",
  "Arena of Valor": "🏆",
  "Transvision": "📡",
  "Nexmedia": "📺",
  "Vidio": "▶️",
};

function getOperatorEmoji(name: string): string {
  for (const [key, emoji] of Object.entries(OPERATOR_EMOJI)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return emoji;
  }
  return "📦";
}

function getOperatorColor(name: string, index: number): string {
  const colors = ["#3b82f6","#ef4444","#10b981","#f59e0b","#8b5cf6","#06b6d4","#f97316","#64748b","#a855f7","#ec4899"];
  return colors[index % colors.length];
}

export default function OperatorScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { category } = useLocalSearchParams<{ category: string }>();

  const service = PRABAYAR_SERVICES.find((s) => s.category === category);

  const { data: operators = [], isLoading, error, refetch } = useQuery({
    queryKey: ["operators", category],
    queryFn: () => api.getOperators(category || ""),
    enabled: !!category,
  });

  const handleSelectOperator = (brand: string) => {
    router.push(
      `/transaction/products?category=${encodeURIComponent(category || "")}&brand=${encodeURIComponent(brand)}`
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={[styles.backBtn, { color: colors.foreground }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {service && <Text style={styles.headerEmoji}>{service.emoji}</Text>}
          <Text style={[styles.title, { color: colors.foreground }]}>
            {category || "Pilih Layanan"}
          </Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <View style={[styles.subHeader, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.subHeaderText, { color: colors.mutedForeground }]}>
          Pilih operator / provider
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Memuat operator...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 48 }}>⚠️</Text>
          <Text style={[styles.errorText, { color: colors.destructive }]}>
            Gagal memuat operator
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : operators.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 48 }}>📭</Text>
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
            Tidak ada operator tersedia
          </Text>
        </View>
      ) : (
        <FlatList
          data={operators}
          keyExtractor={(item) => item.name}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 30) },
          ]}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={({ item, index }) => {
            const emoji = getOperatorEmoji(item.name);
            const color = getOperatorColor(item.name, index);
            return (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleSelectOperator(item.name)}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <View style={[styles.iconWrap, { backgroundColor: color + "18", borderRadius: 14, borderWidth: 1, borderColor: color + "30" }]}>
                  <Text style={styles.cardEmoji}>{emoji}</Text>
                </View>
                <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={[styles.cardCount, { color: colors.mutedForeground }]}>
                  {item.count} produk
                </Text>
              </TouchableOpacity>
            );
          }}
          showsVerticalScrollIndicator={false}
        />
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
  backBtn: {
    fontSize: 24,
    fontWeight: "300",
    width: 32,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerEmoji: {
    fontSize: 22,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  subHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  subHeaderText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  errorText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  row: {
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    gap: 10,
    minHeight: 130,
    justifyContent: "center",
  },
  iconWrap: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  cardEmoji: {
    fontSize: 30,
    textAlign: "center",
  },
  cardName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    lineHeight: 18,
  },
  cardCount: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
