import type { TextProps as RNTextProps, TextStyle } from 'react-native';
import { Text as RNText } from 'react-native';

import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

type Variant =
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'label'
  | 'overline'
  | 'metric'
  | 'metricMd'
  | 'metricSm';
type Tone = 'default' | 'secondary' | 'tertiary' | 'accent' | 'error' | 'score';

type Props = RNTextProps & {
  variant?: Variant;
  tone?: Tone;
};

export function Text({ variant = 'body', tone = 'default', style, ...props }: Props) {
  const colorScheme = useColorScheme();
  const { colors, typography } = getTheme(colorScheme);

  const toneStyle: TextStyle =
    tone === 'secondary'
      ? { color: colors.textSecondary }
      : tone === 'tertiary'
        ? { color: colors.textTertiary }
        : tone === 'accent'
          ? { color: colors.accent }
          : tone === 'error'
            ? { color: colors.error }
            : tone === 'score'
              ? { color: colors.score }
              : { color: colors.text };

  return <RNText style={[typography[variant], toneStyle, style]} {...props} />;
}
