import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AppText,
  Badge,
  Button,
  Card,
  Field,
  IconButton,
  Loading,
  useInsetsCompat,
} from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { formatDateAr, formatPrice } from "@/lib/format";
import {
  getListBookingsQueryKey,
  useCreateBooking,
  useGetVenue,
  useListVenueReviews,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function VenueDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const webInsets = useInsetsCompat();
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const venueId = Number(id);

  const venue = useGetVenue(venueId);
  const reviews = useListVenueReviews(venueId);
  const createBooking = useCreateBooking();

  const [showBooking, setShowBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingForm, setBookingForm] = useState({
    eventDate: "",
    guestCount: "",
    groomName: "",
    brideName: "",
    contactPhone: "",
    notes: "",
  });

  const topPad = Platform.OS === "web" ? webInsets.top : insets.top;

  if (venue.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Loading />
      </View>
    );
  }

  if (venue.isError || !venue.data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 }}>
        <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
        <AppText align="center">تعذّر تحميل بيانات القاعة</AppText>
        <Button title="إعادة المحاولة" variant="outline" onPress={() => venue.refetch()} />
      </View>
    );
  }

  const v = venue.data;

  const submitBooking = () => {
    setError(null);
    const guests = Number(bookingForm.guestCount);
    if (!bookingForm.eventDate.trim()) return setError("تاريخ المناسبة مطلوب (مثال: 2026-09-15).");
    if (!guests || guests < 1) return setError("أدخل عدد الضيوف.");
    if (!bookingForm.groomName.trim() || !bookingForm.brideName.trim())
      return setError("اسم العريس واسم العروس مطلوبان.");
    if (!bookingForm.contactPhone.trim()) return setError("رقم التواصل مطلوب.");

    createBooking.mutate(
      {
        data: {
          venueId: v.id,
          eventDate: bookingForm.eventDate,
          guestCount: guests,
          groomName: bookingForm.groomName,
          brideName: bookingForm.brideName,
          contactPhone: bookingForm.contactPhone,
          notes: bookingForm.notes || undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
          setBooked(true);
          setShowBooking(false);
        },
        onError: () => setError("تعذّر إرسال طلب الحجز، حاول مرة أخرى."),
      },
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <View style={{ height: 300, backgroundColor: colors.secondary }}>
          {v.images?.[0] ? (
            <Image source={{ uri: v.images[0] }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Feather name="image" size={44} color={colors.mutedForeground} />
            </View>
          )}
          <LinearGradient
            colors={["rgba(0,0,0,0.35)", "transparent"]}
            style={{ position: "absolute", top: 0, left: 0, right: 0, height: 120 }}
          />
        </View>

        {/* Gallery thumbnails */}
        {v.images && v.images.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexDirection: "row-reverse", gap: 8, padding: 16 }}
          >
            {v.images.slice(1).map((img, i) => (
              <Image
                key={i}
                source={{ uri: img }}
                style={{ width: 90, height: 70, borderRadius: 10, backgroundColor: colors.secondary }}
                contentFit="cover"
              />
            ))}
          </ScrollView>
        ) : null}

        <View style={{ padding: 20, gap: 18 }}>
          <View>
            <View style={{ flexDirection: "row-reverse", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <AppText variant="display" size={26} color={colors.primary} style={{ flex: 1 }}>
                {v.nameAr}
              </AppText>
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4, backgroundColor: colors.secondary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 }}>
                <Feather name="star" size={14} color={colors.accent} />
                <AppText variant="semibold" size={14}>
                  {v.rating.toFixed(1)}
                </AppText>
                <AppText size={12} color={colors.mutedForeground}>
                  ({v.reviewCount})
                </AppText>
              </View>
            </View>
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5, marginTop: 6 }}>
              <Feather name="map-pin" size={14} color={colors.mutedForeground} />
              <AppText size={14} color={colors.mutedForeground}>
                {v.district}
                {v.address ? ` — ${v.address}` : ""}
              </AppText>
            </View>
          </View>

          {/* Key facts */}
          <View style={{ flexDirection: "row-reverse", gap: 12 }}>
            <Fact icon="users" value={`${v.capacity}`} label="ضيف" />
            <Fact icon="tag" value={formatPrice(v.pricePerNight)} label="ريال / ليلة" />
            <Fact
              icon={v.isAvailable ? "check-circle" : "x-circle"}
              value={v.isAvailable ? "متاحة" : "محجوزة"}
              label="الحالة"
            />
          </View>

          {v.description ? (
            <View style={{ gap: 6 }}>
              <AppText variant="bold" size={18}>
                الوصف
              </AppText>
              <AppText color={colors.mutedForeground}>{v.description}</AppText>
            </View>
          ) : null}

          {v.amenities && v.amenities.length > 0 ? (
            <View style={{ gap: 10 }}>
              <AppText variant="bold" size={18}>
                المرافق
              </AppText>
              <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}>
                {v.amenities.map((a, i) => (
                  <Badge key={i} label={a} icon="check" />
                ))}
              </View>
            </View>
          ) : null}

          {v.services && v.services.length > 0 ? (
            <View style={{ gap: 10 }}>
              <AppText variant="bold" size={18}>
                الخدمات
              </AppText>
              <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}>
                {v.services.map((s, i) => (
                  <Badge key={i} label={s} icon="star" background={colors.secondary} />
                ))}
              </View>
            </View>
          ) : null}

          {/* Booking form */}
          {showBooking ? (
            <Card style={{ padding: 16, gap: 12 }}>
              <AppText variant="bold" size={18} color={colors.primary}>
                طلب حجز
              </AppText>
              <View style={{ flexDirection: "row-reverse", gap: 12 }}>
                <Field
                  label="تاريخ المناسبة *"
                  style={{ flex: 1 }}
                  value={bookingForm.eventDate}
                  onChangeText={(t) => setBookingForm((f) => ({ ...f, eventDate: t }))}
                  placeholder="2026-09-15"
                />
                <Field
                  label="عدد الضيوف *"
                  style={{ flex: 1 }}
                  value={bookingForm.guestCount}
                  onChangeText={(t) => setBookingForm((f) => ({ ...f, guestCount: t }))}
                  placeholder="300"
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flexDirection: "row-reverse", gap: 12 }}>
                <Field
                  label="اسم العريس *"
                  style={{ flex: 1 }}
                  value={bookingForm.groomName}
                  onChangeText={(t) => setBookingForm((f) => ({ ...f, groomName: t }))}
                  placeholder="فهد"
                />
                <Field
                  label="اسم العروس *"
                  style={{ flex: 1 }}
                  value={bookingForm.brideName}
                  onChangeText={(t) => setBookingForm((f) => ({ ...f, brideName: t }))}
                  placeholder="اسم العروس"
                />
              </View>
              <Field
                label="رقم التواصل *"
                value={bookingForm.contactPhone}
                onChangeText={(t) => setBookingForm((f) => ({ ...f, contactPhone: t }))}
                placeholder="05xxxxxxxx"
                keyboardType="phone-pad"
                inputStyle={{ textAlign: "left", writingDirection: "ltr" }}
              />
              <Field
                label="ملاحظات (اختياري)"
                value={bookingForm.notes}
                onChangeText={(t) => setBookingForm((f) => ({ ...f, notes: t }))}
                placeholder="أي طلبات خاصة"
                multiline
                inputStyle={{ minHeight: 60, textAlignVertical: "top" }}
              />
              {error ? (
                <AppText color={colors.destructive} align="center">
                  {error}
                </AppText>
              ) : null}
              <Button
                title="إرسال طلب الحجز"
                icon="send"
                onPress={submitBooking}
                loading={createBooking.isPending}
              />
            </Card>
          ) : null}

          {/* Reviews */}
          {reviews.data && reviews.data.length > 0 ? (
            <View style={{ gap: 10 }}>
              <AppText variant="bold" size={18}>
                التقييمات
              </AppText>
              {reviews.data.map((r) => (
                <Card key={r.id} style={{ padding: 14, gap: 6 }}>
                  <View style={{ flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" }}>
                    <AppText variant="semibold">{r.authorName}</AppText>
                    <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 3 }}>
                      <Feather name="star" size={13} color={colors.accent} />
                      <AppText size={13} variant="semibold">
                        {r.rating.toFixed(1)}
                      </AppText>
                    </View>
                  </View>
                  <AppText size={14} color={colors.mutedForeground}>
                    {r.comment}
                  </AppText>
                </Card>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Floating back button */}
      <View style={{ position: "absolute", top: topPad + 8, right: 16 }}>
        <IconButton
          icon="chevron-right"
          onPress={() => router.back()}
          background="rgba(0,0,0,0.4)"
          color="#fff"
        />
      </View>

      {/* Bottom booking bar */}
      {!showBooking ? (
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            flexDirection: "row-reverse",
            alignItems: "center",
            gap: 14,
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: (Platform.OS === "web" ? webInsets.bottom : insets.bottom) + 14,
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row-reverse", alignItems: "baseline", gap: 4 }}>
              <AppText variant="bold" size={20} color={colors.primary}>
                {formatPrice(v.pricePerNight)}
              </AppText>
              <AppText size={13} color={colors.mutedForeground}>
                ريال / ليلة
              </AppText>
            </View>
          </View>
          {booked ? (
            <Badge label="تم إرسال الطلب" icon="check" color={colors.primary} background="rgba(14,78,51,0.12)" />
          ) : (
            <Button
              title="احجز الآن"
              icon="calendar"
              onPress={() => setShowBooking(true)}
              style={{ flex: 1 }}
              disabled={!v.isAvailable}
            />
          )}
        </View>
      ) : null}
    </View>
  );
}

function Fact({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Feather.glyphMap;
  value: string;
  label: string;
}) {
  const colors = useColors();
  return (
    <Card style={{ flex: 1, padding: 14, alignItems: "center", gap: 4 }}>
      <Feather name={icon} size={20} color={colors.accent} />
      <AppText variant="bold" size={16} color={colors.primary} align="center" numberOfLines={1}>
        {value}
      </AppText>
      <AppText size={12} color={colors.mutedForeground} align="center">
        {label}
      </AppText>
    </Card>
  );
}
