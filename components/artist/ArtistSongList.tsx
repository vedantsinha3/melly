import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import type { ArtistSongRow, ArtistSortMode } from '@/lib/artistDetail';

type Props = {
  songs: ArtistSongRow[];
  sortMode: ArtistSortMode;
  onSortChange: (mode: ArtistSortMode) => void;
  onSongPress: (ratingId: string) => void;
};

const SORT_OPTIONS: { value: ArtistSortMode; label: string }[] = [
  { value: 'highest', label: 'Highest rated' },
  { value: 'lowest', label: 'Lowest rated' },
  { value: 'recent', label: 'Recently ranked' },
  { value: 'rank', label: 'Ranking order' },
];

export function ArtistSongList({ songs, sortMode, onSortChange, onSongPress }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius, motion } = getTheme(colorScheme);

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={styles.header}>
        <Text variant="heading">Ranked songs</Text>
        <Text variant="caption" tone="tertiary">
          {songs.length} in your library
        </Text>
      </View>

      <View style={[styles.sortRow, { gap: spacing.xs }]}>
        {SORT_OPTIONS.map((option) => {
          const active = sortMode === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onSortChange(option.value)}
              style={({ pressed, hovered }) => [
                styles.sortChip,
                {
                  backgroundColor: active ? colors.accentSoft : colors.surfaceMuted,
                  borderRadius: radius.pill,
                  borderColor: active ? colors.accent : 'transparent',
                  opacity: pressed ? 0.85 : 1,
                  ...(Platform.OS === 'web' && hovered && !active
                    ? { backgroundColor: colors.surfaceHover }
                    : null),
                  transitionDuration: `${motion.fast}ms`,
                },
              ]}>
              <Text variant="caption" tone={active ? 'accent' : 'secondary'} style={styles.sortLabel}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: spacing.sm }}>
        {songs.map((song) => (
          <Pressable
            key={song.ratingId}
            onPress={() => onSongPress(song.ratingId)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${song.trackName} details`}
            style={({ pressed, hovered }) => [
              styles.row,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                borderColor: colors.border,
                padding: spacing.md,
                opacity: pressed ? 0.9 : 1,
                ...(Platform.OS === 'web' && hovered
                  ? {
                      borderColor: colors.accentMuted,
                      transform: [{ translateY: -1 }],
                      boxShadow: `0 6px 18px ${colors.shadow}`,
                    }
                  : null),
                transitionDuration: `${motion.normal}ms`,
              },
            ]}>
            <Image
              source={{ uri: song.artworkUrl ?? undefined }}
              style={[styles.artwork, { borderRadius: radius.md }]}
              contentFit="cover"
            />
            <View style={styles.main}>
              <View style={styles.titleRow}>
                <Text variant="label" numberOfLines={1} style={styles.title}>
                  {song.trackName}
                </Text>
                {song.hasNotes ? (
                  <SymbolView
                    name={{ ios: 'note.text', android: 'description', web: 'description' }}
                    tintColor={colors.textTertiary}
                    size={13}
                  />
                ) : null}
              </View>
              {song.albumName ? (
                <Text variant="caption" tone="tertiary" numberOfLines={1}>
                  {song.albumName}
                </Text>
              ) : null}
              <Text variant="caption" tone="secondary" numberOfLines={1}>
                {song.artistName}
              </Text>
              <Text variant="caption" tone="tertiary">
                Ranked{' '}
                {new Date(song.rankedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.neighborhood}>
              <Text variant="caption" tone="tertiary" style={styles.rankOverall}>
                #{song.rankPosition} overall
              </Text>
              <View style={[styles.scorePill, { backgroundColor: colors.accentSoft, borderRadius: radius.pill }]}>
                <Text variant="label" tone="score">
                  {song.score.toFixed(1)}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  sortLabel: {
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
  },
  artwork: {
    width: 52,
    height: 52,
    backgroundColor: '#1a1a1a',
  },
  main: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    flex: 1,
  },
  neighborhood: {
    alignItems: 'flex-end',
    gap: 6,
  },
  rankOverall: {
    fontWeight: '500',
  },
  scorePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 44,
    alignItems: 'center',
  },
});
