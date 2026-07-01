import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { ArtworkPreviewStack } from '@/components/onboarding/ArtworkPreviewStack';
import { Button, Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import type { ImportPathConfig } from '@/lib/onboarding';

type Props = {
  config: ImportPathConfig;
  artworkUrls: string[];
  selected?: boolean;
  loading?: boolean;
  songCount?: number | null;
  rankingMinutes?: string | null;
  onSelect: () => void;
};

export function ImportPathCard({
  config,
  artworkUrls,
  selected,
  loading,
  songCount,
  rankingMinutes,
  onSelect,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius, elevation } = getTheme(colorScheme);

  const songsLabel =
    songCount != null ? `${songCount} song${songCount === 1 ? '' : 's'} ready` : config.estimatedSongsLabel;
  const timeLabel = rankingMinutes ?? config.estimatedMinutesLabel;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          borderWidth: selected ? 2 : 1,
          borderColor: selected ? colors.accent : colors.border,
          padding: spacing.lg,
          gap: spacing.md,
          opacity: loading ? 0.85 : 1,
          ...(selected ? elevation.card : elevation.subtle),
        },
      ]}>
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          {config.recommended ? (
            <View style={[styles.badge, { backgroundColor: colors.accentSoft, borderRadius: radius.pill }]}>
              <Text variant="overline" tone="accent">
                Recommended
              </Text>
            </View>
          ) : null}
          <Text variant="title" style={styles.title}>
            {config.title}
          </Text>
          <Text variant="caption" tone="tertiary">
            {config.period}
          </Text>
        </View>
        <ArtworkPreviewStack urls={artworkUrls} size={40} />
      </View>

      <Text variant="bodySmall" tone="secondary">
        {config.description}
      </Text>

      <View style={[styles.statsRow, { gap: spacing.sm }]}>
        <View style={[styles.stat, { backgroundColor: colors.surfaceMuted, borderRadius: radius.md }]}>
          <SymbolView
            name={{ ios: 'music.note.list', android: 'queue_music', web: 'queue_music' }}
            tintColor={colors.accent}
            size={14}
          />
          <Text variant="caption" style={styles.statText}>
            {songsLabel}
          </Text>
        </View>
        <View style={[styles.stat, { backgroundColor: colors.surfaceMuted, borderRadius: radius.md }]}>
          <SymbolView
            name={{ ios: 'clock.fill', android: 'schedule', web: 'schedule' }}
            tintColor={colors.accent}
            size={14}
          />
          <Text variant="caption" style={styles.statText}>
            {timeLabel}
          </Text>
        </View>
      </View>

      <Button
        title={
          loading
            ? 'Loading your songs…'
            : selected && songCount != null && songCount > 0
              ? 'Start ranking'
              : 'Rank these songs'
        }
        onPress={onSelect}
        loading={loading}
        variant={config.recommended ? 'primary' : 'secondary'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 260,
    borderCurve: 'continuous',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statText: {
    fontWeight: '500',
  },
});
