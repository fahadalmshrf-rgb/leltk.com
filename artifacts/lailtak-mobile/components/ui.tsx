import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Fonts, FontVariant } from "@/constants/fonts";
import { useColors } from "@/hooks/useColors";

export function useInsetsCompat() {
  const insets = useSafeAreaInsets();
  const top = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottom = Platform.OS === "web" ? Math.max(insets.bottom, 34) : insets.bottom;
  return { top, bottom };
}

type AppTextProps = TextProps & {
  variant?: FontVariant;
  size?: number;
  color?: string;
  align?: "right" | "left" | "center";
};

export function AppText({
  children,
  style,
  variant = "regular",
  size = 16,
  color,
  align = "right",
  ...rest
}: AppTextProps) {
  const colors = useColors();
  return (
    <Text
      style={[
        {
          fontFamily: Fonts[variant],
          fontSize: size,
          lineHeight: size * 1.5,
          color: color ?? colors.foreground,
          textAlign: align,
          writingDirection: "rtl",
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

type ButtonVariant = "primary" | "accent" | "secondary" | "outline" | "ghost";

export function Button({
  title,
  onPress,
  icon,
  variant = "primary",
  disabled,
  loading,
  style,
  size = "md",
}: {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  size?: "md" | "lg";
}) {
  const colors = useColors();
  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "accent"
        ? colors.accent
        : variant === "secondary"
          ? colors.secondary
          : "transparent";
  const fg =
    variant === "primary"
      ? colors.primaryForeground
      : variant === "accent"
        ? colors.accentForeground
        : variant === "secondary"
          ? colors.secondaryForeground
          : colors.primary;
  const border = variant === "outline" ? colors.primary : "transparent";

  return (
    <Pressable
      onPress={() => {
        if (disabled || loading) return;
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
      }}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          flexDirection: "row-reverse",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          backgroundColor: bg,
          borderRadius: colors.radius,
          borderWidth: variant === "outline" ? 1.5 : 0,
          borderColor: border,
          paddingVertical: size === "lg" ? 16 : 13,
          paddingHorizontal: 20,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Feather name={icon} size={18} color={fg} /> : null}
          <Text
            style={{
              fontFamily: Fonts.semibold,
              fontSize: size === "lg" ? 17 : 15,
              color: fg,
              writingDirection: "rtl",
            }}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  color,
  background,
  size = 40,
}: {
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  color?: string;
  background?: string;
  size?: number;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: background ?? colors.secondary,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Feather name={icon} size={size * 0.45} color={color ?? colors.primary} />
    </Pressable>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 999,
        backgroundColor: active ? colors.primary : colors.secondary,
        borderWidth: 1,
        borderColor: active ? colors.primary : colors.border,
      }}
    >
      <Text
        style={{
          fontFamily: Fonts.semibold,
          fontSize: 14,
          color: active ? colors.primaryForeground : colors.secondaryForeground,
          writingDirection: "rtl",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Badge({
  label,
  color,
  background,
  icon,
}: {
  label: string;
  color?: string;
  background?: string;
  icon?: keyof typeof Feather.glyphMap;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: "row-reverse",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: background ?? colors.secondary,
      }}
    >
      {icon ? <Feather name={icon} size={12} color={color ?? colors.foreground} /> : null}
      <Text
        style={{
          fontFamily: Fonts.semibold,
          fontSize: 12,
          color: color ?? colors.foreground,
          writingDirection: "rtl",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function Field({
  label,
  style,
  inputStyle,
  ...rest
}: TextInputProps & {
  label?: string;
  inputStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = useColors();
  return (
    <View style={[{ gap: 6 }, style]}>
      {label ? (
        <AppText variant="semibold" size={14} color={colors.foreground}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        style={[
          {
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.input,
            borderRadius: colors.radius,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontFamily: Fonts.regular,
            fontSize: 16,
            color: colors.foreground,
            textAlign: "right",
            writingDirection: "rtl",
          },
          inputStyle,
        ]}
        {...rest}
      />
    </View>
  );
}

export function Loading({ text }: { text?: string }) {
  const colors = useColors();
  return (
    <View style={{ paddingVertical: 48, alignItems: "center", gap: 12 }}>
      <ActivityIndicator color={colors.primary} size="large" />
      {text ? (
        <AppText color={colors.mutedForeground} align="center">
          {text}
        </AppText>
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon = "inbox",
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={{ paddingVertical: 56, alignItems: "center", gap: 10, paddingHorizontal: 24 }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: colors.secondary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name={icon} size={30} color={colors.mutedForeground} />
      </View>
      <AppText variant="bold" size={18} align="center">
        {title}
      </AppText>
      {subtitle ? (
        <AppText color={colors.mutedForeground} align="center">
          {subtitle}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: 8 }}>
          <Button title={actionLabel} onPress={onAction} variant="outline" />
        </View>
      ) : null}
    </View>
  );
}

export function Divider() {
  const colors = useColors();
  return <View style={{ height: 1, backgroundColor: colors.border }} />;
}
