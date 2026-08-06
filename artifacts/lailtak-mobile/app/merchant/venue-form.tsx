import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import React, { useMemo, useState } from "react";
import { Alert, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { AppText, Button, Chip, Field, Loading } from "@/components/ui";
import { useMerchant } from "@/context/MerchantContext";
import { useColors } from "@/hooks/useColors";
import {
  getGetMerchantDashboardQueryKey,
  getGetVenueQueryKey,
  getListMerchantVenuesQueryKey,
  useCreateMerchantVenue,
  useGetVenue,
  useListCategories,
  useUpdateMerchantVenue,
} from "@workspace/api-client-react";

const AMENITY_OPTIONS = [
  "نظام صوتي",
  "إضاءة",
  "مطبخ",
  "غرفة عروس",
  "موقف سيارات",
  "مصلى",
  "قسم نساء",
  "تكييف مركزي",
];

export default function VenueForm() {
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { merchantId } = useMerchant();
  const params = useLocalSearchParams<{ venueId?: string }>();
  const venueId = params.venueId ? Number(params.venueId) : undefined;
  const isEdit = !!venueId;

  const categories = useListCategories();
  const existing = useGetVenue(venueId ?? 0, {
    query: { enabled: isEdit, queryKey: getGetVenueQueryKey(venueId ?? 0) },
  });

  const [initialized, setInitialized] = useState(false);
  const [nameAr, setNameAr] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [pricePerNight, setPricePerNight] = useState("");
  const [capacity, setCapacity] = useState("");
  const [district, setDistrict] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);

  // Prefill from existing venue once loaded (edit mode).
  if (isEdit && existing.data && !initialized) {
    const v = existing.data;
    setNameAr(v.nameAr);
    setCategorySlug(v.categorySlug);
    setPricePerNight(String(v.pricePerNight));
    setCapacity(String(v.capacity));
    setDistrict(v.district);
    setDescription(v.description ?? "");
    setPhone(v.phone ?? "");
    setAddress(v.address ?? "");
    setImageUrl(v.images && v.images.length > 0 ? v.images[0] : "");
    setAmenities(v.amenities ?? []);
    setInitialized(true);
  }

  const create = useCreateMerchantVenue();
  const update = useUpdateMerchantVenue();
  const saving = create.isPending || update.isPending;

  const valid = useMemo(
    () =>
      nameAr.trim() &&
      categorySlug.trim() &&
      Number(pricePerNight) > 0 &&
      Number(capacity) > 0 &&
      district.trim(),
    [nameAr, categorySlug, pricePerNight, capacity, district],
  );

  const toggleAmenity = (a: string) =>
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const invalidate = () => {
    if (!merchantId) return;
    queryClient.invalidateQueries({ queryKey: getListMerchantVenuesQueryKey(merchantId) });
    queryClient.invalidateQueries({ queryKey: getGetMerchantDashboardQueryKey(merchantId) });
  };

  const onSubmit = () => {
    if (!valid || !merchantId) return;
    const body = {
      nameAr: nameAr.trim(),
      categorySlug: categorySlug.trim(),
      pricePerNight: Number(pricePerNight),
      capacity: Number(capacity),
      district: district.trim(),
      description: description.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      images: imageUrl.trim() ? [imageUrl.trim()] : undefined,
      amenities: amenities.length ? amenities : undefined,
    };
    const handlers = {
      onSuccess: () => {
        invalidate();
        router.back();
      },
      onError: () => Alert.alert("تعذّر الحفظ", "يرجى التحقق من البيانات والمحاولة مرة أخرى."),
    };
    if (isEdit && venueId) {
      update.mutate({ id: merchantId, venueId, data: body }, handlers);
    } else {
      create.mutate({ id: merchantId, data: body }, handlers);
    }
  };

  if (isEdit && existing.isLoading) return <Loading text="جارٍ تحميل القاعة…" />;

  return (
    <>
      <Stack.Screen options={{ title: isEdit ? "تعديل القاعة" : "قاعة جديدة" }} />
      <KeyboardAwareScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 16 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
      >
        <Field label="اسم القاعة" value={nameAr} onChangeText={setNameAr} placeholder="مثال: قاعة الأصايل" />

        <View style={{ gap: 8 }}>
          <AppText variant="semibold" size={14}>
            التصنيف
          </AppText>
          <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}>
            {categories.data?.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.nameAr}
                active={categorySlug === cat.slug}
                onPress={() => setCategorySlug(cat.slug)}
              />
            ))}
          </View>
        </View>

        <View style={{ flexDirection: "row-reverse", gap: 12 }}>
          <Field
            label="السعر / الليلة (ر.س)"
            value={pricePerNight}
            onChangeText={setPricePerNight}
            placeholder="0"
            keyboardType="number-pad"
            style={{ flex: 1 }}
          />
          <Field
            label="السعة (ضيف)"
            value={capacity}
            onChangeText={setCapacity}
            placeholder="0"
            keyboardType="number-pad"
            style={{ flex: 1 }}
          />
        </View>

        <Field label="الحي" value={district} onChangeText={setDistrict} placeholder="مثال: حي الياسمين" />
        <Field
          label="العنوان (اختياري)"
          value={address}
          onChangeText={setAddress}
          placeholder="العنوان التفصيلي"
        />
        <Field
          label="رقم التواصل (اختياري)"
          value={phone}
          onChangeText={setPhone}
          placeholder="05xxxxxxxx"
          keyboardType="phone-pad"
        />
        <Field
          label="رابط صورة القاعة (اختياري)"
          value={imageUrl}
          onChangeText={setImageUrl}
          placeholder="https://…"
          autoCapitalize="none"
          keyboardType="url"
        />

        <View style={{ gap: 8 }}>
          <AppText variant="semibold" size={14}>
            المرافق والخدمات
          </AppText>
          <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}>
            {AMENITY_OPTIONS.map((a) => (
              <Chip key={a} label={a} active={amenities.includes(a)} onPress={() => toggleAmenity(a)} />
            ))}
          </View>
        </View>

        <Field
          label="وصف القاعة (اختياري)"
          value={description}
          onChangeText={setDescription}
          placeholder="وصف مختصر يبرز مميزات القاعة"
          multiline
          inputStyle={{ minHeight: 96, textAlignVertical: "top" }}
        />

        <Button
          title={isEdit ? "حفظ التعديلات" : "نشر القاعة"}
          icon="check"
          size="lg"
          loading={saving}
          disabled={!valid}
          onPress={onSubmit}
        />
      </KeyboardAwareScrollView>
    </>
  );
}
