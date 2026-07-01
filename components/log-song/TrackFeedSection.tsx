import { ScrollView, StyleSheet, View } from 'react-native';

import { TrackFeedCard } from '@/components/log-song/TrackFeedCard';
import { Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import type { FeedSection } from '@/lib/logSongFeed';

type Props = {
  section: FeedSection;
  loggingId: string | null;
  highlightId?: string | null;
  onRank: (trackId: string) => void;
};

export function TrackFeedSection({ section, loggingId, highlightId, onRank }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { spacing } = getTheme(colorScheme);

  if (section.tracks.length === 0) return null;

  return (
    <View style={[styles.wrap, { gap: spacing.sm }]}>
      <View style={styles.header}>
        <Text variant="heading">{section.title}</Text>
        <Text variant="caption" tone="tertiary">
          {section.subtitle}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.rail, { gap: spacing.md, paddingRight: spacing.lg }]}>
        {section.tracks.map((item) => (
          <TrackFeedCard
            key={`${section.id}-${item.track.id}`}
            track={item.track}
            meta={item.meta}
            highlighted={highlightId === item.track.id}
            loading={loggingId === item.track.id}
            onPress={() => onRank(item.track.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  header: {
    gap: 2,
    paddingHorizontal: 0,
  },
  rail: {
    paddingVertical: 2,
  },
});
