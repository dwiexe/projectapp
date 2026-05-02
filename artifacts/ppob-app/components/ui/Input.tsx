import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightIconPress?: () => void;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  isPassword,
  style,
  ...props
}: InputProps) {
  const colors = useColors();
  const [showPassword, setShowPassword] = useState(false);

  const secureEntry = isPassword ? !showPassword : props.secureTextEntry;

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      )}
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.destructive : colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        {leftIcon && (
          <Feather
            name={leftIcon}
            size={18}
            color={colors.mutedForeground}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            {
              color: colors.foreground,
              fontFamily: "Inter_400Regular",
              paddingLeft: leftIcon ? 0 : 16,
              paddingRight: isPassword || rightIcon ? 0 : 16,
            },
            style,
          ]}
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry={secureEntry}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIcon}
          >
            <Feather
              name={showPassword ? "eye-off" : "eye"}
              size={18}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>
        )}
        {rightIcon && !isPassword && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Feather name={rightIcon} size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    height: 52,
  },
  leftIcon: { paddingLeft: 14, paddingRight: 8 },
  rightIcon: { paddingHorizontal: 14 },
  input: {
    flex: 1,
    fontSize: 15,
    height: "100%",
  },
  error: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
