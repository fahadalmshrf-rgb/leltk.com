import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";

import {
  AppText,
  Badge,
  Button,
  Card,
  Divider,
  EmptyState,
  Field,
  Loading,
} from "@/components/ui";
import { useMerchant } from "@/context/MerchantContext";
import { useColors } from "@/hooks/useColors";
import { bookingStatusAr, formatDateAr, formatPrice } from "@/lib/format";
import type { Booking, MerchantDashboard } from "@workspace/api-client-react";
import {
  getGetMerchantDashboardQueryKey,
  useGetMerchantDashboard,
} from "@workspace/api-client-react";

export default function MerchantHome() {
  const { merchantId, ready } = useMerchant();
  const dash = useGetMerchantDashboard(merchantId ?? 0, {
    query: {
      enabled: !!merchantId,
      queryKey: getGetMerchantDashboardQueryKey(merchantId ?? 0),
    },
  });

  if (!ready) return <Loading text="جارٍ التحميل…" />;
  if (!merchantId) return <MerchantOnboarding />;

  if (dash.isLoading) return <Loading text="جارٍ تحميل لوحة التحكم…" />;

  if (dash.isError || !dash.data) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <EmptyState
          icon="alert-triangle"
          title="تعذّر تحميل البيانات"
          subtitle="تأكد من اتصالك ثم أعد المحاولة"
          actionLabel="إعادة المحاولة"
          onAction={() => dash.refetch()}
        />
      </View>
    );
  }

  return <Dashboard data={dash.data} refreshing={dash.isFetching} onRefresh={() => dash.refetch()} />;
}

