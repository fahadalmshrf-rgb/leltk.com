import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform, Pressable, ScrollView, Share, View } from "react-native";

import { AppText, Button, Card, Field, useInsetsCompat } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { publicInviteUrl } from "@/lib/format";
import { useCreateInvitation } from "@workspace/api-client-react";
import type { Invitation } from "@workspace/api-client-react";

type InviterType = "groom" | "bride_family";
type Template = "emerald" | "classic";

const EMPTY = {
  groomName: "",
  groomFatherName: "",
  brideFatherName: "",
  brideMotherName: "",
  groomSideRef: "",
  eventDate: "",
  eventTime: "",
  venueName: "",
  venueAddress: "",
  note: "",
  giftIban: "",
  giftBankName: "",
  giftStcPay: "",
  giftNote: "",
};

export default function InviteScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useInsetsCompat();

  const [template, setTemplate] = useState<Template>("emerald");
  const [inviterType, setInviterType] = useState<InviterType>("groom");
  const [form, setForm] = useState({ ...EMPTY });
  const [giftEnabled, setGiftEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Invitation | null>(null);

  const createMutation = useCreateInvitation();

  const update = (field: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const submit = () => {
    setError(null);
    if (!form.eventDate.trim()) {
      setError("تاريخ المناسبة حقل مطلوب (مثال: 2026-09-15).");
      return;
    }
    if (inviterType === "groom" && !form.groomName.trim()) {
      setError("اسم العريس مطلوب في الدعوة الرجالية.");
      return;
    }
    createMutation.mutate(
      {
        data: {
          template,
          inviterType,
          groomName: form.groomName || null,
          groomFatherName: form.groomFatherName || null,
          brideFatherName: form.brideFatherName || null,
          brideMotherName: form.brideMotherName || null,
          groomSideRef: form.groomSideRef || null,
          eventDate: form.eventDate,
          eventTime: form.eventTime || null,
          venueName: form.venueName || null,
          venueAddress: form.venueAddress || null,
          note: form.note || null,
          giftEnabled,
          giftIban: giftEnabled ? form.giftIban || null : null,
          giftBankName: giftEnabled ? form.giftBankName || null : null,
          giftStcPay: giftEnabled ? form.giftStcPay || null : null,
          giftNote: giftEnabled ? form.giftNote || null : null,
        },
      },
      {
        onSuccess: (inv) => setCreated(inv),
        onError: () => setError("تعذّر إنشاء الدعوة، حاول مرة أخرى."),
      },
    );
  };

  const shareInvite = async (token: string) => {
    try {
      await Share.share({ message: publicInviteUrl(token) });
    } catch {
      /* user dismissed */
    }
  };

  if (created) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 120, paddingHorizontal: 20 }}
      >
        <View style={{ alignItems: "center", gap: 10, marginBottom: 24 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: "rgba(14,78,51,0.1)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="check" size={34} color={colors.primary} />
          </View>
          <AppText variant="display" size={26} color={colors.primary} align="center">
            جاهزة للمشاركة!
          </AppText>
          <AppText color={colors.mutedForeground} align="center">
            شارك رابط الدعوة مع ضيوفك عبر واتساب
          </AppText>
        </View>

        <View style={{ gap: 12 }}>
          <Button
            title="مشاركة رابط الدعوة"
            icon="share-2"
            size="lg"
            onPress={() => shareInvite(created.publicToken)}
          />
          <Button
            title="فتح لوحة المتابعة"
            icon="bar-chart-2"
            variant="secondary"
            onPress={() => {
              import("../../lib/manageTokenStore").then(({ setManageToken }) => {
                setManageToken(created.manageToken);
                router.push({ pathname: "/invite/manage" });
              });
            }}
          />
          <Button
            title="إنشاء دعوة جديدة"
            variant="ghost"
            onPress={() => {
              setCreated(null);
              setForm({ ...EMPTY });
              setGiftEnabled(false);
            }}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 140, paddingHorizontal: 20, gap: 16 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={{ alignItems: "center", gap: 4, marginBottom: 4 }}>
        <Feather name="heart" size={26} color={colors.accent} />
        <AppText variant="display" size={26} color={colors.primary} align="center">
          دعوة زفاف إلكترونية
        </AppText>
        <AppText size={14} color={colors.mutedForeground} align="center">
          أنشئ دعوتك خلال دقيقة، وشاركها برابط واحد
        </AppText>
      </View>

      <Selector
        label="تصميم البطاقة"
        options={[
          { key: "emerald", title: "أخضر ملكي" },
          { key: "classic", title: "كلاسيكي فاخر" },
        ]}
        value={template}
        onChange={(v) => setTemplate(v as Template)}
      />

      <Selector
        label="نوع الدعوة"
        options={[
          { key: "groom", title: "دعوة رجالية", sub: "يدعو العريس" },
          { key: "bride_family", title: "دعوة نسائية", sub: "تدعو أهل العروس" },
        ]}
        value={inviterType}
        onChange={(v) => setInviterType(v as InviterType)}
      />

      {inviterType === "groom" ? (
        <>
          <Field
            label="اسم العريس *"
            value={form.groomName}
            onChangeText={(t) => update("groomName", t)}
            placeholder="فهد بن محمد"
          />
          {template === "classic" ? (
            <Field
              label="اسم والد العريس"
              value={form.groomFatherName}
              onChangeText={(t) => update("groomFatherName", t)}
              placeholder="محمد بن عبدالعزيز"
            />
          ) : null}
          <Field
            label="اسم والد العروس"
            value={form.brideFatherName}
            onChangeText={(t) => update("brideFatherName", t)}
            placeholder="عبدالله بن سعد"
          />
          <Hint text="مراعاةً للخصوصية لا يظهر اسم العروس، وتُذكر بصيغة «وعلى كريمة [اسم والدها]»." />
        </>
      ) : (
        <>
          <Field
            label="اسم أم العروس"
            value={form.brideMotherName}
            onChangeText={(t) => update("brideMotherName", t)}
            placeholder="اختياري — وإلا تظهر «أم العروس»"
          />
          <Field
            label="نجل (اسم أم العريس أو عائلته)"
            value={form.groomSideRef}
            onChangeText={(t) => update("groomSideRef", t)}
            placeholder="مثال: أم عبدالعزيز"
          />
          <Hint text="دعوة بصيغة المؤنث، ولا يظهر اسم العروس." />
        </>
      )}

      <View style={{ flexDirection: "row-reverse", gap: 12 }}>
        <Field
          label="تاريخ المناسبة *"
          style={{ flex: 1 }}
          value={form.eventDate}
          onChangeText={(t) => update("eventDate", t)}
          placeholder="2026-09-15"
        />
        <Field
          label="الوقت"
          style={{ flex: 1 }}
          value={form.eventTime}
          onChangeText={(t) => update("eventTime", t)}
          placeholder="21:00"
        />
      </View>

      <Field
        label="اسم القاعة"
        value={form.venueName}
        onChangeText={(t) => update("venueName", t)}
        placeholder="قاعة اللؤلؤة الملكية"
      />
      <Field
        label="العنوان"
        value={form.venueAddress}
        onChangeText={(t) => update("venueAddress", t)}
        placeholder="حي الملقا، الرياض"
      />
      <Field
        label="كلمة للضيوف (اختياري)"
        value={form.note}
        onChangeText={(t) => update("note", t)}
        placeholder="يشرّفنا حضوركم مشاركتنا فرحتنا"
        multiline
        numberOfLines={3}
        inputStyle={{ minHeight: 80, textAlignVertical: "top" }}
      />

      {/* Gift toggle */}
      <Card style={{ padding: 14, gap: 12 }}>
        <Pressable
          onPress={() => setGiftEnabled((v) => !v)}
          style={{ flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", gap: 12 }}
        >
          <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10, flex: 1 }}>
            <Feather name="gift" size={18} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <AppText variant="semibold" size={15}>
                قسم العنايات المادية
              </AppText>
              <AppText size={12} color={colors.mutedForeground}>
                يتيح للمدعوين تقديم مساعدة مادية (اختياري)
              </AppText>
            </View>
          </View>
          <View
            style={{
              width: 46,
              height: 27,
              borderRadius: 999,
              backgroundColor: giftEnabled ? colors.accent : colors.muted,
              justifyContent: "center",
              paddingHorizontal: 3,
              alignItems: giftEnabled ? "flex-start" : "flex-end",
            }}
          >
            <View style={{ width: 21, height: 21, borderRadius: 999, backgroundColor: "#fff" }} />
          </View>
        </Pressable>

        {giftEnabled ? (
          <View style={{ gap: 12 }}>
            <Field
              label="رقم الآيبان (IBAN)"
              value={form.giftIban}
              onChangeText={(t) => update("giftIban", t)}
              placeholder="SA0000000000000000000000"
              autoCapitalize="characters"
              inputStyle={{ textAlign: "left", writingDirection: "ltr" }}
            />
            <Field
              label="اسم البنك (اختياري)"
              value={form.giftBankName}
              onChangeText={(t) => update("giftBankName", t)}
              placeholder="مصرف الراجحي"
            />
            <Field
              label="رقم STC Pay (اختياري)"
              value={form.giftStcPay}
              onChangeText={(t) => update("giftStcPay", t)}
              placeholder="05xxxxxxxx"
              keyboardType="phone-pad"
              inputStyle={{ textAlign: "left", writingDirection: "ltr" }}
            />
            <Field
              label="كلمة توضيحية (اختياري)"
              value={form.giftNote}
              onChangeText={(t) => update("giftNote", t)}
              placeholder="من أحب المشاركة بهدية، هذا حسابنا — ولا يلزمكم شيء"
              multiline
              inputStyle={{ minHeight: 60, textAlignVertical: "top" }}
            />
          </View>
        ) : null}
      </Card>

      {error ? (
        <AppText color={colors.destructive} align="center">
          {error}
        </AppText>
      ) : null}

      <Button
        title="إنشاء الدعوة ومشاركتها"
        icon="send"
        size="lg"
        onPress={submit}
        loading={createMutation.isPending}
      />
    </ScrollView>
  );
}

