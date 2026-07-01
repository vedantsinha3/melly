import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

type Props = {
  urls: string[];
  size?: number;
};

export function ArtworkPreviewStack({ urls, size = 44 }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, radius } = getTheme(colorScheme);
  const visible = urls.filter(Boolean).slice(0, 5);

  if (visible.length === 0) {
    return (
      <View style={[styles.placeholderRow, { gap: size * 0.18 }]}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.placeholder,
              {
                width: size,
                height: size,
                borderRadius: radius.md,
                backgroundColor: colors.surfaceInset,
                marginLeft: index === 0 ? 0 : -(size * 0.28),
                zIndex: 4 - index,
              },
            ]}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      {visible.map((url, index) => (
        <Image
          key={`${url}-${index}`}
          source={{ uri: url }}
          style={[
            styles.artwork,
            {
              width: size,
              height: size,
              borderRadius: radius.md,
              marginLeft: index === 0 ? 0 : -(size * 0.28),
              zIndex: visible.length - index,
              borderColor: colors.surface,
            },
          ]}
          contentFit="cover"
          transition={200}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artwork: {
    borderWidth: 2,
    borderCurve: 'continuous',
  },
  placeholderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholder: {
    borderCurve: 'continuous',
  },
});
