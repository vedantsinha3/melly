import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Artwork, Button, Pill, Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { formatRankedDate } from '@/lib/librarySearch';

type Props = {
  artworkUrl: string | null;
  title: string;
  artist: string;
  album?: string | null;
  variant: 'ranked' | 'unranked' | 'already-ranked';
  rankPosition?: number;
  score?: number;
  rankedAt?: string;
  actionLabel: string;
  onPress: () => void;
  loading?: boolean;
  selected?: boolean;
};

export function LibrarySearchRow({
  artworkUrl,
  title,
  artist,
  album,
  variant,
  rankPosition,
  score,
  rankedAt,
  actionLabel,
  onPress,
  loading,
  selected,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius, motion } = getTheme(colorScheme);

  const subtitle = [artist, album].filter(Boolean).join(' · ');

  const metaLine =
    variant === 'ranked' && rankPosition != null && score != null
      ? `#${rankPosition} overall · ${score.toFixed(1)}${rankedAt ? ` · ${formatRankedDate(rankedAt)}` : ''}`
      : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={`${title} — ${actionLabel}`}
      {...(Platform.OS === 'web'
        ? {
            onMouseDown: (event: { preventDefault?: () => void }) => {
              event.preventDefault?.();
            },
          }
        : null)}
      style={({ pressed, hovered }) => [
        styles.row,
        {
          backgroundColor: selected ? colors.accentSoft : colors.surface,
          borderColor: selected ? colors.accent : colors.border,
          borderRadius: radius.lg,
          padding: spacing.sm,
          gap: spacing.sm + 2,
          opacity: pressed ? 0.92 : 1,
          ...(Platform.OS === 'web' && hovered && !selected
            ? { borderColor: colors.accentMuted, backgroundColor: colors.surfaceHover }
            : null),
          transitionDuration: `${motion.fast}ms`,
        },
      ]}>
      {variant === 'ranked' && rankPosition != null ? (
        <Pill variant="rank" label={`#${rankPosition}`} />
      ) : null}

      <Artwork uri={artworkUrl} size="xs" borderRadius="sm" />

      <View style={[styles.copy, { gap: spacing['2xs'] }]}>
        <Text variant="label" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="caption" tone="secondary" numberOfLines={1}>
          {subtitle}
        </Text>
        {metaLine ? (
          <Text variant="caption" tone="tertiary" numberOfLines={1}>
            {metaLine}
          </Text>
        ) : null}
        {variant === 'already-ranked' ? (
          <Text variant="caption" tone="accent">
            Already ranked
          </Text>
        ) : null}
      </View>

      {variant === 'ranked' && score != null ? (
        <Pill variant="score" label={score.toFixed(1)} />
      ) : null}

      <View pointerEvents="none" style={styles.action}>
        <Button
          title={actionLabel}
          size="sm"
          variant={variant === 'unranked' ? 'primary' : 'secondary'}
          loading={loading}
          onPress={onPress}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  action: {
    flexShrink: 0,
  },
});
