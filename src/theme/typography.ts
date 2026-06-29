import type { TextStyle } from 'react-native';

export type TextVariant =
  | 'display'
  | 'headline'
  | 'headlineMobile'
  | 'title'
  | 'bodyLarge'
  | 'body'
  | 'label'
  | 'labelSmall';

export const typography: Record<TextVariant, TextStyle> = {
  display: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '700',
  },
  headline: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '600',
  },
  headlineMobile: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '500',
  },
  bodyLarge: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
    fontWeight: '500',
  },
  labelSmall: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
};
