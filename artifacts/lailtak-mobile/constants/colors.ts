/**
 * Semantic design tokens for the ليلتك customer mobile app.
 *
 * Synced from the sibling web artifact (artifacts/lailtak/src/index.css):
 * luxurious gold + deep emerald green palette on a warm cream background.
 * HSL values converted to hex. Radius 16.
 */

const colors = {
  light: {
    // Legacy aliases
    text: "#093422",
    tint: "#E2AF36",

    // Core surfaces
    background: "#FBF9F4",
    foreground: "#093422",

    // Cards / elevated surfaces
    card: "#FFFFFF",
    cardForeground: "#093422",

    // Primary: deep emerald green
    primary: "#0E4E33",
    primaryForeground: "#FBF9F4",

    // Secondary / soft warm surfaces
    secondary: "#F3EEE2",
    secondaryForeground: "#0E4E33",

    // Muted
    muted: "#F0EADD",
    mutedForeground: "#857F70",

    // Accent: royal gold
    accent: "#E2AF36",
    accentForeground: "#093422",

    // Destructive
    destructive: "#B3261E",
    destructiveForeground: "#FFFFFF",

    // Borders and inputs
    border: "#E7E0D2",
    input: "#E7E0D2",
  },

  dark: {
    text: "#F5EFE0",
    tint: "#D6B85C",

    background: "#0D1526",
    foreground: "#F5EFE0",

    card: "#14203A",
    cardForeground: "#F5EFE0",

    primary: "#D6B85C",
    primaryForeground: "#0D1526",

    secondary: "#1B2842",
    secondaryForeground: "#F5EFE0",

    muted: "#1B2842",
    mutedForeground: "#9AA3B5",

    accent: "#D6B85C",
    accentForeground: "#0D1526",

    destructive: "#E5645B",
    destructiveForeground: "#FFFFFF",

    border: "#24314F",
    input: "#24314F",
  },

  radius: 16,
};

export default colors;
