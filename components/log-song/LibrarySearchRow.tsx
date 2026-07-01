import { Image } from 'expo-image';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
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

  const actionVariant = variant === 'unranked' ? 'primary' : 'secondary';

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={`${title} — ${actionLabel}`}
      style={({ pressed, hovered }) => [
        styles.row,
        {
          backgroundColor: selected ? colors.accentSoft : colors.surface,
          borderColor: selected ? colors.accent : colors.border,
          borderRadius: radius.lg,
          padding: spacing.sm,
          opacity: pressed ? 0.92 : 1,
          ...(Platform.OS === 'web' && hovered && !selected
            ? { borderColor: colors.accentMuted, backgroundColor: colors.surfaceHover }
            : null),
          transitionDuration: `${motion.fast}ms`,
        },
      ]}>
      {variant === 'ranked' && rankPosition != null ? (
        <View style={[styles.rankBadge, { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill }]}>
          <Text variant="caption" style={styles.rankText}>
            #{rankPosition}
          </Text>
        </View>
      ) : null}

      <Image
        source={{ uri: artworkUrl ?? undefined }}
        style={[styles.artwork, { borderRadius: radius.sm }]}
        contentFit="cover"
      />

      <View style={styles.copy}>
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
        <View style={[styles.scorePill, { backgroundColor: colors.accentSoft, borderRadius: radius.pill }]}>
          <Text variant="label" tone="score">
            {score.toFixed(1)}
          </Text>
        </View>
      ) : null}

      <View
        style={[
          styles.action,
          actionVariant === 'primary'
            ? { backgroundColor: colors.accent, borderRadius: radius.md }
            : { backgroundColor: colors.surfaceMuted, borderRadius: radius.md },
        ]}>
        {loading ? (
          <ActivityIndicator color={actionVariant === 'primary' ? '#fff' : colors.accent} size="small" />
        ) : (
          <Text
            variant="label"
            style={actionVariant === 'primary' ? styles.actionPrimary : styles.actionSecondary}>
            {actionLabel}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
  },
  rankBadge: {
    minWidth: 34,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  rankText: {
    fontWeight: '700',
    fontSize: 11,
  },
  artwork: {
    width: 48,
    height: 48,
    backgroundColor: '#1a1a1a',
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  scorePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 44,
    alignItems: 'center',
  },
  action: {
    minWidth: 108,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPrimary: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  actionSecondary: {
    fontSize: 12,
  },
});
