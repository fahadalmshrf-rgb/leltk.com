import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { Alert, RefreshControl, ScrollView, View } from "react-native";

import { AppText, Badge, Button, Card, Chip, Divider, EmptyState, Loading } from "@/components/ui";
import { useMerchant } from "@/context/MerchantContext";
import { useColors } from "@/hooks/useColors";
import { bookingStatusAr, formatDateAr, formatPrice } from "@/lib/format";
import type { Booking } from "@workspace/api-client-react";
import {
  getGetMerchantDashboardQueryKey,
  getListMerchantBookingsQueryKey,
  useListMerchantBookings,
  useUpdateMerchantBooking,
} from "@workspace/api-client-react";

type Filter = "all" | "pending" | "confirmed" | "cancelled";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "pending", label: "بانتظار الرد" },
  { key: "confirmed", label: "مؤكدة" },
  { key: "cancelled", label: "ملغاة" },
];

export default function MerchantBookings() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const { merchantId } = useMerchant();
  const [filter, setFilter] = useState<Filter>("all");

  const bookings = useListMerchantBookings(merchantId ?? 0, {
    query: {
      enabled: !!merchantId,
      queryKey: getListMerchantBookingsQueryKey(merchantId ?? 0),
    },
  });
  const updateBooking = useUpdateMerchantBooking();

  const filtered = useMemo(() => {
    const list = bookings.data ?? [];
    if (filter === "all") return list;
    return list.filter((b) => b.status === filter);
  }, [bookings.data, filter]);

  const respond = (booking: Booking, status: "confirmed" | "cancelled") => {
    if (!merchantId) return;
    const label = status === "confirmed" ? "تأكيد" : "رفض";
    Alert.alert(`${label} الحجز`, `هل تريد ${label} حجز "${booking.venueName}"؟`, [
      { text: "إلغاء", style: "cancel" },
      {
        text: label,
        style: status === "cancelled" ? "destructive" : "default",
        onPress: () => {
          updateBooking.mutate(
            { id: merchantId, bookingId: booking.id, data: { status } },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: getListMerchantBookingsQueryKey(merchantId) });
                queryClient.invalidateQueries({ queryKey: getGetMerchantDashboardQueryKey(merchantId) });
              },
              onError: () => Alert.alert("تعذّر التحديث", "حدث خطأ، حاول مرة أخرى."),
            },
          );
        },
      },
    ]);
  };

  if (bookings.isLoading) return <Loading text="جارٍ تحميل الطلبات…" />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={bookings.isFetching}
          onRefresh={() => bookings.refetch()}
          tintColor={colors.primary}
        />
      }
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: "row-reverse", gap: 8 }}
      >
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </ScrollView>

      {filtered.length > 0 ? (
        filtered.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            pending={updateBooking.isPending}
            onConfirm={() => respond(booking, "confirmed")}
            onReject={() => respond(booking, "cancelled")}
          />
        ))
      ) : (
        <EmptyState icon="inbox" title="لا توجد طلبات" subtitle="ستظهر الطلبات الجديدة هنا فور وصولها" />
      )}
    </ScrollView>
  );
}

function BookingCard({
  booking,
  pending,
  onConfirm,
  onReject,
}: {
  booking: Booking;
  pending: boolean;
  onConfirm: () => void;
  onReject: () => void;
}) {
  const colors = useColors();
  const statusColor =
    booking.status === "confirmed"
      ? colors.primary
      : booking.status === "cancelled"
        ? colors.destructive
        : colors.accent;

  return (
    <Card style={{ padding: 16, gap: 12 }}>
      <View style={{ flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" }}>
        <AppText variant="bold" size={17} style={{ flex: 1 }}>
          {booking.venueName}
        </AppText>
        <Badge label={bookingStatusAr(booking.status)} color={statusColor} background={`${statusColor}22`} />
      </View>

      <View style={{ gap: 8 }}>
        <InfoRow icon="calendar" text={formatDateAr(booking.eventDate)} />
        <InfoRow icon="users" text={`${booking.guestCount} ضيف`} />
        <InfoRow icon="tag" text={`${formatPrice(booking.totalPrice)} ر.س`} />
        {booking.groomName || booking.brideName ? (
          <InfoRow
            icon="heart"
            text={[booking.groomName, booking.brideName].filter(Boolean).join(" و ")}
          />
        ) : null}
        {booking.contactPhone ? <InfoRow icon="phone" text={booking.contactPhone} /> : null}
        {booking.notes ? <InfoRow icon="message-square" text={booking.notes} /> : null}
      </View>

      {booking.status === "pending" ? (
        <>
          <Divider />
          <View style={{ flexDirection: "row-reverse", gap: 10 }}>
            <Button title="تأكيد" icon="check" style={{ flex: 1 }} loading={pending} onPress={onConfirm} />
            <Button
              title="رفض"
              icon="x"
              variant="outline"
              style={{ flex: 1 }}
              loading={pending}
              onPress={onReject}
            />
          </View>
        </>
      ) : null}
    </Card>
  );
}

function InfoRow({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
      <Feather name={icon} size={15} color={colors.mutedForeground} />
      <AppText size={14} color={colors.foreground} style={{ flex: 1 }}>
        {text}
      </AppText>
    </View>
  );
}
