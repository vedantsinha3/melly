import { StyleSheet, View } from 'react-native';

import { Button, Card, Text, TextField } from '@/components/ui';
import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

type Props = {
  notes: string;
  onChangeNotes: (value: string) => void;
  onSave: () => void;
  saving: boolean;
  trackName: string;
};

export function SongNotesSection({ notes, onChangeNotes, onSave, saving, trackName }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius } = getTheme(colorScheme);
  const hasNotes = notes.trim().length > 0;

  return (
    <Card
      style={[
        styles.section,
        {
          gap: spacing.md,
          padding: spacing.lg,
          borderRadius: radius.xl,
          backgroundColor: colors.surface,
        },
      ]}>
      <View style={{ gap: 4 }}>
        <Text variant="heading">Your notes</Text>
        <Text variant="bodySmall" tone="secondary">
          {hasNotes
            ? `What "${trackName}" means to you — capture the memory while it's fresh.`
            : `Notes turn a score into a memory. Jot down why "${trackName}" earned its spot — a mood, a moment, or what makes it stick.`}
        </Text>
      </View>

      <TextField
        style={[styles.input, { minHeight: hasNotes ? 140 : 120 }]}
        placeholder="What made this song land here? A late-night drive, a perfect chorus, a mood you keep coming back to..."
        multiline
        value={notes}
        onChangeText={onChangeNotes}
      />

      <Button
        title={saving ? 'Saving…' : hasNotes ? 'Save notes' : 'Save your first note'}
        onPress={onSave}
        disabled={saving}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
  },
  input: {
    textAlignVertical: 'top',
  },
});
