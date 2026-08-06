import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, View } from "react-native";

import { AppText, Card, Chip, Loading, useInsetsCompat } from "@/components/ui";
import { VenueCard } from "@/components/VenueCard";
import { useColors } from "@/hooks/useColors";
import {
  useGetFeaturedVenues,
  useGetVenueStats,
  useListCategories,
  useListVenues,
} from "@workspace/api-client-react";
import { formatPrice } from "@/lib/format";

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useInsetsCompat();

  const featured = useGetFeaturedVenues();
  const categories = useListCategories();
  const stats = useGetVenueStats();
  const venues = useListVenues({ limit: 6 });

  const onRefresh = useCallback(() => {
    featured.refetch();
    categories.refetch();
    stats.refetch();
    venues.refetch();
  }, [featured, categories, stats, venues]);

  const refreshing =
    featured.isFetching && featured.isLoading === false && venues.isFetching;

  const openVenue = (id: number) =>
    router.push({ pathname: "/venue/[id]", params: { id: String(id) } });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row-reverse",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          marginBottom: 20,
        }}
      >
        <View>
          <AppText variant="display" size={28} color={colors.primary}>
            ليلتك
          </AppText>
          <AppText size={14} color={colors.mutedForeground}>
            اكتشف قاعات الرياض الفاخرة
          </AppText>
        </View>
        <Pressable
          onPress={() => router.push("/merchant")}
          accessibilityLabel="بوابة أصحاب القاعات"
          style={({ pressed }) => ({
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: colors.secondary,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Feather name="briefcase" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {/* E-invitation CTA */}
      <Pressable
        onPress={() => router.push("/invite")}
        style={{ paddingHorizontal: 20, marginBottom: 22 }}
      >
        <LinearGradient
          colors={[colors.primary, "#093422"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            borderRadius: colors.radius,
            padding: 18,
            flexDirection: "row-reverse",
            alignItems: "center",
            gap: 14,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: "rgba(226,175,54,0.2)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="mail" size={24} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="bold" size={17} color="#fff">
              دعوة زفاف إلكترونية
            </AppText>
            <AppText size={13} color="rgba(255,255,255,0.8)">
              أنشئ دعوتك وشاركها، وتابع تأكيدات الحضور
            </AppText>
          </View>
          <Feather name="chevron-left" size={22} color={colors.accent} />
        </LinearGradient>
      </Pressable>

      {/* Stats */}
      {stats.data ? (
        <View
          style={{
            flexDirection: "row-reverse",
            gap: 12,
            paddingHorizontal: 20,
            marginBottom: 24,
          }}
        >
          <StatCard
            icon="home"
            value={String(stats.data.totalVenues)}
            label="قاعة"
          />
          <StatCard
            icon="map-pin"
            value={String(stats.data.totalDistricts)}
            label="حي"
          />
          <StatCard
            icon="tag"
            value={formatPrice(Math.round(stats.data.avgPrice))}
            label="متوسط السعر"
          />
        </View>
      ) : null}

      {/* Categories */}
      {categories.data && categories.data.length > 0 ? (
        <View style={{ marginBottom: 24 }}>
          <SectionTitle title="التصنيفات" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexDirection: "row-reverse", gap: 10, paddingHorizontal: 20 }}
          >
            {categories.data.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.nameAr}
                onPress={() =>
                  router.push({ pathname: "/search", params: { category: cat.slug } })
                }
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Featured */}
      <View style={{ marginBottom: 26 }}>
        <SectionTitle
          title="قاعات مميزة"
          actionLabel="عرض الكل"
          onAction={() => router.push("/search")}
        />
        {featured.isLoading ? (
          <Loading />
        ) : featured.data && featured.data.length > 0 ? (
          <FlatList
            horizontal
            inverted
            data={featured.data}
            keyExtractor={(v) => String(v.id)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
            renderItem={({ item }) => (
              <VenueCard venue={item} width={270} onPress={() => openVenue(item.id)} />
            )}
          />
        ) : (
          <AppText color={colors.mutedForeground} style={{ paddingHorizontal: 20 }}>
            لا توجد قاعات مميزة بعد
          </AppText>
        )}
      </View>

      {/* All venues */}
      <View>
        <SectionTitle title="أحدث القاعات" />
        {venues.isLoading ? (
          <Loading />
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 16 }}>
            {venues.data?.venues.map((v) => (
              <VenueCard key={v.id} venue={v} onPress={() => openVenue(v.id)} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function StatCard({
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
      <AppText variant="bold" size={18} color={colors.primary} align="center">
        {value}
      </AppText>
      <AppText size={12} color={colors.mutedForeground} align="center">
        {label}
      </AppText>
    </Card>
  );
}

function SectionTitle({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: "row-reverse",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        marginBottom: 12,
      }}
    >
      <AppText variant="bold" size={19}>
        {title}
      </AppText>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction}>
          <AppText size={14} color={colors.primary} variant="semibold">
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}