function Selector({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: string; title: string; sub?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const colors = useColors();
  return (
    <View style={{ gap: 8 }}>
      <AppText variant="semibold" size={14}>
        {label}
      </AppText>
      <View style={{ flexDirection: "row-reverse", gap: 10 }}>
        {options.map((opt) => {
          const active = value === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onChange(opt.key)}
              style={{
                flex: 1,
                borderRadius: colors.radius,
                borderWidth: 1.5,
                borderColor: active ? colors.primary : colors.border,
                backgroundColor: active ? "rgba(14,78,51,0.08)" : colors.card,
                paddingVertical: 14,
                paddingHorizontal: 10,
                alignItems: "center",
                gap: 2,
              }}
            >
              <AppText
                variant="semibold"
                size={15}
                color={active ? colors.primary : colors.foreground}
                align="center"
              >
                {opt.title}
              </AppText>
              {opt.sub ? (
                <AppText size={11} color={colors.mutedForeground} align="center">
                  {opt.sub}
                </AppText>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Hint({ text }: { text: string }) {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: "row-reverse",
        gap: 8,
        backgroundColor: colors.secondary,
        borderRadius: colors.radius,
        padding: 12,
      }}
    >
      <Feather name="heart" size={14} color={colors.accent} style={{ marginTop: 2 }} />
      <AppText size={12} color={colors.mutedForeground} style={{ flex: 1 }}>
        {text}
      </AppText>
    </View>
  );
}
