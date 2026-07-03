import { Pressable, StyleSheet, View } from 'react-native';

import { Artwork, Button, Text } from '@/components/ui';
import { useColorScheme } from '@/components/useColorScheme';
import { getTheme } from '@/constants/theme';
import { getExploringProgressCopy, type AlbumSummary } from '@/lib/albums';

import { AlbumProgressBar } from './AlbumProgressBar';

type Props = {
  album: AlbumSummary;
  onPress: () => void;
  onContinue?: () => void;
};

export function ExploringAlbumCard({ album, onPress, onContinue }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius } = getTheme(colorScheme);
  const progressCopy = getExploringProgressCopy(album);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.md,
        },
      ]}>
      <Pressable onPress={onPress} style={[styles.main, { gap: spacing.md }]}>
        <Artwork uri={album.artworkUrl} size="md" borderRadius="md" />

        <View style={[styles.body, { gap: spacing.xs }]}>
          <Text variant="label" numberOfLines={1}>
            {album.title}
          </Text>
          <Text variant="caption" tone="secondary" numberOfLines={1}>
            {album.artist}
          </Text>
          <Text variant="bodySmall" tone="secondary">
            {progressCopy}
          </Text>
          {album.completionPct != null ? (
            <AlbumProgressBar completionPct={album.completionPct} isComplete={false} animated />
          ) : null}
        </View>
      </Pressable>

      <Button
        title="Continue ranking →"
        size="sm"
        variant="secondary"
        onPress={() => (onContinue ?? onPress)()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
  },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
});
