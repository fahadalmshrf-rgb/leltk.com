import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { AppText, Badge, Button, Card, Field, Loading } from "@/components/ui";
import { useMerchant } from "@/context/MerchantContext";
import { useColors } from "@/hooks/useColors";
import {
  getGetMerchantQueryKey,
  useGetMerchant,
  useUpdateMerchant,
} from "@workspace/api-client-react";

const STATUS_AR: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "موثّقة",
  suspended: "موقوفة",
};

export default function MerchantProfile() {
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { merchantId, signOut } = useMerchant();

  const merchant = useGetMerchant(merchantId ?? 0, {
    query: { enabled: !!merchantId, queryKey: getGetMerchantQueryKey(merchantId ?? 0) },
  });
  const update = useUpdateMerchant();

  const [initialized, setInitialized] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  if (merchant.data && !initialized) {
    setOwnerName(merchant.data.ownerName);
    setBusinessName(merchant.data.businessName);
    setPhone(merchant.data.phone);
    setDescription(merchant.data.description ?? "");
    setInitialized(true);
  }

  const onSave = () => {
    if (!merchantId) return;
    update.mutate(
      {
        id: merchantId,
        data: {
          ownerName: ownerName.trim(),
          businessName: businessName.trim(),
          phone: phone.trim(),
          description: description.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMerchantQueryKey(merchantId) });
          Alert.alert("تم الحفظ", "تم تحديث بيانات المنشأة بنجاح.");
        },
        onError: () => Alert.alert("تعذّر الحفظ", "حدث خطأ، حاول مرة أخرى."),
      },
    );
  };

  const onSignOut = () => {
    Alert.alert("تسجيل الخروج", "هل تريد الخروج من حساب المنشأة؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "خروج",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/merchant");
        },
      },
    ]);
  };

  if (merchant.isLoading) return <Loading text="جارٍ تحميل البيانات…" />;

  const statusColor =
    merchant.data?.status === "approved"
      ? colors.primary
      : merchant.data?.status === "suspended"
        ? colors.destructive
        : colors.accent;

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 16 }}
      keyboardShouldPersistTaps="handled"
      bottomOffset={24}
    >
      {merchant.data ? (
        <Card style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: colors.secondary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="briefcase" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bold" size={17}>
                {merchant.data.businessName}
              </AppText>
              <AppText size={13} color={colors.mutedForeground}>
                رقم الحساب: {merchant.data.id}
              </AppText>
            </View>
            <Badge
              label={STATUS_AR[merchant.data.status] ?? merchant.data.status}
              color={statusColor}
              background={`${statusColor}22`}
            />
          </View>
          <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
            <Feather name="hash" size={14} color={colors.mutedForeground} />
            <AppText size={13} color={colors.mutedForeground}>
              السجل التجاري: {merchant.data.crNumber}
            </AppText>
          </View>
          <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
            <Feather name="mail" size={14} color={colors.mutedForeground} />
            <AppText size={13} color={colors.mutedForeground}>
              {merchant.data.email}
            </AppText>
          </View>
        </Card>
      ) : null}

      <AppText variant="bold" size={18}>
        تعديل البيانات
      </AppText>
      <Field label="اسم المالك" value={ownerName} onChangeText={setOwnerName} />
      <Field label="اسم المنشأة" value={businessName} onChangeText={setBusinessName} />
      <Field label="رقم الجوال" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Field
        label="نبذة عن المنشأة"
        value={description}
        onChangeText={setDescription}
        multiline
        inputStyle={{ minHeight: 96, textAlignVertical: "top" }}
      />

      <Button title="حفظ التعديلات" icon="check" size="lg" loading={update.isPending} onPress={onSave} />
      <Button title="تسجيل الخروج" icon="log-out" variant="outline" onPress={onSignOut} />
    </KeyboardAwareScrollView>
  );
}
