import { useState } from "react";
import { Link } from "wouter";
import { useCreateInvitation } from "@workspace/api-client-react";
import type { Invitation } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { saveInvite } from "@/lib/my-invites";
import {
  ArrowRight,
  Copy,
  Check,
  Share2,
  LayoutDashboard,
  Eye,
  Heart,
  Sparkles,
  Gift,
} from "lucide-react";

function buildUrl(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  return `${window.location.origin}${base}${path}`;
}

type InviterType = "groom" | "bride_family";
type Template = "emerald" | "classic";

export default function InviteCreate() {
  const { toast } = useToast();
  const [template, setTemplate] = useState<Template>("emerald");
  const [inviterType, setInviterType] = useState<InviterType>("groom");
  const [form, setForm] = useState({
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
  });
  const [giftEnabled, setGiftEnabled] = useState(false);
  const [created, setCreated] = useState<Invitation | null>(null);
  const [copied, setCopied] = useState<"public" | "manage" | null>(null);

  const createMutation = useCreateInvitation();

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.eventDate) {
      toast({
        title: "أكمل البيانات المطلوبة",
        description: "تاريخ المناسبة حقل مطلوب.",
        variant: "destructive",
      });
      return;
    }
    if (inviterType === "groom" && !form.groomName.trim()) {
      toast({
        title: "أكمل البيانات المطلوبة",
        description: "اسم العريس مطلوب في الدعوة الرجالية.",
        variant: "destructive",
      });
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
        onSuccess: (inv) => {
          setCreated(inv);
          saveInvite({
            manageToken: inv.manageToken,
            title:
              inv.inviterType === "groom"
                ? `دعوة زفاف ${inv.groomName ?? ""}`.trim()
                : `دعوة زفاف ${inv.brideMotherName || "أم العروس"}`,
            eventDate: inv.eventDate,
          });
          toast({ title: "تم إنشاء الدعوة 🎉", description: "شارك الرابط مع ضيوفك الآن." });
        },
        onError: () => {
          toast({
            title: "تعذّر إنشاء الدعوة",
            description: "حدث خطأ، حاول مرة أخرى.",
            variant: "destructive",
          });
        },
      }
    );
  }

  async function copyLink(kind: "public" | "manage", url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1800);
      toast({ title: "تم نسخ الرابط" });
    } catch {
      toast({ title: "تعذّر النسخ", variant: "destructive" });
    }
  }

  if (created) {
    const publicUrl = buildUrl(`i/${created.publicToken}`);
    const manageUrl = buildUrl(`invite/manage`) + `#token=${created.manageToken}`;
    return (
      <div className="min-h-[100dvh] bg-background flex justify-center">
        <div className="w-full max-w-[430px] p-5 space-y-6">
          <div className="text-center pt-8 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-primary">جاهزة للمشاركة!</h1>
            <p className="text-muted-foreground text-sm">
              {created.inviterType === "groom"
                ? `دعوة زفاف ${created.groomName ?? ""}`.trim()
                : `دعوة زفاف ${created.brideMotherName || "أم العروس"}`}
            </p>
          </div>

          <Card className="border-accent/40">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Share2 className="w-5 h-5" />
                <h2 className="font-bold">رابط الدعوة للضيوف</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                أرسل هذا الرابط لضيوفك عبر واتساب — يفتحونه ويؤكدون حضورهم.
              </p>
              <div className="flex gap-2">
                <Input readOnly value={publicUrl} className="text-xs ltr text-left" dir="ltr" />
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  onClick={() => copyLink("public", publicUrl)}
                >
                  {copied === "public" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <a href={publicUrl} target="_blank" rel="noreferrer">
                <Button variant="outline" className="w-full gap-2">
                  <Eye className="w-4 h-4" /> معاينة الدعوة
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <LayoutDashboard className="w-5 h-5" />
                <h2 className="font-bold">رابط لوحة المتابعة (خاص بك)</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                احتفظ بهذا الرابط لنفسك — منه تتابع عدد الحاضرين وردود الضيوف.
              </p>
              <div className="flex gap-2">
                <Input readOnly value={manageUrl} className="text-xs ltr text-left" dir="ltr" />
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  onClick={() => copyLink("manage", manageUrl)}
                >
                  {copied === "manage" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <Link href={`/invite/manage#token=${created.manageToken}`}>
                <Button className="w-full gap-2">
                  <LayoutDashboard className="w-4 h-4" /> فتح لوحة المتابعة
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Link href="/">
            <Button variant="ghost" className="w-full gap-2 text-muted-foreground">
              العودة للرئيسية <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex justify-center">
      <div className="w-full max-w-[430px] p-5 space-y-6">
        <header className="pt-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-accent">
            <Sparkles className="w-5 h-5" />
            <Heart className="w-6 h-6 fill-accent text-accent" />
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold text-primary">دعوة زفاف إلكترونية</h1>
          <p className="text-sm text-muted-foreground">
            أنشئ دعوتك خلال دقيقة، وشاركها مع ضيوفك برابط واحد.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>تصميم البطاقة</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTemplate("emerald")}
                className={`rounded-lg border p-3 text-sm font-medium transition ${
                  template === "emerald"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input text-muted-foreground"
                }`}
              >
                <span className="block h-10 rounded bg-gradient-to-b from-primary to-[hsl(155_70%_12%)] mb-2 ring-1 ring-accent/40" />
                أخضر ملكي
              </button>
              <button
                type="button"
                onClick={() => setTemplate("classic")}
                className={`rounded-lg border p-3 text-sm font-medium transition ${
                  template === "classic"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input text-muted-foreground"
                }`}
              >
                <span className="block h-10 rounded bg-[hsl(40_35%_94%)] mb-2 ring-1 ring-[hsl(35_40%_55%)]/50 flex items-center justify-center text-[hsl(35_45%_42%)] text-xs">
                  زخرفة ذهبية
                </span>
                كلاسيكي فاخر
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>نوع الدعوة</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setInviterType("groom")}
                className={`rounded-lg border p-3 text-sm font-medium transition ${
                  inviterType === "groom"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input text-muted-foreground"
                }`}
              >
                دعوة رجالية
                <span className="block text-[11px] font-normal opacity-80">يدعو العريس</span>
              </button>
              <button
                type="button"
                onClick={() => setInviterType("bride_family")}
                className={`rounded-lg border p-3 text-sm font-medium transition ${
                  inviterType === "bride_family"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input text-muted-foreground"
                }`}
              >
                دعوة نسائية
                <span className="block text-[11px] font-normal opacity-80">تدعو أهل العروس</span>
              </button>
            </div>
          </div>

          {inviterType === "groom" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="groomName">اسم العريس *</Label>
                <Input
                  id="groomName"
                  value={form.groomName}
                  onChange={(e) => update("groomName", e.target.value)}
                  placeholder="فهد بن محمد"
                />
              </div>
              {template === "classic" && (
                <div className="space-y-1.5">
                  <Label htmlFor="groomFatherName">اسم والد العريس</Label>
                  <Input
                    id="groomFatherName"
                    value={form.groomFatherName}
                    onChange={(e) => update("groomFatherName", e.target.value)}
                    placeholder="مثال: محمد بن عبدالعزيز"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="brideFatherName">اسم والد العروس</Label>
                <Input
                  id="brideFatherName"
                  value={form.brideFatherName}
                  onChange={(e) => update("brideFatherName", e.target.value)}
                  placeholder="مثال: عبدالله بن سعد"
                />
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
                <Heart className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                <span>
                  لا يظهر اسم العروس إطلاقًا. تُذكر بصيغة «وعلى كريمة [اسم والدها]» مراعاةً
                  للخصوصية.
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="brideMotherName">اسم أم العروس</Label>
                <Input
                  id="brideMotherName"
                  value={form.brideMotherName}
                  onChange={(e) => update("brideMotherName", e.target.value)}
                  placeholder="اختياري — وإلا تظهر «أم العروس»"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="groomSideRef">نجل (اسم أم العريس أو عائلته)</Label>
                <Input
                  id="groomSideRef"
                  value={form.groomSideRef}
                  onChange={(e) => update("groomSideRef", e.target.value)}
                  placeholder="مثال: أم عبدالعزيز"
                />
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
                <Heart className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
                <span>
                  دعوة بصيغة المؤنث: «تتشرف أم العروس بدعوتكم لحضور حفل زواج ابنتها من نجل
                  [...]». لا يظهر اسم العروس.
                </span>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="eventDate">تاريخ المناسبة *</Label>
              <Input
                id="eventDate"
                type="date"
                value={form.eventDate}
                onChange={(e) => update("eventDate", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eventTime">الوقت</Label>
              <Input
                id="eventTime"
                type="time"
                value={form.eventTime}
                onChange={(e) => update("eventTime", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="venueName">اسم القاعة</Label>
            <Input
              id="venueName"
              value={form.venueName}
              onChange={(e) => update("venueName", e.target.value)}
              placeholder="قاعة اللؤلؤة الملكية"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="venueAddress">العنوان</Label>
            <Input
              id="venueAddress"
              value={form.venueAddress}
              onChange={(e) => update("venueAddress", e.target.value)}
              placeholder="حي الملقا، الرياض"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">كلمة للضيوف (اختياري)</Label>
            <Textarea
              id="note"
              value={form.note}
              onChange={(e) => update("note", e.target.value)}
              placeholder="يشرّفنا حضوركم مشاركتنا فرحتنا"
              rows={3}
            />
          </div>

          <div className="rounded-xl border border-input p-3 space-y-3">
            <button
              type="button"
              onClick={() => setGiftEnabled((v) => !v)}
              className="w-full flex items-center justify-between gap-3 text-right"
            >
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-accent shrink-0" />
                <div>
                  <span className="block text-sm font-medium">قسم العنايات المادية</span>
                  <span className="block text-xs text-muted-foreground">
                    يتيح للمدعوين تقديم مساعدة مادية للعريس (اختياري)
                  </span>
                </div>
              </div>
              <span
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${
                  giftEnabled ? "bg-accent" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    giftEnabled ? "right-0.5" : "right-[22px]"
                  }`}
                />
              </span>
            </button>

            {giftEnabled && (
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="giftIban">رقم الآيبان (IBAN)</Label>
                  <Input
                    id="giftIban"
                    value={form.giftIban}
                    onChange={(e) => update("giftIban", e.target.value)}
                    placeholder="SA0000000000000000000000"
                    dir="ltr"
                    className="text-left"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="giftBankName">اسم البنك (اختياري)</Label>
                  <Input
                    id="giftBankName"
                    value={form.giftBankName}
                    onChange={(e) => update("giftBankName", e.target.value)}
                    placeholder="مثال: مصرف الراجحي"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="giftStcPay">رقم STC Pay (اختياري)</Label>
                  <Input
                    id="giftStcPay"
                    value={form.giftStcPay}
                    onChange={(e) => update("giftStcPay", e.target.value)}
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                    className="text-left"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="giftNote">كلمة توضيحية (اختياري)</Label>
                  <Textarea
                    id="giftNote"
                    value={form.giftNote}
                    onChange={(e) => update("giftNote", e.target.value)}
                    placeholder="من أحب المشاركة بهدية، هذا حسابنا — ولا يلزمكم شيء"
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            {createMutation.isPending ? "جارٍ الإنشاء..." : "إنشاء الدعوة ومشاركتها"}
          </Button>

          <Link href="/invite/manage">
            <Button type="button" variant="ghost" className="w-full gap-2 text-muted-foreground">
              <LayoutDashboard className="w-4 h-4" /> متابعة دعواتي السابقة
            </Button>
          </Link>
          <Link href="/">
            <Button type="button" variant="ghost" className="w-full gap-2 text-muted-foreground">
              العودة للرئيسية <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </form>
      </div>
    </div>
  );
}
