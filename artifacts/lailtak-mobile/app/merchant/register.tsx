import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { AppText, Button, Field } from "@/components/ui";
import { useMerchant } from "@/context/MerchantContext";
import { useColors } from "@/hooks/useColors";
import { useRegisterMerchant } from "@workspace/api-client-react";

export default function RegisterMerchant() {
  const colors = useColors();
  const router = useRouter();
  const { signIn } = useMerchant();
  const register = useRegisterMerchant();

  const [ownerName, setOwnerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [crNumber, setCrNumber] = useState("");
  const [password, setPassword] = useState("");
  const [description, setDescription] = useState("");

  const valid =
    ownerName.trim() &&
    businessName.trim() &&
    phone.trim() &&
    email.trim() &&
    crNumber.trim() &&
    password.length >= 8;

  const onSubmit = () => {
    if (!valid) return;
    register.mutate(
      {
        data: {
          ownerName: ownerName.trim(),
          businessName: businessName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          crNumber: crNumber.trim(),
          password,
          description: description.trim() || undefined,
        },
      },
      {
        onSuccess: async (merchant) => {
          await signIn(merchant.id);
          router.replace("/merchant");
        },
        onError: () => {
          Alert.alert("تعذّر التسجيل", "يرجى التحقق من البيانات والمحاولة مرة أخرى.");
        },
      },
    );
  };

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 48, gap: 16 }}
      keyboardShouldPersistTaps="handled"
      bottomOffset={24}
    >
      <View style={{ gap: 6 }}>
        <AppText variant="bold" size={22}>
          بيانات المنشأة
        </AppText>
        <AppText size={14} color={colors.mutedForeground}>
          أدخل بيانات قاعتك وسجلك التجاري لبدء استقبال الحجوزات
        </AppText>
      </View>

      <Field label="اسم المالك" value={ownerName} onChangeText={setOwnerName} placeholder="الاسم الكامل" />
      <Field
        label="اسم المنشأة / القاعة"
        value={businessName}
        onChangeText={setBusinessName}
        placeholder="مثال: قاعة الأصايل"
      />
      <Field
        label="رقم الجوال"
        value={phone}
        onChangeText={setPhone}
        placeholder="05xxxxxxxx"
        keyboardType="phone-pad"
      />
      <Field
        label="البريد الإلكتروني"
        value={email}
        onChangeText={setEmail}
        placeholder="name@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Field
        label="رقم السجل التجاري"
        value={crNumber}
        onChangeText={setCrNumber}
        placeholder="10xxxxxxxx"
        keyboardType="number-pad"
      />
      <Field
        label="كلمة المرور"
        value={password}
        onChangeText={setPassword}
        placeholder="8 أحرف على الأقل"
        secureTextEntry
        autoCapitalize="none"
      />
      <Field
        label="نبذة عن المنشأة (اختياري)"
        value={description}
        onChangeText={setDescription}
        placeholder="وصف مختصر لقاعتك وخدماتك"
        multiline
        inputStyle={{ minHeight: 96, textAlignVertical: "top" }}
      />

      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8, marginTop: 4 }}>
        <Feather name="shield" size={16} color={colors.mutedForeground} />
        <AppText size={12} color={colors.mutedForeground} style={{ flex: 1 }}>
          ستتم مراجعة طلبك من فريق ليلتك قبل نشر القاعة
        </AppText>
      </View>

      <Button
        title="إنشاء الحساب"
        icon="check"
        size="lg"
        loading={register.isPending}
        disabled={!valid}
        onPress={onSubmit}
      />
    </KeyboardAwareScrollView>
  );
}
