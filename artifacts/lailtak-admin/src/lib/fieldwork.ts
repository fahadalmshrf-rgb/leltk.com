export const FIELD_STATUSES = [
  { value: "not_visited", label: "لم تُزر بعد", color: "bg-gray-500" },
  { value: "visited", label: "تمت الزيارة", color: "bg-blue-500" },
  { value: "owner_contacted", label: "تم التواصل مع المالك", color: "bg-amber-500" },
  { value: "agreement_signed", label: "تم توقيع الاتفاقية", color: "bg-violet-500" },
  { value: "live", label: "منشورة", color: "bg-emerald-600" },
] as const;

export type FieldStatus = (typeof FIELD_STATUSES)[number]["value"];

export function statusInfo(value: string) {
  return FIELD_STATUSES.find((s) => s.value === value) ?? FIELD_STATUSES[0];
}

export const CATEGORIES = [
  { slug: "wedding-hall", label: "قاعة أفراح" },
  { slug: "banquet-hall", label: "صالة أفراح" },
  { slug: "chalet", label: "شاليه" },
  { slug: "party-hall", label: "قاعة حفلات" },
  { slug: "hotel", label: "فندقية" },
];

export type AdminVenue = {
  id: number;
  nameAr: string;
  categorySlug: string;
  pricePerNight: string;
  capacity: number;
  capacityMin: number | null;
  district: string;
  address: string | null;
  phone: string | null;
  latitude: string | null;
  longitude: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  amenities: string[];
  services: string[];
  images: string[];
  description: string | null;
  fieldStatus: string;
  ownerName: string | null;
  ownerPhone: string | null;
  privateNotes: string | null;
  merchantId: number | null;
  rating: string;
  reviewCount: number;
  createdAt: string;
};
