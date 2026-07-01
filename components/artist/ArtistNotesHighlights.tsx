import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import type { NoteHighlight } from '@/lib/artistDetail';

type Props = {
  artistName: string;
  notes: NoteHighlight[];
  onNotePress: (ratingId: string) => void;
};

export function ArtistNotesHighlights({ artistName, notes, onNotePress }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { spacing } = getTheme(colorScheme);

  if (notes.length === 0) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="heading">Your notes on {artistName}</Text>
      <Card style={{ gap: spacing.md, padding: spacing.md }}>
        {notes.map((item) => (
          <Pressable key={item.ratingId} onPress={() => onNotePress(item.ratingId)} style={styles.note}>
            <Text variant="caption" tone="tertiary">
              {item.trackName}
            </Text>
            <Text variant="bodySmall" tone="secondary" style={styles.quote}>
              &ldquo;{item.note}&rdquo;
            </Text>
          </Pressable>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  note: {
    gap: 4,
  },
  quote: {
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
