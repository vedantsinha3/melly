import { StyleSheet, View } from 'react-native';

import { Artwork, Button, Card, Text } from '@/components/ui';
import { useColorScheme } from '@/components/useColorScheme';
import { getTheme } from '@/constants/theme';
import { getExploringProgressCopy, type AlbumSummary } from '@/lib/albums';

import { AlbumProgressBar } from './AlbumProgressBar';

type Props = {
  album: AlbumSummary;
  onRankNext: () => void;
};

export function ContinueAlbumCard({ album, onRankNext }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius } = getTheme(colorScheme);
  const progressCopy = getExploringProgressCopy(album);

  return (
    <Card
      elevated
      style={{
        padding: spacing.lg,
        gap: spacing.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.accentMuted,
      }}>
        <Text variant="overline" tone="accent">
          Continue your album
        </Text>

        <View style={[styles.row, { gap: spacing.md }]}>
          <Artwork uri={album.artworkUrl} size="lg" borderRadius="md" />
          <View style={[styles.copy, { gap: spacing.xs }]}>
            <Text variant="title" numberOfLines={2}>
              {album.title}
            </Text>
            <Text variant="bodySmall" tone="secondary" numberOfLines={1}>
              {album.artist}
            </Text>
            <Text variant="bodySmall" tone="secondary">
              {progressCopy}
            </Text>
          </View>
        </View>

        {album.completionPct != null ? (
          <AlbumProgressBar
            completionPct={album.completionPct}
            isComplete={false}
            showLabel
            height={8}
            animated
          />
        ) : null}

        <Button title="Rank next song →" onPress={onRankNext} />
      </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
});
