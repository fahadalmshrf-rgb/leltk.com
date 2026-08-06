import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getSavedInvites, saveInvite, removeInvite, type SavedInvite } from "@/lib/my-invites";
import { useGetManagedInvitation } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  UserCheck,
  UserX,
  Copy,
  Check,
  Share2,
  Calendar,
  ArrowRight,
  LayoutDashboard,
} from "lucide-react";

function buildUrl(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  return `${window.location.origin}${base}${path}`;
}

function readAndClearFragmentToken(): string {
  const hash = window.location.hash;
  const token = hash.startsWith("#token=") ? decodeURIComponent(hash.slice(7)) : "";
  if (token) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
  return token;
}

export default function InviteManage() {
  const [manageToken, setManageToken] = useState<string>(readAndClearFragmentToken);
  const [savedInvites, setSavedInvites] = useState<SavedInvite[]>(getSavedInvites);
  const { toast } = useToast();
  const { data, isLoading, isError } = useGetManagedInvitation({
    request: { headers: { Authorization: `Bearer ${manageToken}` } },
    query: {
      queryKey: ["/api/invitations/manage", manageToken],
      enabled: !!manageToken,
    },
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (data && manageToken) {
      const inv = data.invitation;
      saveInvite({
        manageToken,
        title:
          inv.inviterType === "groom"
            ? `دعوة زفاف ${inv.groomName ?? ""}`.trim()
            : `دعوة زفاف ${inv.brideMotherName || "أم العروس"}`,
        eventDate: inv.eventDate,
      });
    }
  }, [data, manageToken]);

  if (!manageToken) {
    return (
      <div className="min-h-[100dvh] bg-background flex justify-center">
        <div className="w-full max-w-[430px] p-5 space-y-6">
          <header className="pt-8 text-center space-y-2">
            <h1 className="text-2xl font-bold text-primary">دعواتي</h1>
            <p className="text-muted-foreground text-sm">
              {savedInvites.length > 0
                ? "الدعوات المحفوظة على هذا الجهاز — اختر دعوة لمتابعتها."
                : "لا توجد دعوات محفوظة على هذا الجهاز. افتح رابط المتابعة الذي تلقيته، أو أنشئ دعوة جديدة."}
            </p>
          </header>

          {savedInvites.length > 0 && (
            <div className="space-y-2">
              {savedInvites.map((inv) => (
                <Card key={inv.manageToken} className="border-primary/20">
                  <CardContent className="p-4">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between gap-3 text-right"
                      onClick={() => setManageToken(inv.manageToken)}
                    >
                      <div className="min-w-0 space-y-0.5">
                        <p className="font-bold text-primary truncate">{inv.title || "دعوة زفاف"}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {inv.eventDate}
                        </p>
                      </div>
                      <LayoutDashboard className="w-5 h-5 text-primary shrink-0" />
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Link href="/invite">
            <Button variant="outline" className="w-full">إنشاء دعوة جديدة</Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="w-full gap-2 text-muted-foreground">
              العودة للرئيسية <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary text-lg">جارٍ تحميل اللوحة...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center p-6 text-center">
        <div className="space-y-4 w-full max-w-[430px]">
          <h1 className="text-xl font-bold text-primary">اللوحة غير متاحة</h1>
          <p className="text-muted-foreground text-sm">قد يكون رابط المتابعة غير صحيح أو انتهت صلاحيته.</p>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                removeInvite(manageToken);
                setSavedInvites(getSavedInvites());
                setManageToken("");
              }}
            >
              حذف هذه الدعوة من الجهاز والعودة لدعواتي
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => setManageToken("")}
            >
              العودة لقائمة دعواتي
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { invitation, rsvps, stats } = data;
  const publicUrl = buildUrl(`i/${invitation.publicToken}`);

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast({ title: "تم نسخ رابط الدعوة" });
    } catch {
      toast({ title: "تعذّر النسخ", variant: "destructive" });
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background flex justify-center">
      <div className="w-full max-w-[430px] p-5 space-y-6">
        <header className="pt-6 space-y-1 text-center">
          <p className="text-xs text-accent tracking-widest">لوحة متابعة الدعوة</p>
          <h1 className="text-2xl font-bold text-primary">
            {invitation.inviterType === "groom"
              ? invitation.groomName
              : invitation.brideMotherName || "أم العروس"}
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Calendar className="w-4 h-4" />
            <span>{invitation.eventDate}</span>
          </div>
        </header>

        {/* Headcount hero */}
        <Card className="border-accent/40 bg-primary text-primary-foreground">
          <CardContent className="p-6 text-center space-y-1">
            <p className="text-primary-foreground/80 text-sm">إجمالي عدد الحضور المؤكَّد</p>
            <p className="text-5xl font-bold text-accent">{stats.totalAttendingGuests}</p>
            <p className="text-primary-foreground/70 text-xs">شخص (شاملاً المرافقين)</p>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center space-y-1">
              <UserCheck className="w-5 h-5 mx-auto text-primary" />
              <p className="text-xl font-bold text-primary">{stats.attendingResponses}</p>
              <p className="text-[11px] text-muted-foreground">سيحضرون</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center space-y-1">
              <UserX className="w-5 h-5 mx-auto text-destructive" />
              <p className="text-xl font-bold text-destructive">{stats.decliningResponses}</p>
              <p className="text-[11px] text-muted-foreground">اعتذروا</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center space-y-1">
              <Users className="w-5 h-5 mx-auto text-muted-foreground" />
              <p className="text-xl font-bold">{stats.totalResponses}</p>
              <p className="text-[11px] text-muted-foreground">إجمالي الردود</p>
            </CardContent>
          </Card>
        </div>

        {/* Share */}
        <Card className="border-accent/30">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <Share2 className="w-4 h-4" />
              <span className="font-bold text-sm">رابط الدعوة</span>
            </div>
            <div className="flex gap-2">
              <Input readOnly value={publicUrl} dir="ltr" className="text-xs text-left" />
              <Button type="button" size="icon" variant="secondary" onClick={copyShare}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* RSVP list */}
        <section className="space-y-3">
          <h2 className="font-bold text-primary">ردود الضيوف ({rsvps.length})</h2>
          {rsvps.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              لا توجد ردود بعد. شارك الرابط مع ضيوفك.
            </p>
          ) : (
            <div className="space-y-2">
              {rsvps.map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-3 flex items-start justify-between gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-bold truncate">{r.guestName}</p>
                      {r.message && (
                        <p className="text-xs text-muted-foreground truncate">«{r.message}»</p>
                      )}
                    </div>
                    {r.attending ? (
                      <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                        <UserCheck className="w-3 h-3" /> {r.partySize}
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-full">
                        <UserX className="w-3 h-3" /> اعتذر
                      </span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <Link href="/">
          <Button variant="ghost" className="w-full gap-2 text-muted-foreground">
            العودة للرئيسية <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
