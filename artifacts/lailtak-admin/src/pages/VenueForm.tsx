import { useEffect, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { apiFetch } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FIELD_STATUSES, CATEGORIES, type AdminVenue } from "@/lib/fieldwork";
import LocationPicker from "@/components/LocationPicker";
import { ArrowRight, Trash2, X, Upload, FileText, ImagePlus, UserCheck, Copy, CheckCheck } from "lucide-react";

const AMENITIES = [
  "نظام صوتي",
  "إضاءة احترافية",
  "مطبخ",
  "غرفة عروس",
  "مواقف سيارات",
  "مصلى",
  "قسم نساء منفصل",
  "مكيفات",
];

type FormState = {
  nameAr: string;
  categorySlug: string;
  district: string;
  address: string;
  pricePerNight: string;
  capacity: string;
  capacityMin: string;
  latitude: string;
  longitude: string;
  phone: string;
  description: string;
  fieldStatus: string;
  ownerName: string;
  ownerPhone: string;
  privateNotes: string;
  amenities: string[];
  isAvailable: boolean;
  images: string[];
  menuPdf: string | null;
};

const empty: FormState = {
  nameAr: "",
  categorySlug: "wedding-hall",
  district: "",
  address: "",
  pricePerNight: "",
  capacity: "",
  capacityMin: "",
  latitude: "",
  longitude: "",
  phone: "",
  description: "",
  fieldStatus: "not_visited",
  ownerName: "",
  ownerPhone: "",
  privateNotes: "",
  amenities: [],
  isAvailable: false,
  images: [],
  menuPdf: null,
};

/** Convert a stored objectPath to a URL served by the API */
function objectUrl(objectPath: string): string {
  return `/api/storage${objectPath}`;
}

