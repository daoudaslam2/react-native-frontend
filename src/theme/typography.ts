import type { TextStyle } from 'react-native';

export const fontFamilies = {
  medium: 'Kanyon-Medium',
  bold: 'Kanyon-Bold',
} as const;

export type TextVariant =
  | 'display'
  | 'headline'
  | 'headlineMobile'
  | 'title'
  | 'bodyLarge'
  | 'body'
  | 'label'
  | 'labelSmall';

export function fontFamilyForWeight(
  weight?: TextStyle['fontWeight'],
): (typeof fontFamilies)[keyof typeof fontFamilies] {
  if (weight === 'bold') {
    return fontFamilies.bold;
  }

  const numericWeight = Number(weight);

  return numericWeight >= 600 ? fontFamilies.bold : fontFamilies.medium;
}

export const typography: Record<TextVariant, TextStyle> = {
  display: {
    fontFamily: fontFamilies.bold,
    fontSize: 48,
    lineHeight: 56,
  },
  headline: {
    fontFamily: fontFamilies.bold,
    fontSize: 32,
    lineHeight: 40,
  },
  headlineMobile: {
    fontFamily: fontFamilies.bold,
    fontSize: 28,
    lineHeight: 36,
  },
  title: {
    fontFamily: fontFamilies.medium,
    fontSize: 22,
    lineHeight: 28,
  },
  bodyLarge: {
    fontFamily: fontFamilies.medium,
    fontSize: 18,
    lineHeight: 28,
  },
  body: {
    fontFamily: fontFamilies.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  label: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelSmall: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
};
