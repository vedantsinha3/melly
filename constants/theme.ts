import type { ColorSchemeName, TextStyle, ViewStyle } from 'react-native';

export const Colors = {
  light: {
    text: '#0A0A0B',
    textSecondary: '#5C6370',
    textTertiary: '#9AA1AD',
    background: '#F6F7F9',
    surface: '#FFFFFF',
    surfaceMuted: '#F1F2F5',
    surfaceInset: '#ECEEF2',
    surfaceHover: '#E8EAEE',
    tint: '#169C46',
    accent: '#169C46',
    accentSoft: '#E4F7EC',
    accentMuted: '#D2F0DF',
    border: 'rgba(10, 10, 11, 0.06)',
    separator: 'rgba(10, 10, 11, 0.05)',
    overlay: 'rgba(10, 10, 11, 0.16)',
    error: '#DC2626',
    score: '#169C46',
    scoreBandHigh: '#15803D',
    scoreBandMid: '#B8860B',
    scoreBandLow: '#C2413C',
    shadow: 'rgba(10, 10, 11, 0.04)',
    shadowStrong: 'rgba(10, 10, 11, 0.08)',
  },
  dark: {
    text: '#F4F5F7',
    textSecondary: '#A1A8B3',
    textTertiary: '#6B7280',
    background: '#0C0D0F',
    surface: '#15171B',
    surfaceMuted: '#1C1F24',
    surfaceInset: '#23262C',
    surfaceHover: '#2A2E35',
    tint: '#22C55E',
    accent: '#22C55E',
    accentSoft: '#132E1F',
    accentMuted: '#1A3D28',
    border: 'rgba(255, 255, 255, 0.06)',
    separator: 'rgba(255, 255, 255, 0.05)',
    overlay: 'rgba(0, 0, 0, 0.4)',
    error: '#F87171',
    score: '#4ADE80',
    scoreBandHigh: '#4ADE80',
    scoreBandMid: '#FACC15',
    scoreBandLow: '#F87171',
    shadow: 'rgba(0, 0, 0, 0.18)',
    shadowStrong: 'rgba(0, 0, 0, 0.28)',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  '3xl': 36,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '600', letterSpacing: -0.4 } as TextStyle,
  title: { fontSize: 22, lineHeight: 28, fontWeight: '600', letterSpacing: -0.25 } as TextStyle,
  heading: { fontSize: 15, lineHeight: 20, fontWeight: '500', letterSpacing: -0.1 } as TextStyle,
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400' } as TextStyle,
  bodySmall: { fontSize: 13, lineHeight: 18, fontWeight: '400' } as TextStyle,
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' } as TextStyle,
  label: { fontSize: 13, lineHeight: 18, fontWeight: '500' } as TextStyle,
  overline: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '500',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  } as TextStyle,
  metric: { fontSize: 28, lineHeight: 32, fontWeight: '600', letterSpacing: -0.6 } as TextStyle,
  metricMd: { fontSize: 22, lineHeight: 26, fontWeight: '600', letterSpacing: -0.4 } as TextStyle,
  metricSm: { fontSize: 18, lineHeight: 22, fontWeight: '600', letterSpacing: -0.2 } as TextStyle,
} as const;

export const motion = {
  fast: 150,
  normal: 200,
  slow: 250,
} as const;

export const elevation = {
  none: {} as ViewStyle,
  subtle: {
    boxShadow: `0 1px 2px ${Colors.light.shadow}`,
    elevation: 1,
  } as ViewStyle,
  card: {
    boxShadow: `0 1px 3px ${Colors.light.shadow}, 0 6px 20px ${Colors.light.shadow}`,
    elevation: 2,
  } as ViewStyle,
  raised: {
    boxShadow: `0 2px 6px ${Colors.light.shadowStrong}, 0 10px 28px ${Colors.light.shadow}`,
    elevation: 3,
  } as ViewStyle,
} as const;

export const layout = {
  screenPadding: spacing.lg,
  maxContentWidth: 1200,
  compactContentWidth: 460,
  sidebarWidth: 240,
  breakpointWide: 900,
  breakpointDesktop: 1200,
} as const;

export function getTheme(colorScheme?: ColorSchemeName | null) {
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[scheme];

  return {
    scheme,
    colors,
    spacing,
    radius,
    typography,
    layout,
    motion,
    elevation: {
      none: elevation.none,
      subtle: {
        boxShadow: `0 1px 2px ${colors.shadow}`,
        elevation: 1,
      } as ViewStyle,
      card: {
        boxShadow: `0 1px 3px ${colors.shadow}, 0 6px 20px ${colors.shadow}`,
        elevation: 2,
      } as ViewStyle,
      raised: {
        boxShadow: `0 2px 6px ${colors.shadowStrong}, 0 10px 28px ${colors.shadow}`,
        elevation: 3,
      } as ViewStyle,
    },
  } as const;
}
