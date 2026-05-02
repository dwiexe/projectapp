import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { api, type Product } from "@/services/api";
import { ProductItem } from "@/components/ProductItem";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ProductsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { category, brand } = useLocalSearchParams<{ category: string; brand: string }>();

  const [customerNo, setCustomerNo] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [step, setStep] = useState<"input" | "select">("input");

  const { data: products = [], isLoading, error, refetch } = useQuery({
    queryKey: ["products", category, brand],
    queryFn: () => api.getProducts(category, brand),
  });

  const filtered = products.filter(
    (p) =>
      p.product_name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
  );

  const handleContinue = () => {
    if (!customerNo.trim()) return;
    setStep("select");
  };

  const handleSelectProduct = (product: Product) => {
    setSelected(product);
  };

  const handleBuy = () => {
    if (!selected || !customerNo) return;
    router.push(
      `/transaction/confirm?sku=${selected.buyer_sku_code}&no=${customerNo}&price=${selected.price}&name=${encodeURIComponent(selected.product_name)}&category=${encodeURIComponent(selected.category)}`
    );
  };

  const inputPlaceholder = category === "PLN"
    ? "ID Pelanggan PLN (contoh: 12345678)"
    : category === "E-Money" || category === "E-Wallet"
    ? "Nomor HP terdaftar"
    : category === "Games"
    ? "ID Game / User ID"
    : "Nomor HP tujuan";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
            <Text style={[styles.backIcon, { color: colors.foreground }]}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.title, { color: colors.foreground }]}>{brand || category || "Produk"}</Text>
            {category && brand && (
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{category}</Text>
            )}
          </View>
          <View style={{ width: 22 }} />
        </View>
      </View>

      {step === "input" ? (
        <View style={[styles.inputStep, { paddingBottom: insets.bottom + 20 }]}>
          <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            <View style={styles.brandHeader}>
              <Text style={styles.brandEmoji}>📋</Text>
              <View>
                <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                  {brand ? `${brand} - ${category}` : category || "Pilih Produk"}
                </Text>
                <Text style={[styles.inputHint, { color: colors.mutedForeground }]}>
                  {inputPlaceholder}
                </Text>
              </View>
            </View>
            <Input
              placeholder={inputPlaceholder}
              keyboardType={category === "Games" ? "default" : "numeric"}
              leftIcon="hash"
              value={customerNo}
              onChangeText={setCustomerNo}
            />
            <Button
              title="Lanjut Pilih Produk"
              onPress={handleContinue}
              fullWidth
              disabled={!customerNo.trim()}
            />
          </View>
        </View>
      ) : (
        <>
          <View style={[styles.targetBar, { backgroundColor: colors.primaryLight, borderBottomColor: colors.border }]}>
            <Text style={{ fontSize: 16, color: colors.primary }}>#</Text>
            <Text style={[styles.targetNo, { color: colors.primary }]}>{customerNo}</Text>
            <TouchableOpacity onPress={() => { setStep("input"); setSelected(null); }}>
              <Text style={{ fontSize: 16, color: colors.primary }}>✏️</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.searchBox, { borderBottomColor: colors.border }]}>
            <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Cari produk..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Text style={{ fontSize: 16, color: colors.mutedForeground }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Memuat produk...</Text>
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.stateIcon}>⚠️</Text>
              <Text style={[styles.errorText, { color: colors.destructive }]}>Gagal memuat produk</Text>
              <Button title="Coba Lagi" onPress={() => refetch()} size="sm" variant="outline" />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.buyer_sku_code}
              contentContainerStyle={[
                styles.list,
                { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 120) },
              ]}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item }) => (
                <ProductItem
                  product={item}
                  onSelect={handleSelectProduct}
                  selected={selected?.buyer_sku_code === item.buyer_sku_code}
                />
              )}
              ListEmptyComponent={
                <View style={styles.center}>
                  <Text style={styles.stateIcon}>📦</Text>
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    Produk tidak ditemukan
                  </Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
            />
          )}

          {selected && (
            <View
              style={[
                styles.buyBar,
                {
                  backgroundColor: colors.card,
                  borderTopColor: colors.border,
                  paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 12),
                },
              ]}
            >
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={[styles.selectedName, { color: colors.foreground }]} numberOfLines={1}>
                  {selected.product_name}
                </Text>
                <Text style={[styles.selectedPrice, { color: colors.primary }]}>
                  Rp {selected.price.toLocaleString("id-ID")}
                </Text>
              </View>
              <Button title="Beli Sekarang" onPress={handleBuy} />
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  backIcon: {
    fontSize: 24,
    fontWeight: "300",
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  inputStep: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  inputCard: {
    padding: 20,
    borderWidth: 1,
    gap: 14,
  },
  brandHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandEmoji: {
    fontSize: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  inputHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  targetBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  targetNo: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: 36,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  stateIcon: {
    fontSize: 44,
  },
  errorText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  buyBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  selectedName: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  selectedPrice: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
});
