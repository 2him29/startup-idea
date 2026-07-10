export const colors = {
  red: "#E5484D",
  redSoft: "#FFECEC",
  redGradientEnd: "#F4677E",
  teal: "#0E8BA8",
  tealSoft: "#E4F6FB",
  tealGradientEnd: "#23A6C4",
  green: "#12B76A",
  orange: "#F5871F",
  orangeSoft: "#FFF3E0",

  textPrimary: "#0B2432",
  textSecondary: "#5A6B75",
  textTertiary: "#6B7C88",
  textMuted: "#8496A0",
  textFaint: "#9AA9B2",
  textDisabled: "#C0CCD2",

  border: "rgba(11,36,50,0.06)",
  borderStrong: "rgba(11,36,50,0.1)",
  borderStronger: "rgba(11,36,50,0.12)",

  bgTop: "#FFF7F6",
  bgMid: "#F6FBFC",
  bgBottom: "#FFFFFF",
} as const;

export const gradients = {
  donorHero: `linear-gradient(135deg,${colors.red} 0%, ${colors.redGradientEnd} 100%)`,
  hospitalHero: `linear-gradient(135deg,${colors.teal} 0%, ${colors.tealGradientEnd} 100%)`,
  screenBg: `linear-gradient(180deg,${colors.bgTop} 0%, ${colors.bgMid} 58%, ${colors.bgBottom} 100%)`,
} as const;
