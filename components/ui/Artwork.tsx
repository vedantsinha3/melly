import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { getTheme, type artwork as ArtworkSizes } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { Text } from './Text';

type ArtworkSize = keyof typeof ArtworkSizes;

type Props = {
  uri?: string | null;
  size?: ArtworkSize;
  fallbackLabel?: string;
  borderRadius?: 'sm' | 'md';
};

export function Artwork({ uri, size = 'md', fallbackLabel, borderRadius = 'sm' }: Props) {
  const colorScheme = useColorScheme();
  const { colors, artwork: sizes, radius } = getTheme(colorScheme);
  const dimension = sizes[size];
  const cornerRadius = borderRadius === 'md' ? radius.md : radius.sm;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          {
            width: dimension,
            height: dimension,
            borderRadius: cornerRadius,
            backgroundColor: colors.artworkPlaceholder,
          },
        ]}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: dimension,
          height: dimension,
          borderRadius: cornerRadius,
          backgroundColor: colors.surfaceInset,
        },
      ]}>
      {fallbackLabel ? (
        <Text variant="label" tone="tertiary">
          {fallbackLabel.charAt(0).toUpperCase()}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    flexShrink: 0,
    borderCurve: 'continuous',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderCurve: 'continuous',
  },
});
