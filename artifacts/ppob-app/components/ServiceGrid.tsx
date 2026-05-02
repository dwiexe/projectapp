import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

export interface ServiceItem {
  id: string;
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  category: string;
}

export const PRABAYAR_SERVICES: ServiceItem[] = [
  { id: "pulsa",      name: "Pulsa",       emoji: "📱", color: "#3b82f6", bgColor: "#eff6ff",  category: "Pulsa" },
  { id: "data",       name: "Paket Data",  emoji: "📶", color: "#8b5cf6", bgColor: "#f5f3ff",  category: "Data" },
  { id: "pln",        name: "PLN",         emoji: "⚡", color: "#f59e0b", bgColor: "#fffbeb",  category: "PLN" },
  { id: "emoney",     name: "E-Money",     emoji: "💳", color: "#10b981", bgColor: "#ecfdf5",  category: "E-Money" },
  { id: "games",      name: "Games",       emoji: "🎮", color: "#ef4444", bgColor: "#fef2f2",  category: "Games" },
  { id: "masa-aktif", name: "Masa Aktif",  emoji: "⏰", color: "#f97316", bgColor: "#fff7ed",  category: "Masa Aktif" },
  { id: "sms",        name: "SMS",         emoji: "💬", color: "#06b6d4", bgColor: "#ecfeff",  category: "SMS" },
  { id: "telepon",    name: "Telepon",     emoji: "📞", color: "#64748b", bgColor: "#f8fafc",  category: "Telepon" },
  { id: "tv",         name: "TV",          emoji: "📺", color: "#a855f7", bgColor: "#faf5ff",  category: "TV" },
];

interface ServiceGridProps {
  onSelectService: (category: string) => void;
}

export function ServiceGrid({ onSelectService }: ServiceGridProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      {PRABAYAR_SERVICES.map((service) => (
        <TouchableOpacity
          key={service.id}
          style={styles.item}
          activeOpacity={0.7}
          onPress={() => onSelectService(service.category)}
          testID={`service-${service.id}`}
        >
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: colors.isDark ? service.color + "30" : service.bgColor,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: service.color + "30",
              },
            ]}
          >
            <Text style={styles.emoji}>{service.emoji}</Text>
          </View>
          <Text
            style={[
              styles.label,
              { color: colors.foreground, fontFamily: "Inter_500Medium" },
            ]}
            numberOfLines={2}
          >
            {service.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-start",
  },
  item: {
    width: "18%",
    alignItems: "center",
    gap: 6,
    minWidth: 60,
  },
  iconBox: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  emoji: {
    fontSize: 26,
    textAlign: "center",
  },
  label: {
    fontSize: 10,
    textAlign: "center",
    lineHeight: 13,
  },
});
