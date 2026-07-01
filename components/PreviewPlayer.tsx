import { Audio } from 'expo-av';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { Button, Text } from '@/components/ui';

type Props = {
  previewUrl: string | null;
};

export function PreviewPlayer({ previewUrl }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors } = getTheme(colorScheme);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  if (!previewUrl) {
    return (
      <Text variant="bodySmall" tone="secondary" style={styles.unavailable}>
        No preview available
      </Text>
    );
  }

  const togglePlayback = async () => {
    try {
      if (playing && soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setPlaying(false);
        return;
      }

      setLoading(true);
      const { sound } = await Audio.Sound.createAsync(
        { uri: previewUrl },
        { shouldPlay: true },
      );
      soundRef.current = sound;
      setPlaying(true);
      setLoading(false);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlaying(false);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch {
      setLoading(false);
      setPlaying(false);
    }
  };

  return (
    <Button
      title={playing ? 'Stop preview' : 'Play preview'}
      loading={loading}
      onPress={togglePlayback}
      style={styles.button}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'center',
  },
  unavailable: {
    textAlign: 'center',
  },
});
