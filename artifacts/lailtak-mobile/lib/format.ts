import type { Category } from "@workspace/api-client-react";

export function formatPrice(value: number): string {
  return Number(value).toLocaleString("en-US");
}

export function formatDateAr(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return value;
  }
}

export function categoryName(
  slug: string | undefined,
  categories: Category[] | undefined,
): string {
  if (!slug) return "";
  return categories?.find((c) => c.slug === slug)?.nameAr ?? slug;
}

const STATUS_AR: Record<string, string> = {
  pending: "بانتظار التأكيد",
  confirmed: "مؤكد",
  cancelled: "ملغي",
  completed: "منتهٍ",
};

export function bookingStatusAr(status: string): string {
  return STATUS_AR[status] ?? status;
}

export function publicInviteUrl(token: string): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return `https://${domain}/i/${token}`;
}