/** Request a presigned upload URL from the admin endpoint */
async function requestUploadUrl(file: File): Promise<{ uploadURL: string; objectPath: string }> {
  const res = await apiFetch("/api/admin/venues/upload-url", {
    method: "POST",
    body: JSON.stringify({
      name: file.name,
      size: file.size,
      contentType: file.type || "application/octet-stream",
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "فشل طلب رابط الرفع");
  }
  return res.json();
}

/** Upload a file to GCS via presigned URL */
async function uploadToGcs(file: File, uploadURL: string): Promise<void> {
  const res = await fetch(uploadURL, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
  if (!res.ok) throw new Error("فشل رفع الملف إلى التخزين");
}

type MerchantCredentials = { merchantId: number; email: string; password: string };

export default function VenueForm() {
  const [, params] = useRoute("/venues/:id");
  const isNew = !params || params.id === "new";
  const id = isNew ? null : Number(params!.id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(empty);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  // Merchant linkage (read-only, not part of form)
  const [merchantId, setMerchantId] = useState<number | null>(null);
  const [converting, setConverting] = useState(false);
  const [credentials, setCredentials] = useState<MerchantCredentials | null>(null);
  const [copied, setCopied] = useState(false);

  // Upload state
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNew || id === null) return;
    apiFetch(`/api/admin/venues/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("القاعة غير موجودة");
        const v: AdminVenue & { menuPdf?: string | null } = await res.json();
        setMerchantId(v.merchantId ?? null);
        setForm({
          nameAr: v.nameAr,
          categorySlug: v.categorySlug,
          district: v.district,
          address: v.address ?? "",
          pricePerNight: v.pricePerNight,
          capacity: String(v.capacity),
          capacityMin: v.capacityMin != null ? String(v.capacityMin) : "",
          latitude: v.latitude ?? "",
          longitude: v.longitude ?? "",
          phone: v.phone ?? "",
          description: v.description ?? "",
          fieldStatus: v.fieldStatus,
          ownerName: v.ownerName ?? "",
          ownerPhone: v.ownerPhone ?? "",
          privateNotes: v.privateNotes ?? "",
          amenities: v.amenities,
          isAvailable: v.isAvailable,
          images: v.images ?? [],
          menuPdf: v.menuPdf ?? null,
        });
      })
      .catch(() => toast({ title: "القاعة غير موجودة", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // ── Photo upload ──────────────────────────────────────────────────────────

  async function handlePhotoFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadingPhotos(true);
    const newPaths: string[] = [];
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        errors.push(`${file.name}: يجب أن يكون صورة`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: الحجم أكبر من 10 ميغابايت`);
        continue;
      }
      try {
        const { uploadURL, objectPath } = await requestUploadUrl(file);
        await uploadToGcs(file, uploadURL);
        newPaths.push(objectPath);
      } catch (err) {
        errors.push(`${file.name}: ${err instanceof Error ? err.message : "فشل الرفع"}`);
      }
    }

    setUploadingPhotos(false);
    if (newPaths.length > 0) {
      setForm((f) => ({ ...f, images: [...f.images, ...newPaths] }));
      toast({ title: `تم رفع ${newPaths.length} صورة بنجاح` });
    }
    if (errors.length > 0) {
      toast({ title: errors.join("\n"), variant: "destructive" });
    }
    // Reset the input so same files can be re-selected if needed
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  function removePhoto(objectPath: string) {
    setForm((f) => ({ ...f, images: f.images.filter((p) => p !== objectPath) }));
  }

  // ── PDF upload ────────────────────────────────────────────────────────────

  async function handlePdfFile(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.type !== "application/pdf") {
      toast({ title: "يجب أن يكون الملف بصيغة PDF", variant: "destructive" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "حجم الملف أكبر من 20 ميغابايت", variant: "destructive" });
      return;
    }
    setUploadingPdf(true);
    try {
      const { uploadURL, objectPath } = await requestUploadUrl(file);
      await uploadToGcs(file, uploadURL);
      setForm((f) => ({ ...f, menuPdf: objectPath }));
      toast({ title: "تم رفع ملف المنيو بنجاح" });
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "فشل رفع الملف", variant: "destructive" });
    } finally {
      setUploadingPdf(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  }

  // ── Convert to merchant ───────────────────────────────────────────────────

  async function convertToMerchant() {
    if (!id) return;
    if (!window.confirm("هذا الإجراء سيُنشئ حساب تاجر جديداً مرتبطاً بهذه القاعة. هل أنت متأكد؟")) return;
    setConverting(true);
    try {
      const res = await apiFetch(`/api/admin/venues/${id}/convert-to-merchant`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل إنشاء الحساب");
      setMerchantId(data.merchantId);
      setCredentials(data as MerchantCredentials);
      toast({ title: "تم إنشاء حساب التاجر بنجاح" });
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "فشل إنشاء الحساب", variant: "destructive" });
    } finally {
      setConverting(false);
    }
  }

  function copyCredentials() {
    if (!credentials) return;
    navigator.clipboard.writeText(`البريد: ${credentials.email}\nكلمة المرور: ${credentials.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = {
      nameAr: form.nameAr.trim(),
      categorySlug: form.categorySlug,
      district: form.district.trim(),
      address: form.address.trim() || null,
      pricePerNight: form.pricePerNight || "0",
      capacity: Number(form.capacity) || 0,
      capacityMin: form.capacityMin ? Number(form.capacityMin) : null,
      latitude: form.latitude.trim() || null,
      longitude: form.longitude.trim() || null,
      phone: form.phone.trim() || null,
      description: form.description.trim() || null,
      fieldStatus: form.fieldStatus,
      ownerName: form.ownerName.trim() || null,
      ownerPhone: form.ownerPhone.trim() || null,
      privateNotes: form.privateNotes.trim() || null,
      amenities: form.amenities,
      isAvailable: form.isAvailable,
      images: form.images,
      menuPdf: form.menuPdf,
    };
    try {
      const res = await apiFetch(isNew ? "/api/admin/venues" : `/api/admin/venues/${id}`, {
        method: isNew ? "POST" : "PUT",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "فشل الحفظ");
      }
      toast({ title: isNew ? "تمت إضافة القاعة" : "تم حفظ التعديلات" });
      navigate("/venues");
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "فشل الحفظ", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!id) return;
    if (!window.confirm("متأكد من حذف هذه القاعة نهائيًا؟")) return;
    const res = await apiFetch(`/api/admin/venues/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "تم حذف القاعة" });
      navigate("/venues");
    } else {
      toast({ title: "فشل الحذف", variant: "destructive" });
    }
  }

  if (loading) return <p className="text-muted-foreground animate-pulse">جارٍ التحميل...</p>;

  return (
    <form onSubmit={submit} className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{isNew ? "قاعة جديدة" : "تعديل القاعة"}</h1>
        <Button type="button" variant="ghost" className="gap-1" onClick={() => navigate("/venues")}>
          رجوع <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-bold text-primary">بيانات القاعة</h2>
          <div className="space-y-1.5">
            <Label>اسم القاعة *</Label>
            <Input value={form.nameAr} onChange={(e) => set("nameAr", e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>النوع</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={form.categorySlug}
                onChange={(e) => set("categorySlug", e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>الحي *</Label>
              <Input value={form.district} onChange={(e) => set("district", e.target.value)} placeholder="حي الملقا" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>العنوان</Label>
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>السعر / ليلة (ريال)</Label>
              <Input type="number" min="0" value={form.pricePerNight} onChange={(e) => set("pricePerNight", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>السعة القصوى</Label>
              <Input type="number" min="0" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>السعة الدنيا</Label>
              <Input type="number" min="0" value={form.capacityMin} onChange={(e) => set("capacityMin", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>خط العرض (Lat)</Label>
              <Input dir="ltr" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} placeholder="24.7136" />
            </div>
            <div className="space-y-1.5">
              <Label>خط الطول (Lng)</Label>
              <Input dir="ltr" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} placeholder="46.6753" />
            </div>
          </div>
          <LocationPicker
            latitude={form.latitude}
            longitude={form.longitude}
            onChange={(lat, lng) => setForm((f) => ({ ...f, latitude: lat, longitude: lng }))}
          />
          <div className="space-y-1.5">
            <Label>هاتف القاعة</Label>
            <Input dir="ltr" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>وصف</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>المرافق</Label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((a) => {
                const on = form.amenities.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() =>
                      set("amenities", on ? form.amenities.filter((x) => x !== a) : [...form.amenities, a])
                    }
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${
                      on ? "bg-primary text-primary-foreground border-primary" : "border-input text-muted-foreground"
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(e) => set("isAvailable", e.target.checked)}
            />
            ظاهرة للعملاء في التطبيق (متاحة للحجز)
          </label>
        </CardContent>
      </Card>

      {/* ── Photos ─────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-bold text-primary">صور القاعة</h2>

          {/* Existing photo thumbnails */}
          {form.images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {form.images.map((objectPath, i) => (
                <div key={objectPath} className="relative aspect-video rounded-md overflow-hidden border border-input group">
                  <img
                    src={objectUrl(objectPath)}
                    alt={`صورة ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(objectPath)}
                    className="absolute top-1 left-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    title="حذف الصورة"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload button */}
          <div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handlePhotoFiles(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={uploadingPhotos}
              onClick={() => photoInputRef.current?.click()}
            >
              <ImagePlus className="w-4 h-4" />
              {uploadingPhotos ? "جارٍ الرفع..." : "إضافة صور"}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              يمكن رفع عدة صور (PNG, JPG, WebP) — الحد الأقصى 10 ميغابايت للصورة
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Menu PDF ───────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-bold text-primary">ملف المنيو (اختياري)</h2>

          {form.menuPdf ? (
            <div className="flex items-center gap-3 p-3 rounded-md border border-input bg-muted/30">
              <FileText className="w-5 h-5 text-primary shrink-0" />
              <a
                href={objectUrl(form.menuPdf)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary underline truncate flex-1"
              >
                عرض ملف المنيو الحالي
              </a>
              <button
                type="button"
                onClick={() => set("menuPdf", null)}
                className="text-destructive hover:opacity-70 transition shrink-0"
                title="حذف الملف"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handlePdfFile(e.target.files)}
              />
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={uploadingPdf}
                onClick={() => pdfInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" />
                {uploadingPdf ? "جارٍ الرفع..." : "رفع ملف PDF"}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                ملف PDF للمنيو — الحد الأقصى 20 ميغابايت
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h2 className="font-bold text-primary">العمل الميداني (خاص بالفريق)</h2>
          <div className="space-y-1.5">
            <Label>حالة المتابعة</Label>
            <select
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={form.fieldStatus}
              onChange={(e) => set("fieldStatus", e.target.value)}
            >
              {FIELD_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>اسم المالك</Label>
              <Input value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>جوال المالك</Label>
              <Input dir="ltr" value={form.ownerPhone} onChange={(e) => set("ownerPhone", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>ملاحظات خاصة</Label>
            <Textarea rows={4} value={form.privateNotes} onChange={(e) => set("privateNotes", e.target.value)} placeholder="نتيجة الزيارة، شروط المالك، ملاحظات التفاوض..." />
          </div>
        </CardContent>
      </Card>

      {/* ── Convert to merchant ────────────────────────────────────────── */}
      {!isNew && (form.fieldStatus === "agreement_signed" || form.fieldStatus === "live") && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <h2 className="font-bold text-primary">حساب التاجر</h2>

            {merchantId ? (
              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                <UserCheck className="w-4 h-4 shrink-0" />
                <span>القاعة مرتبطة بحساب تاجر (#{merchantId})</span>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  أنشئ حساب دخول لبوابة التاجر باستخدام بيانات المالك المُدخلة أعلاه.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 border-violet-400 text-violet-700 hover:bg-violet-50"
                  disabled={converting}
                  onClick={convertToMerchant}
                >
                  <UserCheck className="w-4 h-4" />
                  {converting ? "جارٍ الإنشاء..." : "تحويل إلى حساب تاجر"}
                </Button>
              </>
            )}

            {credentials && (
              <div className="rounded-md border border-violet-200 bg-violet-50 p-4 space-y-3">
                <p className="text-sm font-semibold text-violet-800">
                  بيانات الدخول — احفظها الآن، لن تظهر مجدداً
                </p>
                <div className="space-y-1 font-mono text-sm text-violet-900 bg-white rounded px-3 py-2 border border-violet-100">
                  <div><span className="text-muted-foreground">البريد:&nbsp;</span>{credentials.email}</div>
                  <div><span className="text-muted-foreground">كلمة المرور:&nbsp;</span>{credentials.password}</div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={copyCredentials}
                >
                  {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "تم النسخ" : "نسخ بيانات الدخول"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={busy || uploadingPhotos || uploadingPdf} className="flex-1">
          {busy ? "جارٍ الحفظ..." : isNew ? "إضافة القاعة" : "حفظ التعديلات"}
        </Button>
        {!isNew && (
          <Button type="button" variant="destructive" size="icon" onClick={remove}>
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
