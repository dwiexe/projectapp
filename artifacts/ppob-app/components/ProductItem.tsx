import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import type { Product } from "@/services/api";

function formatRupiah(amount: number) {
  return "Rp " + amount.toLocaleString("id-ID");
}

interface ProductItemProps {
  product: Product;
  onSelect: (product: Product) => void;
  selected?: boolean;
}

export function ProductItem({ product, onSelect, selected }: ProductItemProps) {
  const colors = useColors();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onSelect(product)}
      style={[
        styles.card,
        {
          backgroundColor: selected ? colors.primaryLight : colors.card,
          borderColor: selected ? colors.primary : colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={2}>
          {product.product_name}
        </Text>
        <Text style={[styles.brand, { color: colors.mutedForeground }]}>
          {product.brand} · {product.category}
        </Text>
        {product.desc ? (
          <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={1}>
            {product.desc}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>
        <Text style={[styles.price, { color: colors.primary }]}>
          {formatRupiah(product.price)}
        </Text>
        {selected && (
          <Text style={{ fontSize: 18 }}>✅</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  brand: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  desc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  right: {
    alignItems: "flex-end",
    gap: 6,
  },
  price: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
});
