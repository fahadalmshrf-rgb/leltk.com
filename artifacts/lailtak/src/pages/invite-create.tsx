import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useCreateInvitation } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Calendar, Clock, MapPin, Building, Gift, CheckCircle2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function InviteCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createMutation = useCreateInvitation();

  const todayStr = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  const maxDateStr = useMemo(() => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 18);
    return maxDate.toISOString().split("T")[0];
  }, []);

  const [formData, setFormData] = useState({
    inviterType: "groom" as const,
    template: "classic" as string,
    groomName: "",
    groomFatherName: "",
    groomGrandfatherName: "",
    brideFatherFullName: "",
    eventDate: todayStr,
    eventTime: "20:00",
    venueName: "",
    venueAddress: "",
    note: "يشرفنا حضوركم ومشاركتنا فرحتنا",
    giftEnabled: false,
    giftBankName: "",
    giftIban: "",
    giftNote: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.groomName.trim()) {
      toast({ title: "تنبيه", description: "يرجى إدخال الاسم الأول للعريس", variant: "destructive" });
      return;
    }
    if (!formData.groomFatherName.trim()) {
      toast({ title: "تنبيه", description: "يرجى إدخال الاسم الأول لوالد العريس", variant: "destructive" });
      return;
    }
    if (!formData.groomGrandfatherName.trim()) {
      toast({ title: "تنبيه", description: "يرجى إدخال اسم جد العريس", variant: "destructive" });
      return;
    }
    if (!formData.brideFatherFullName.trim()) {
      toast({ title: "تنبيه", description: "يرجى إدخال الاسم الرباعي لوالد العروس", variant: "destructive" });
      return;
    }

    try {
      const res = await createMutation.mutateAsync({
        data: {
          inviterType: formData.inviterType as any,
          template: formData.template as any,
          groomName: formData.groomName,
          groomFatherName: `${formData.groomFatherName} ${formData.groomGrandfatherName}`,
          brideFatherName: formData.brideFatherFullName,
          eventDate: formData.eventDate,
          eventTime: formData.eventTime || null,
          venueName: formData.venueName || null,
          venueAddress: formData.venueAddress || null,
          note: formData.note || null,
          giftEnabled: formData.giftEnabled,
          giftBankName: formData.giftEnabled ? formData.giftBankName : null,
          giftIban: formData.giftEnabled ? formData.giftIban : null,
          giftNote: formData.giftEnabled ? formData.giftNote : null,
        },
      });

      if (res && res.id) {
        toast({ title: "تم إنشاء الدعوة بنجاح!" });
        setLocation(`/invite/manage/${res.id}`);
      }
    } catch (err) {
      toast({
        title: "تعذّر إنشاء الدعوة",
        description: "حدث خطأ أثناء حفظ البيانات، يرجى التأكد من الحقول وتكرار المحاولة.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-28 text-right" dir="rtl">
      <div className="flex items-center gap-3 border-b pb-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold font-serif text-primary">تصميم دعوة زفاف إلكترونية</h1>
          <p className="text-xs text-muted-foreground mt-0.5">قم بتعبئة التفاصيل لمشاركة الدعوة مع ضيوفك</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label className="font-semibold text-sm">اختر تصميم الدعوة *</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, template: "classic" })}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                formData.template === "classic"
                  ? "border-amber-500 bg-amber-500/10 text-amber-900 shadow-sm"
                  : "border-border hover:border-amber-300"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-500" />
                زخرفة ذهبية
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">طابع كلاسيكي فاخر</p>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, template: "royal_green" })}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                formData.template === "royal_green"
                  ? "border-emerald-700 bg-emerald-700/10 text-emerald-950 shadow-sm"
                  : "border-border hover:border-emerald-300"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 font-bold text-sm text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                أخضر ملكي
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">طابع زمردي أنيق</p>
            </button>
          </div>
        </div>

        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-bold text-sm text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> أسماء العريس *
            </h3>
            
            <div className="space-y-1.5">
              <Label className="text-xs">الاسم الأول للعريس *</Label>
              <Input
                required
                value={formData.groomName}
                onChange={(e) => setFormData({ ...formData, groomName: e.target.value })}
                placeholder="مثال: فهد"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">الاسم الأول لوالد العريس *</Label>
                <Input
                  required
                  value={formData.groomFatherName}
                  onChange={(e) => setFormData({ ...formData, groomFatherName: e.target.value })}
                  placeholder="مثال: عبد الإله"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">اسم جد العريس *</Label>
                <Input
                  required
                  value={formData.groomGrandfatherName}
                  onChange={(e) => setFormData({ ...formData, groomGrandfatherName: e.target.value })}
                  placeholder="مثال: المشرف"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-bold text-sm text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> معلومات العروس *
            </h3>

            <div className="space-y-1.5">
              <Label className="text-xs">الاسم الرباعي لوالد العروس *</Label>
              <Input
                required
                value={formData.brideFatherFullName}
                onChange={(e) => setFormData({ ...formData, brideFatherFullName: e.target.value })}
                placeholder="مثال: عبد الله بن محمد بن إبراهيم آل سعود"
              />
              <p className="text-[11px] text-muted-foreground">
                * يُذكر بالدعوة بصيغة «كريمة [اسم والد العروس الرباعي]» مراعاة للخصوصية.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" /> تاريخ المناسبة *
              </Label>
              <Input
                type="date"
                required
                min={todayStr}
                max={maxDateStr}
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" /> الوقت
              </Label>
              <Input
                type="time"
                value={formData.eventTime}
                onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-primary" /> اسم القاعة / المكان
            </Label>
            <Input
              value={formData.venueName}
              onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
              placeholder="مثال: قاعة اللؤلؤة الملكية"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" /> العنوان / الحي
            </Label>
            <Input
              value={formData.venueAddress}
              onChange={(e) => setFormData({ ...formData, venueAddress: e.target.value })}
              placeholder="مثال: حي الملقا، الرياض"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">كلمة للضيوف (اختياري)</Label>
            <Textarea
              rows={2}
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="عبارة ترحيبية بالضيوف..."
            />
          </div>
        </div>

        <Card className="border-accent/40 bg-accent/5">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-accent" />
                <Label className="font-bold text-xs cursor-pointer">قسم العنايات المادية (اختياري)</Label>
              </div>
              <Switch
                checked={formData.giftEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, giftEnabled: checked })}
              />
            </div>

            {formData.giftEnabled && (
              <div className="space-y-3 pt-2 border-t border-accent/20">
                <Input
                  placeholder="اسم البنك"
                  value={formData.giftBankName}
                  onChange={(e) => setFormData({ ...formData, giftBankName: e.target.value })}
                />
                <Input
                  placeholder="رقم الآيبان SA..."
                  value={formData.giftIban}
                  onChange={(e) => setFormData({ ...formData, giftIban: e.target.value })}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-base font-bold shadow-lg rounded-xl"
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? "جاري إنشاء الدعوة..." : "إنشاء الدعوة ومشاركتها"}
        </Button>
      </form>
    </div>
  );
}

export default InviteCreate;