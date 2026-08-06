import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { FlatList, ScrollView, TextInput, View } from "react-native";

import { AppText, Chip, EmptyState, Loading, useInsetsCompat } from "@/components/ui";
import { VenueCard } from "@/components/VenueCard";
import { useColors } from "@/hooks/useColors";
import { useListCategories, useListVenues } from "@workspace/api-client-react";

const CAPACITIES = [
  { label: "الكل", value: undefined },
  { label: "+100", value: 100 },
  { label: "+300", value: 300 },
  { label: "+500", value: 500 },
];

export default function SearchScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useInsetsCompat();
  const params = useLocalSearchParams<{ category?: string }>();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>(params.category);
  const [minCapacity, setMinCapacity] = useState<number | undefined>(undefined);

  const categories = useListCategories();

  const queryParams = useMemo(
    () => ({
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(category ? { category } : {}),
      ...(minCapacity ? { minCapacity } : {}),
      limit: 30,
    }),
    [search, category, minCapacity],
  );

  const venues = useListVenues(queryParams);

  const openVenue = (id: number) =>
    router.push({ pathname: "/venue/[id]", params: { id: String(id) } });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 8 }}>
      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <AppText variant="bold" size={24} color={colors.primary} style={{ marginBottom: 12 }}>
          ابحث عن قاعتك
        </AppText>

        <View
          style={{
            flexDirection: "row-reverse",
            alignItems: "center",
            gap: 8,
            backgroundColor: colors.card,
            borderRadius: colors.radius,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 14,
          }}
        >
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="اسم القاعة أو الحي"
            placeholderTextColor={colors.mutedForeground}
            style={{
              flex: 1,
              paddingVertical: 12,
              fontFamily: "Cairo_400Regular",
              fontSize: 16,
              color: colors.foreground,
              textAlign: "right",
              writingDirection: "rtl",
            }}
          />
        </View>
      </View>

      {/* Category filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection: "row-reverse",
          gap: 8,
          paddingHorizontal: 20,
          paddingVertical: 10,
        }}
        style={{ flexGrow: 0 }}
      >
        <Chip label="الكل" active={!category} onPress={() => setCategory(undefined)} />
        {categories.data?.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.nameAr}
            active={category === cat.slug}
            onPress={() => setCategory(cat.slug)}
          />
        ))}
      </ScrollView>

      {/* Capacity filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection: "row-reverse",
          gap: 8,
          paddingHorizontal: 20,
          paddingBottom: 12,
        }}
        style={{ flexGrow: 0 }}
      >
        {CAPACITIES.map((c) => (
          <Chip
            key={c.label}
            label={c.label}
            active={minCapacity === c.value}
            onPress={() => setMinCapacity(c.value)}
          />
        ))}
      </ScrollView>

      {venues.isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={venues.data?.venues ?? []}
          keyExtractor={(v) => String(v.id)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 16 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            venues.data ? (
              <AppText size={13} color={colors.mutedForeground} style={{ marginBottom: 4 }}>
                {venues.data.total} نتيجة
              </AppText>
            ) : null
          }
          renderItem={({ item }) => (
            <VenueCard venue={item} onPress={() => openVenue(item.id)} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="search"
              title="لا توجد نتائج"
              subtitle="جرّب تعديل كلمات البحث أو الفلاتر"
            />
          }
        />
      )}
    </View>
  );
}
