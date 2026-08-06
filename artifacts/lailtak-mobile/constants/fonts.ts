/**
 * Font families for the ليلتك app.
 * - Amiri: classical Arabic calligraphy, used for display / headings.
 * - Cairo: clean modern Arabic sans, used for body and UI.
 */
export const Fonts = {
  display: "Amiri_700Bold",
  displayRegular: "Amiri_400Regular",
  bold: "Cairo_700Bold",
  semibold: "Cairo_600SemiBold",
  regular: "Cairo_400Regular",
} as const;

export type FontVariant = keyof typeof Fonts;
