import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useGetPublicInvitation, useRespondToInvitation } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Check,
  Minus,
  Plus,
  PartyPopper,
  Gift,
  Copy,
  Send,
  X,
} from "lucide-react";

function formatHijri(date: string): string {
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  } catch {
    return date;
  }
}

function formatGregorian(date: string): string {
  try {
    return new Intl.DateTimeFormat("ar", {
      calendar: "gregory",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  } catch {
    return "";
  }
}

// Helper function to dynamically scale text based on character count
function getDynamicFontSize(text: string): string {
  const length = text.trim().length;
  if (length > 45) return "text-[10px] sm:text-[11px] leading-tight";
  if (length > 30) return "text-[11px] sm:text-xs leading-snug";
  if (length > 20) return "text-xs sm:text-sm leading-normal";
  return "text-xs sm:text-sm md:text-base";
}

export default function InviteView({ params }: { params: { publicToken: string } }) {
  const { publicToken } = params;
  const { toast } = useToast();
  const { data, isLoading, isError } = useGetPublicInvitation(publicToken);
  const respond = useRespondToInvitation();

  const [guestName, setGuestName] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState<null | { attending: boolean }>(null);
  const [copiedGift, setCopiedGift] = useState<string | null>(null);
  const [showRsvpModal, setShowRsvpModal] = useState(false);

  async function copyGift(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedGift(value);
      setTimeout(() => setCopiedGift(null), 1800);
      toast({ title: "تم النسخ" });
    } catch {
      toast({ title: "تعذّر النسخ", variant: "destructive" });
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[#f6f1e7] flex items-center justify-center">
        <div className="animate-pulse text-[#a67c3d] font-semibold text-lg">جارٍ تحميل الدعوة...</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-[100dvh] bg-[#f6f1e7] flex items-center justify-center p-6 text-center">
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-[#7a5a2c]">الدعوة غير موجودة</h1>
          <p className="text-[#a67c3d] text-sm">قد يكون الرابط غير صحيح أو منتهي.</p>
        </div>
      </div>
    );
  }

  function submit(attending: boolean) {
    if (!guestName.trim()) {
      toast({
        title: "اكتب اسمك أولاً",
        description: "نحتاج اسمك لتسجيل ردك.",
        variant: "destructive",
      });
      return;
    }
    respond.mutate(
      {
        publicToken,
        data: {
          guestName: guestName.trim(),
          attending,
          partySize: attending ? partySize : 0,
          message: message.trim() || null,
        },
      },
      {
        onSuccess: () => setDone({ attending }),
        onError: () =>
          toast({
            title: "تعذّر إرسال ردك",
            description: "حاول مرة أخرى.",
            variant: "destructive",
          }),
      }
    );
  }

  const location =
    data.venueName || data.venueAddress
      ? [data.venueName, data.venueAddress].filter(Boolean).join(" — ")
      : null;

  const showGift =
    data.giftEnabled && (data.giftIban || data.giftStcPay || data.giftBankName);

  const giftRow = (labelText: string, value: string, ltr = false) => (
    <div className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 bg-white/90 border border-[#c9a760]/40">
      <div className="min-w-0 text-right">
        <p className="text-[11px] text-[#a67c3d]">{labelText}</p>
        <p className="text-sm font-medium truncate text-[#7a5a2c]" dir={ltr ? "ltr" : undefined}>
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={() => copyGift(value)}
        className="shrink-0 rounded-md p-1.5 text-[#a67c3d] hover:bg-[#a67c3d]/10"
        aria-label="نسخ"
      >
        {copiedGift === value ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );

  // Name construction variables
  const groomFatherText = data.groomFatherName || "محمد بن خالد بن عميش الحوشان";
  const brideFatherText = data.brideFatherName || "أحمد بن فهد بن خريوش المقبل";
  const groomFullText = data.groomName || "فهد بن محمد بن خالد الحوشان";

  // Check combined host length for fallback layout
  const isHostVeryLong = (groomFatherText + brideFatherText).length > 65;

  return (
    <div className="min-h-[100dvh] bg-[#f6f1e7] text-[#7a5a2c] flex flex-col justify-between items-center p-4 overflow-x-hidden select-none">
      
      {/* CARD VIEW CONTAINER */}
      <div className="w-full max-w-[430px] my-auto flex flex-col items-center">
        
        {/* Classical Card Canvas */}
        <div className="w-full bg-[#fcfaf5] rounded-xl shadow-2xl border-2 border-[#c9a760]/50 p-5 flex flex-col justify-between relative">
          
          {/* Top Double Ornamental Gold Lines */}
          <div className="space-y-1 mb-3">
            <div className="h-[2px] bg-[#c9a760]" />
            <div className="h-[1px] bg-[#c9a760]/40" />
          </div>

          {/* Calligraphy Header */}
          <div className="text-center space-y-1 py-1">
            <p className="text-[13px] text-[#8a6a35] font-serif tracking-wide leading-relaxed">
              بارك الله لهما وبارك عليهما وجمع بينهما في خير
            </p>
            <p className="text-[13px] text-[#8a6a35] font-serif pt-1">يَتَشَرَّف</p>
          </div>

          {/* 1. HOST LINE (Collision-Proof Connector Spacing) */}
          <div className="py-2 text-center px-4">
            {data.inviterType === "groom" ? (
              <div className="text-[#a67c3d] font-semibold dir-rtl">
                {isHostVeryLong ? (
                  <div className="space-y-0.5 text-xs sm:text-sm">
                    <p>{groomFatherText}</p>
                    <span className="text-[#8a6a35] font-serif text-xs block my-0.5">و</span>
                    <p>{brideFatherText}</p>
                  </div>
                ) : (
                  <p className={`leading-relaxed break-words ${getDynamicFontSize(groomFatherText + brideFatherText)}`}>
                    <span className="inline-block">{groomFatherText}</span>
                    <span className="text-[#8a6a35] font-normal mx-3 inline-block select-none">&nbsp;و&nbsp;</span>
                    <span className="inline-block">{brideFatherText}</span>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs sm:text-sm font-semibold text-[#a67c3d]">
                {data.brideMotherName || "أم العروس"}
              </p>
            )}
            <p className="text-[12px] text-[#8a6a35] pt-1.5">بدعوتكم لحضور حفل زواج</p>
          </div>

          {/* 2. COUPLE SECTION (Grid Balanced with Dynamic Text Scaling) */}
          <div className="py-3 px-3 my-1 bg-[#f7f2e7]/40 rounded-xl border border-[#c9a760]/20 min-h-[70px] flex items-center">
            {data.inviterType === "groom" ? (
              <div className="w-full grid grid-cols-11 items-center text-center gap-1">
                
                {/* Groom Side */}
                <div className="col-span-5 flex flex-col justify-center items-center px-0.5">
                  <span className="text-[10px] text-[#8a6a35] block mb-0.5">الابن</span>
                  <span className={`font-semibold text-[#a67c3d] break-words w-full ${getDynamicFontSize(groomFullText)}`}>
                    {groomFullText}
                  </span>
                </div>

                {/* Connector "على" */}
                <div className="col-span-1 flex items-center justify-center">
                  <span className="text-xs font-serif text-[#8a6a35] select-none">على</span>
                </div>

                {/* Bride Side */}
                <div className="col-span-5 flex flex-col justify-center items-center px-0.5">
                  <span className="text-[10px] text-[#8a6a35] block mb-0.5">كريمة</span>
                  <span className={`font-semibold text-[#a67c3d] break-words w-full ${getDynamicFontSize(brideFatherText)}`}>
                    {brideFatherText}
                  </span>
                </div>

              </div>
            ) : (
              <div className="w-full text-center space-y-1">
                <p className="text-xs sm:text-sm font-semibold text-[#a67c3d]">ابنتها</p>
                {data.groomSideRef && (
                  <p className="text-xs text-[#8a6a35]">
                    على نجل <span className="font-semibold text-[#a67c3d]">{data.groomSideRef}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Event Details */}
          <div className="text-center space-y-2 py-2 text-[#7a5a2c]">
            <p className="text-[11px] text-[#8a6a35]">وذلك بمشيئة الله تعالى</p>
            <div className="py-1">
              <p className="text-sm font-semibold">{formatHijri(data.eventDate)} هـ</p>
              <p className="text-[11px] opacity-90">
                الموافق {formatGregorian(data.eventDate)} م{data.eventTime ? ` — الساعة ${data.eventTime}` : ""}
              </p>
            </div>

            {location && (
              <div className="flex items-center justify-center gap-1 text-[11px] text-[#7a5a2c]">
                <MapPin className="w-3.5 h-3.5 text-[#a67c3d] shrink-0" />
                <span>{location}</span>
              </div>
            )}

            <p className="text-[11px] text-[#a67c3d] font-medium pt-1">شاكرين لكم تلبية الدعوة</p>
          </div>

          {/* Bottom QR Code (Brand Mark Removed) */}
          <div className="pt-3 mt-1 border-t border-[#c9a760]/30 flex items-end justify-end">
            <div className="bg-white p-1 rounded border border-[#c9a760]/40 shadow-sm shrink-0">
              <QRCodeSVG
                value={typeof window !== "undefined" ? window.location.href : ""}
                size={42}
                fgColor="#8a6a35"
                bgColor="#ffffff"
                level="M"
              />
            </div>
          </div>

          {/* Bottom Double Gold Lines */}
          <div className="space-y-1 mt-3">
            <div className="h-[1px] bg-[#c9a760]/40" />
            <div className="h-[2px] bg-[#c9a760]" />
          </div>

        </div>
      </div>

      {/* FLOATING ACTION BOTTOM BAR */}
      <div className="w-full max-w-[430px] pt-4">
        <Button
          onClick={() => setShowRsvpModal(true)}
          className="w-full py-6 bg-[#a67c3d] text-white font-medium text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:bg-[#8f6a33] active:scale-[0.99] transition-all"
        >
          <Send className="w-5 h-5" />
          <span>تأكيد الحضور والبيانات</span>
        </Button>
      </div>

      {/* RSVP MODAL SHEET (OVERLAY) */}
      {showRsvpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end animate-in fade-in duration-200">
          <div className="w-full max-w-[430px] bg-[#fcfaf5] rounded-t-3xl p-6 space-y-6 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 border-t-2 border-[#c9a760]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#c9a760]/30 pb-3">
              <h2 className="font-bold text-lg text-[#7a5a2c]">تفاصيل الدعوة وتأكيد الحضور</h2>
              <button
                onClick={() => setShowRsvpModal(false)}
                className="p-1.5 rounded-full text-[#a67c3d] hover:bg-[#a67c3d]/10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {data.note && (
              <div className="bg-white/80 p-3.5 rounded-xl border border-[#c9a760]/40 text-center">
                <p className="text-xs italic text-[#8a6a35]">«{data.note}»</p>
              </div>
            )}

            {/* Gifts section */}
            {showGift && (
              <div className="space-y-3 bg-white/80 rounded-xl p-4 border border-[#c9a760]/40">
                <div className="flex items-center justify-center gap-2 font-bold text-[#7a5a2c] text-sm">
                  <Gift className="w-4 h-4 text-[#a67c3d]" />
                  <span>العنايات المادية</span>
                </div>
                <p className="text-center text-xs text-[#8a6a35]">
                  {data.giftNote || "من أحبّ المشاركة بهدية للعروسين، هذه بياناته — ولا يلزمكم شيء."}
                </p>
                <div className="space-y-2">
                  {data.giftIban && giftRow("رقم الآيبان (IBAN)", data.giftIban, true)}
                  {data.giftBankName && giftRow("البنك", data.giftBankName)}
                  {data.giftStcPay && giftRow("STC Pay", data.giftStcPay, true)}
                </div>
              </div>
            )}

            {/* Form submission */}
            {done ? (
              <div className="text-center space-y-3 rounded-xl p-6 bg-white/80 border border-[#c9a760]/40">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#a67c3d]/15 flex items-center justify-center">
                  {done.attending ? (
                    <PartyPopper className="w-6 h-6 text-[#a67c3d]" />
                  ) : (
                    <Check className="w-6 h-6 text-[#a67c3d]" />
                  )}
                </div>
                <h3 className="text-lg font-bold text-[#7a5a2c]">
                  {done.attending ? "بإذن الله نراك هناك!" : "شكراً على ردك"}
                </h3>
                <p className="text-xs text-[#8a6a35]">
                  {done.attending
                    ? "تم تسجيل حضورك بنجاح، بانتظارك."
                    : "نأسف لعدم تمكنك من الحضور، ودمت بخير."}
                </p>
              </div>
            ) : (
              <div className="space-y-4 rounded-xl p-4 bg-white/80 border border-[#c9a760]/40">
                <div className="space-y-1.5">
                  <Label htmlFor="guestName" className="text-[#7a5a2c] text-xs">
                    الاسم
                  </Label>
                  <Input
                    id="guestName"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="اسمك الكريم"
                    className="bg-white border-[#c9a760]/40 text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[#7a5a2c] text-xs">عدد الحضور (شاملاً نفسك)</Label>
                  <div className="flex items-center justify-between rounded-md px-2 py-1 bg-white border border-[#c9a760]/40">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => setPartySize((n) => Math.max(1, n - 1))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="font-bold text-base text-foreground">{partySize}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => setPartySize((n) => Math.min(20, n + 1))}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-[#7a5a2c] text-xs">
                    تهنئة (اختياري)
                  </Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="ألف مبروك..."
                    rows={2}
                    className="bg-white border-[#c9a760]/40 text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    type="button"
                    className="bg-[#a67c3d] text-white hover:bg-[#8f6a33]"
                    disabled={respond.isPending}
                    onClick={() => submit(true)}
                  >
                    سأحضر
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[#a67c3d]/50 text-[#7a5a2c] hover:bg-[#a67c3d]/10"
                    disabled={respond.isPending}
                    onClick={() => submit(false)}
                  >
                    أعتذر
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}