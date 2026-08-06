import { Stack } from "expo-router";
import React from "react";

import { Fonts } from "@/constants/fonts";
import { useColors } from "@/hooks/useColors";

export default function MerchantLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "رجوع",
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontFamily: Fonts.bold, color: colors.foreground },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "لوحة التحكم" }} />
      <Stack.Screen name="register" options={{ title: "تسجيل قاعة" }} />
      <Stack.Screen name="venues" options={{ title: "قاعاتي" }} />
      <Stack.Screen name="venue-form" options={{ title: "قاعة" }} />
      <Stack.Screen name="bookings" options={{ title: "طلبات الحجز" }} />
      <Stack.Screen name="profile" options={{ title: "بيانات المنشأة" }} />
    </Stack>
  );
}
