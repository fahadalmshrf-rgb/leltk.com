import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";
import { Alert, Image, Pressable, RefreshControl, ScrollView, View } from "react-native";

import { AppText, Badge, Button, Card, EmptyState, Loading } from "@/components/ui";
import { useMerchant } from "@/context/MerchantContext";
import { useColors } from "@/hooks/useColors";
import { formatPrice } from "@/lib/format";
import type { Venue } from "@workspace/api-client-react";
import {
  getGetMerchantDashboardQueryKey,
  getListMerchantVenuesQueryKey,
  useDeleteMerchantVenue,
  useListMerchantVenues,
} from "@workspace/api-client-react";

export default function MerchantVenues() {
  const colors = useColors();
  const router = useRouter();
  const { merchantId } = useMerchant();
  const queryClient = useQueryClient();

  const venues = useListMerchantVenues(merchantId ?? 0, {
    query: {
      enabled: !!merchantId,
      queryKey: getListMerchantVenuesQueryKey(merchantId ?? 0),
    },
  });
  const remove = useDeleteMerchantVenue();

  const onDelete = (venue: Venue) => {
    if (!merchantId) return;
    Alert.alert("حذف القاعة", `هل تريد حذف "${venue.nameAr}"؟`, [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: () => {
          remove.mutate(
            { id: merchantId, venueId: venue.id },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: getListMerchantVenuesQueryKey(merchantId) });
                queryClient.invalidateQueries({ queryKey: getGetMerchantDashboardQueryKey(merchantId) });
              },
              onError: () => Alert.alert("تعذّر الحذف", "حدث خطأ، حاول مرة أخرى."),
            },
          );
        },
      },
    ]);
  };

  if (venues.isLoading) return <Loading text="جارٍ تحميل القاعات…" />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={venues.isFetching}
          onRefresh={() => venues.refetch()}
          tintColor={colors.primary}
        />
      }
    >
      <Button
        title="إضافة قاعة جديدة"
        icon="plus"
        size="lg"
        onPress={() => router.push("/merchant/venue-form")}
      />

      {venues.data && venues.data.length > 0 ? (
        venues.data.map((venue) => (
          <Card key={venue.id}>
            {venue.images && venue.images.length > 0 ? (
              <Image source={{ uri: venue.images[0] }} style={{ width: "100%", height: 150 }} resizeMode="cover" />
            ) : (
              <View
                style={{
                  width: "100%",
                  height: 150,
                  backgroundColor: colors.secondary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="image" size={30} color={colors.mutedForeground} />
              </View>
            )}
            <View style={{ padding: 16, gap: 10 }}>
              <View
                style={{ flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" }}
              >
                <AppText variant="bold" size={18} style={{ flex: 1 }}>
                  {venue.nameAr}
                </AppText>
                <Badge
                  label={venue.isAvailable ? "متاحة" : "غير متاحة"}
                  color={venue.isAvailable ? colors.primary : colors.mutedForeground}
                  background={venue.isAvailable ? `${colors.primary}22` : colors.secondary}
                />
              </View>
              <View style={{ flexDirection: "row-reverse", gap: 16, flexWrap: "wrap" }}>
                <Meta icon="map-pin" text={venue.district} />
                <Meta icon="users" text={`${venue.capacity} ضيف`} />
                <Meta icon="tag" text={`${formatPrice(venue.pricePerNight)} ر.س`} />
              </View>
              <View style={{ flexDirection: "row-reverse", gap: 10, marginTop: 4 }}>
                <Button
                  title="تعديل"
                  icon="edit-2"
                  variant="secondary"
                  style={{ flex: 1 }}
                  onPress={() =>
                    router.push({
                      pathname: "/merchant/venue-form",
                      params: { venueId: String(venue.id) },
                    })
                  }
                />
                <Button
                  title="حذف"
                  icon="trash-2"
                  variant="outline"
                  style={{ flex: 1 }}
                  loading={remove.isPending}
                  onPress={() => onDelete(venue)}
                />
              </View>
            </View>
          </Card>
        ))
      ) : (
        <EmptyState
          icon="home"
          title="لا توجد قاعات بعد"
          subtitle="أضف أول قاعة لك لتبدأ باستقبال الحجوزات"
        />
      )}
    </ScrollView>
  );
}

function Meta({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
      <Feather name={icon} size={14} color={colors.mutedForeground} />
      <AppText size={13} color={colors.mutedForeground}>
        {text}
      </AppText>
    </View>
  );
}
