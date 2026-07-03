import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { getTheme } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import { Text } from './Text';

const SCRIM_GRADIENT =
  'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 45%, transparent 100%)';

function scrimStyle(borderRadius: number): ViewStyle {
  return {
    borderRadius,
    ...(Platform.OS === 'web'
      ? { backgroundImage: SCRIM_GRADIENT }
      : { experimental_backgroundImage: SCRIM_GRADIENT }),
  };
}

type Props = {
  imageUrl?: string | null;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  onPress: () => void;
  size?: number;
  fill?: boolean;
  accessibilityLabel?: string;
};

export function MediaCard({
  imageUrl,
  title,
  subtitle,
  footer,
  onPress,
  size,
  fill = false,
  accessibilityLabel,
}: Props) {
  const colorScheme = useColorScheme();
  const { colors, radius, motion } = getTheme(colorScheme);
  const dimensionStyle = fill ? styles.fill : size ? { width: size, height: size } : styles.fill;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${title}${subtitle ? ` by ${subtitle}` : ''}`}
      style={({ pressed, hovered }) => [
        styles.card,
        dimensionStyle,
        {
          borderRadius: radius.lg,
          opacity: pressed ? 0.94 : 1,
          transform: [{ scale: pressed ? 0.98 : Platform.OS === 'web' && hovered ? 1.015 : 1 }],
          transitionDuration: `${motion.normal}ms`,
          ...(Platform.OS === 'web' && hovered
            ? { boxShadow: '0 10px 28px rgba(0,0,0,0.16)' }
            : null),
        },
      ]}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.fallback, { backgroundColor: colors.surfaceInset }]}>
          <Text variant="title" tone="tertiary">
            {title.charAt(0)}
          </Text>
        </View>
      )}
      <View style={[styles.scrim, scrimStyle(radius.lg)]} />
      <View style={styles.meta}>
        <Text variant="label" numberOfLines={2} style={styles.onImageTitle}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" numberOfLines={1} style={styles.onImageSubtitle}>
            {subtitle}
          </Text>
        ) : null}
        {footer}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderCurve: 'continuous',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
  },
  meta: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    gap: 2,
  },
  onImageTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  onImageSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
  },
});
