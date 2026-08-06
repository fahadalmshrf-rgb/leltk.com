import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, FlatList, Platform, Pressable, View } from "react-native";

import { AppText, Badge, Button, EmptyState, Loading, useInsetsCompat } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { bookingStatusAr, formatDateAr, formatPrice } from "@/lib/format";
import {
  getListBookingsQueryKey,
  useListBookings,
  useUpdateBooking,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import type { Booking } from "@workspace/api-client-react";

function statusColors(status: string, colors: ReturnType<typeof useColors>) {
  switch (status) {
    case "confirmed":
      return { bg: "rgba(14,78,51,0.12)", fg: colors.primary };
    case "pending":
      return { bg: "rgba(226,175,54,0.18)", fg: "#8A6A16" };
    case "cancelled":
      return { bg: "rgba(179,38,30,0.12)", fg: colors.destructive };
    default:
      return { bg: colors.secondary, fg: colors.mutedForeground };
  }
}

export default function BookingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useInsetsCompat();
  const queryClient = useQueryClient();

  const bookings = useListBookings();
  const updateBooking = useUpdateBooking();

  const cancel = (booking: Booking) => {
    const doCancel = () =>
      updateBooking.mutate(
        { id: booking.id, data: { status: "cancelled" } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
          },
        },
      );

    if (Platform.OS === "web") {
      doCancel();
    } else {
      Alert.alert("إلغاء الحجز", "هل أنت متأكد من إلغاء هذا الحجز؟", [
        { text: "تراجع", style: "cancel" },
        { text: "إلغاء الحجز", style: "destructive", onPress: doCancel },
      ]);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 8 }}>
      <AppText
        variant="bold"
        size={24}
        color={colors.primary}
        style={{ paddingHorizontal: 20, marginBottom: 12 }}
      >
        حجوزاتي
      </AppText>

      {bookings.isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={bookings.data ?? []}
          keyExtractor={(b) => String(b.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 14 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const sc = statusColors(item.status, colors);
            const canCancel = item.status === "pending" || item.status === "confirmed";
            return (
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: colors.radius,
                  borderWidth: 1,
                  borderColor: colors.border,
                  overflow: "hidden",
                }}
              >
                <Pressable
                  onPress={() =>
                    router.push({ pathname: "/venue/[id]", params: { id: String(item.venueId) } })
                  }
                  style={{ flexDirection: "row-reverse" }}
                >
                  <View style={{ width: 96, height: 96, backgroundColor: colors.secondary }}>
                    {item.venueImage ? (
                      <Image
                        source={{ uri: item.venueImage }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                        <Feather name="image" size={24} color={colors.mutedForeground} />
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1, padding: 12, gap: 6 }}>
                    <View
                      style={{
                        flexDirection: "row-reverse",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <AppText variant="bold" size={16} numberOfLines={1} style={{ flex: 1 }}>
                        {item.venueName}
                      </AppText>
                      <Badge label={bookingStatusAr(item.status)} background={sc.bg} color={sc.fg} />
                    </View>
                    <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
                      <Feather name="calendar" size={13} color={colors.mutedForeground} />
                      <AppText size={13} color={colors.mutedForeground}>
                        {formatDateAr(item.eventDate)}
                      </AppText>
                    </View>
                    <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12 }}>
                      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
                        <Feather name="users" size={13} color={colors.mutedForeground} />
                        <AppText size={13} color={colors.mutedForeground}>
                          {item.guestCount} ضيف
                        </AppText>
                      </View>
                      <AppText size={14} variant="bold" color={colors.primary}>
                        {formatPrice(item.totalPrice)} ريال
                      </AppText>
                    </View>
                  </View>
                </Pressable>

                {canCancel ? (
                  <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                    <Button
                      title="إلغاء الحجز"
                      variant="outline"
                      icon="x-circle"
                      onPress={() => cancel(item)}
                      loading={updateBooking.isPending}
                    />
                  </View>
                ) : null}
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon="calendar"
              title="لا توجد حجوزات بعد"
              subtitle="تصفّح القاعات واحجز مناسبتك القادمة"
              actionLabel="تصفّح القاعات"
              onAction={() => router.push("/search")}
            />
          }
        />
      )}
    </View>
  );
}
