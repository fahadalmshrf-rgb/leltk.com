import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ScrollView, Share, View } from "react-native";

import { AppText, Badge, Button, Card, EmptyState, Loading } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import { formatDateAr, publicInviteUrl } from "@/lib/format";
import { consumeManageToken } from "@/lib/manageTokenStore";
import { useGetManagedInvitation } from "@workspace/api-client-react";

export default function ManageInvitationScreen() {
  const colors = useColors();
  const [token, setToken] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const t = consumeManageToken();
      if (t) setToken(t);
    }, []),
  );

  const managed = useGetManagedInvitation({
    request: { headers: { Authorization: `Bearer ${token ?? ""}` } },
    query: {
      queryKey: ["/api/invitations/manage", token ?? ""],
      enabled: !!token,
    },
  });

  if (!token && !managed.data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <EmptyState
          icon="alert-circle"
          title="لا توجد دعوة للعرض"
          subtitle="افتح لوحة المتابعة من صفحة الدعوة"
        />
      </View>
    );
  }

  if (managed.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Loading />
      </View>
    );
  }

  if (managed.isError || !managed.data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <EmptyState
          icon="alert-circle"
          title="تعذّر تحميل الدعوة"
          subtitle="تأكد من صحة الرابط"
          actionLabel="إعادة المحاولة"
          onAction={() => managed.refetch()}
        />
      </View>
    );
  }

  const { invitation, rsvps, stats } = managed.data;

  const share = async () => {
    try {
      await Share.share({ message: publicInviteUrl(invitation.publicToken) });
    } catch {
      /* dismissed */
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 18 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ gap: 4 }}>
        <AppText variant="display" size={24} color={colors.primary}>
          متابعة الدعوة
        </AppText>
        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
          <Feather name="calendar" size={14} color={colors.mutedForeground} />
          <AppText size={14} color={colors.mutedForeground}>
            {formatDateAr(invitation.eventDate)}
            {invitation.eventTime ? ` — ${invitation.eventTime}` : ""}
          </AppText>
        </View>
      </View>

      <Button title="مشاركة رابط الدعوة" icon="share-2" onPress={share} />

      {/* Stats grid */}
      <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 12 }}>
        <StatBox value={stats.totalResponses} label="إجمالي الردود" icon="users" />
        <StatBox
          value={stats.attendingResponses}
          label="سيحضرون"
          icon="check-circle"
          color={colors.primary}
        />
        <StatBox
          value={stats.decliningResponses}
          label="اعتذروا"
          icon="x-circle"
          color={colors.destructive}
        />
        <StatBox
          value={stats.totalAttendingGuests}
          label="إجمالي الحضور"
          icon="user-check"
          color={colors.accent}
        />
      </View>

      <View style={{ gap: 10 }}>
        <AppText variant="bold" size={18}>
          قائمة الردود
        </AppText>
        {rsvps.length === 0 ? (
          <EmptyState
            icon="inbox"
            title="لا توجد ردود بعد"
            subtitle="شارك الرابط مع ضيوفك لتبدأ التأكيدات بالوصول"
          />
        ) : (
          rsvps.map((r) => (
            <Card key={r.id} style={{ padding: 14, gap: 6 }}>
              <View
                style={{
                  flexDirection: "row-reverse",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <AppText variant="semibold" size={16}>
                  {r.guestName}
                </AppText>
                {r.attending ? (
                  <Badge
                    label={`سيحضر (${r.partySize})`}
                    icon="check"
                    color={colors.primary}
                    background="rgba(14,78,51,0.12)"
                  />
                ) : (
                  <Badge
                    label="اعتذر"
                    icon="x"
                    color={colors.destructive}
                    background="rgba(179,38,30,0.12)"
                  />
                )}
              </View>
              {r.message ? (
                <AppText size={14} color={colors.mutedForeground}>
                  {r.message}
                </AppText>
              ) : null}
            </Card>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function StatBox({
  value,
  label,
  icon,
  color,
}: {
  value: number;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color?: string;
}) {
  const colors = useColors();
  return (
    <Card style={{ width: "47%", flexGrow: 1, padding: 16, alignItems: "center", gap: 4 }}>
      <Feather name={icon} size={22} color={color ?? colors.mutedForeground} />
      <AppText variant="bold" size={22} color={color ?? colors.foreground}>
        {value}
      </AppText>
      <AppText size={12} color={colors.mutedForeground} align="center">
        {label}
      </AppText>
    </Card>
  );
}
