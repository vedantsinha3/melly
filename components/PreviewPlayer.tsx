import { Audio } from 'expo-av';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

type Props = {
  previewUrl: string | null;
};

export function PreviewPlayer({ previewUrl }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
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
      <Text style={[styles.unavailable, { color: colors.textSecondary }]}>
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
    <Pressable
      onPress={togglePlayback}
      style={[styles.button, { backgroundColor: colors.accent }]}>
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.buttonText}>{playing ? 'Stop preview' : 'Play preview'}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  unavailable: {
    textAlign: 'center',
    fontSize: 14,
  },
});
