import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, View } from "react-native";

import { AppText, Badge } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { useColors } from "@/hooks/useColors";
import type { Venue } from "@workspace/api-client-react";

export function VenueCard({
  venue,
  onPress,
  width,
}: {
  venue: Venue;
  onPress: () => void;
  width?: number;
}) {
  const colors = useColors();
  const image = venue.images?.[0];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width,
        backgroundColor: colors.card,
        borderRadius: colors.radius,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <View style={{ height: 170, backgroundColor: colors.secondary }}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Feather name="image" size={34} color={colors.mutedForeground} />
          </View>
        )}

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.45)"]}
          style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 70 }}
        />

        <View
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            flexDirection: "row-reverse",
            gap: 6,
          }}
        >
          {venue.isFeatured ? (
            <Badge
              label="مميزة"
              icon="star"
              color={colors.accentForeground}
              background={colors.accent}
            />
          ) : null}
          {!venue.isAvailable ? (
            <Badge label="محجوزة" color="#fff" background={colors.destructive} />
          ) : null}
        </View>

        <View
          style={{
            position: "absolute",
            bottom: 10,
            left: 12,
            flexDirection: "row-reverse",
            alignItems: "center",
            gap: 4,
            backgroundColor: "rgba(0,0,0,0.5)",
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 999,
          }}
        >
          <Feather name="star" size={12} color={colors.accent} />
          <AppText size={12} color="#fff" variant="semibold">
            {venue.rating.toFixed(1)}
          </AppText>
        </View>
      </View>

      <View style={{ padding: 14, gap: 8 }}>
        <AppText variant="bold" size={17} numberOfLines={1}>
          {venue.nameAr}
        </AppText>

        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}>
          <Feather name="map-pin" size={13} color={colors.mutedForeground} />
          <AppText size={13} color={colors.mutedForeground} numberOfLines={1}>
            {venue.district}
          </AppText>
        </View>

        <View
          style={{
            flexDirection: "row-reverse",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginTop: 2,
          }}
        >
          <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}>
            <Feather name="users" size={14} color={colors.mutedForeground} />
            <AppText size={13} color={colors.mutedForeground}>
              حتى {venue.capacity} ضيف
            </AppText>
          </View>
          <View style={{ alignItems: "flex-start" }}>
            <View style={{ flexDirection: "row-reverse", alignItems: "baseline", gap: 3 }}>
              <AppText variant="bold" size={17} color={colors.primary}>
                {formatPrice(venue.pricePerNight)}
              </AppText>
              <AppText size={12} color={colors.mutedForeground}>
                ريال
              </AppText>
            </View>
            <AppText size={11} color={colors.mutedForeground}>
              لليلة الواحدة
            </AppText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
