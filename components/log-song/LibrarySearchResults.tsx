import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import type { LibrarySearchViewModel } from '@/lib/librarySearch';
import type { SpotifySearchTrack } from '@/types';

import { LibrarySearchRow } from './LibrarySearchRow';
import { LibrarySearchSkeleton } from './LibrarySearchSkeleton';

type Props = {
  model: LibrarySearchViewModel;
  loading: boolean;
  query: string;
  selectedIndex: number;
  loggingId: string | null;
  onViewRanked: (ratingId: string) => void;
  onRankSpotify: (track: SpotifySearchTrack) => void;
};

function getFlatIndex(model: LibrarySearchViewModel, section: 'ranked' | 'spotify', index: number): number {
  if (section === 'ranked') return index;
  return model.ranked.length + index;
}

export function LibrarySearchResults({
  model,
  loading,
  query,
  selectedIndex,
  loggingId,
  onViewRanked,
  onRankSpotify,
}: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { spacing } = getTheme(colorScheme);
  const hasRanked = model.ranked.length > 0;
  const hasSpotify = model.spotify.length > 0;

  if (loading) {
    return (
      <View style={{ gap: spacing.md }}>
        <Text variant="heading">Searching your library…</Text>
        <LibrarySearchSkeleton />
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.lg }}>
      {hasRanked ? (
        <View style={{ gap: spacing.sm }}>
          <View style={styles.sectionHeader}>
            <Text variant="heading">Ranked in your library</Text>
            <Text variant="caption" tone="tertiary">
              {model.ranked.length} {model.ranked.length === 1 ? 'match' : 'matches'}
            </Text>
          </View>
          {model.ranked.map((match, index) => (
            <LibrarySearchRow
              key={match.rating.id}
              artworkUrl={match.rating.track.album_art_url}
              title={match.rating.track.name}
              artist={match.rating.track.artist_names.join(', ')}
              album={match.rating.track.album_name}
              variant="ranked"
              rankPosition={match.rating.rank_position}
              score={Number(match.rating.score)}
              rankedAt={match.rating.created_at ?? match.rating.listened_at}
              actionLabel="View details"
              selected={selectedIndex === getFlatIndex(model, 'ranked', index)}
              onPress={() => onViewRanked(match.rating.id)}
            />
          ))}
        </View>
      ) : (
        <Text variant="bodySmall" tone="secondary">
          Not in your ranked library yet.
        </Text>
      )}

      <View style={{ gap: spacing.sm }}>
        <View style={styles.sectionHeader}>
          <Text variant="heading">From Spotify</Text>
          {hasSpotify ? (
            <Text variant="caption" tone="tertiary">
              {model.spotify.length} {model.spotify.length === 1 ? 'result' : 'results'}
            </Text>
          ) : null}
        </View>

        {!hasSpotify ? (
          <Text variant="bodySmall" tone="secondary">
            {query.trim() ? 'No tracks found.' : 'Try another search.'}
          </Text>
        ) : (
          model.spotify.map((match, index) => {
            const flatIndex = getFlatIndex(model, 'spotify', index);
            const isRanked = match.alreadyRanked && match.matchedRating;
            const handlePress = () => {
              if (isRanked && match.matchedRating) {
                onViewRanked(match.matchedRating.id);
                return;
              }
              onRankSpotify(match.track);
            };

            return (
              <LibrarySearchRow
                key={`${match.track.id}-${index}`}
                artworkUrl={match.track.album.images[0]?.url ?? null}
                title={match.track.name}
                artist={match.track.artists.map((artist) => artist.name).join(', ')}
                album={match.track.album.name}
                variant={isRanked ? 'already-ranked' : 'unranked'}
                rankPosition={match.matchedRating?.rank_position}
                score={match.matchedRating ? Number(match.matchedRating.score) : undefined}
                actionLabel={isRanked ? 'View details' : 'Rank this song'}
                loading={loggingId === match.track.id}
                selected={selectedIndex === flatIndex}
                onPress={handlePress}
              />
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
});