function Dashboard({
  data,
  refreshing,
  onRefresh,
}: {
  data: MerchantDashboard;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const colors = useColors();
  const router = useRouter();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 18 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Revenue banner */}
      <LinearGradient
        colors={[colors.primary, "#093422"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ borderRadius: colors.radius, padding: 20, gap: 6 }}
      >
        <AppText size={14} color="rgba(255,255,255,0.8)">
          إجمالي الإيرادات
        </AppText>
        <View style={{ flexDirection: "row-reverse", alignItems: "flex-end", gap: 8 }}>
          <AppText variant="display" size={34} color="#fff">
            {formatPrice(Math.round(data.totalRevenue))}
          </AppText>
          <AppText size={16} color={colors.accent} style={{ marginBottom: 6 }}>
            ر.س
          </AppText>
        </View>
        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
          <Feather name="trending-up" size={14} color={colors.accent} />
          <AppText size={13} color="rgba(255,255,255,0.85)">
            هذا الشهر: {formatPrice(Math.round(data.thisMonthRevenue))} ر.س
          </AppText>
        </View>
      </LinearGradient>

      {/* KPI grid */}
      <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 12 }}>
        <Kpi icon="home" value={String(data.totalVenues)} label="القاعات" />
        <Kpi icon="calendar" value={String(data.totalBookings)} label="إجمالي الحجوزات" />
        <Kpi
          icon="clock"
          value={String(data.pendingBookings)}
          label="بانتظار الرد"
          highlight={data.pendingBookings > 0}
        />
        <Kpi icon="check-circle" value={String(data.confirmedBookings)} label="حجوزات مؤكدة" />
        <Kpi icon="star" value={data.avgRating ? data.avgRating.toFixed(1) : "—"} label="متوسط التقييم" />
      </View>

      {/* Actions */}
      <View style={{ gap: 10 }}>
        <NavRow
          icon="grid"
          title="إدارة القاعات"
          subtitle="أضف قاعة أو عدّل التفاصيل والأسعار"
          onPress={() => router.push("/merchant/venues")}
        />
        <NavRow
          icon="inbox"
          title="طلبات الحجز"
          subtitle="اقبل أو ارفض طلبات العملاء"
          badge={data.pendingBookings > 0 ? String(data.pendingBookings) : undefined}
          onPress={() => router.push("/merchant/bookings")}
        />
        <NavRow
          icon="briefcase"
          title="بيانات المنشأة"
          subtitle="السجل التجاري ومعلومات التواصل"
          onPress={() => router.push("/merchant/profile")}
        />
      </View>

      {/* Recent bookings */}
      <View style={{ gap: 12 }}>
        <View
          style={{
            flexDirection: "row-reverse",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <AppText variant="bold" size={19}>
            أحدث الطلبات
          </AppText>
          <Pressable onPress={() => router.push("/merchant/bookings")}>
            <AppText size={14} color={colors.primary} variant="semibold">
              عرض الكل
            </AppText>
          </Pressable>
        </View>
        {data.recentBookings && data.recentBookings.length > 0 ? (
          <Card>
            {data.recentBookings.slice(0, 5).map((b, i) => (
              <View key={b.id}>
                {i > 0 ? <Divider /> : null}
                <RecentBookingRow booking={b} />
              </View>
            ))}
          </Card>
        ) : (
          <Card style={{ padding: 8 }}>
            <EmptyState
              icon="inbox"
              title="لا توجد طلبات بعد"
              subtitle="ستظهر طلبات الحجز الجديدة هنا"
            />
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

function Kpi({
  icon,
  value,
  label,
  highlight,
}: {
  icon: keyof typeof Feather.glyphMap;
  value: string;
  label: string;
  highlight?: boolean;
}) {
  const colors = useColors();
  return (
    <Card style={{ width: "47%", flexGrow: 1, padding: 16, gap: 6 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: highlight ? "rgba(226,175,54,0.18)" : colors.secondary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name={icon} size={18} color={highlight ? colors.accent : colors.primary} />
      </View>
      <AppText variant="bold" size={24} color={colors.foreground}>
        {value}
      </AppText>
      <AppText size={13} color={colors.mutedForeground}>
        {label}
      </AppText>
    </Card>
  );
}

function NavRow({
  icon,
  title,
  subtitle,
  badge,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  badge?: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <Card style={{ padding: 16, opacity: pressed ? 0.85 : 1 }}>
          <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 14 }}>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                backgroundColor: colors.secondary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name={icon} size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bold" size={16}>
                {title}
              </AppText>
              <AppText size={13} color={colors.mutedForeground}>
                {subtitle}
              </AppText>
            </View>
            {badge ? <Badge label={badge} color={colors.accentForeground} background={colors.accent} /> : null}
            <Feather name="chevron-left" size={20} color={colors.mutedForeground} />
          </View>
        </Card>
      )}
    </Pressable>
  );
}

function RecentBookingRow({ booking }: { booking: Booking }) {
  const colors = useColors();
  const statusColor =
    booking.status === "confirmed"
      ? colors.primary
      : booking.status === "cancelled"
        ? colors.destructive
        : colors.accent;
  return (
    <View style={{ padding: 14, gap: 6 }}>
      <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
        <AppText variant="semibold" size={15}>
          {booking.venueName}
        </AppText>
        <Badge label={bookingStatusAr(booking.status)} color={statusColor} background={`${statusColor}22`} />
      </View>
      <View style={{ flexDirection: "row-reverse", gap: 14 }}>
        <AppText size={13} color={colors.mutedForeground}>
          {formatDateAr(booking.eventDate)}
        </AppText>
        <AppText size={13} color={colors.mutedForeground}>
          {booking.guestCount} ضيف
        </AppText>
        <AppText size={13} color={colors.primary} variant="semibold">
          {formatPrice(booking.totalPrice)} ر.س
        </AppText>
      </View>
    </View>
  );
}

function MerchantOnboarding() {
  const colors = useColors();
  const router = useRouter();
  const { signIn } = useMerchant();
  const [accountId, setAccountId] = React.useState("");

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 24, gap: 22, flexGrow: 1, justifyContent: "center" }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: 24,
            backgroundColor: colors.secondary,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="briefcase" size={38} color={colors.primary} />
        </View>
        <AppText variant="display" size={28} color={colors.primary} align="center">
          بوابة أصحاب القاعات
        </AppText>
        <AppText size={15} color={colors.mutedForeground} align="center">
          سجّل قاعتك على ليلتك وابدأ باستقبال طلبات الحجز من العرسان مباشرة
        </AppText>
      </View>

      <View style={{ gap: 12 }}>
        <Button
          title="تسجيل قاعة جديدة"
          icon="plus-circle"
          size="lg"
          onPress={() => router.push("/merchant/register")}
        />
      </View>

      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <AppText size={13} color={colors.mutedForeground}>
          لديك حساب بالفعل؟
        </AppText>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>

      <Card style={{ padding: 16, gap: 12 }}>
        <Field
          label="الدخول برقم الحساب"
          value={accountId}
          onChangeText={setAccountId}
          keyboardType="number-pad"
          placeholder="مثال: 1"
        />
        <Button
          title="دخول"
          icon="log-in"
          variant="outline"
          disabled={!accountId.trim() || Number(accountId) <= 0}
          onPress={async () => {
            await signIn(Number(accountId));
          }}
        />
      </Card>
    </ScrollView>
  );
}
