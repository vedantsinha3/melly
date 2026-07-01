import { SymbolView } from 'expo-symbols';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Text } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getTheme, layout } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

function toDisplayName(user?: { email?: string | null; user_metadata?: { full_name?: string; name?: string } } | null) {
  const raw = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split('@')[0];
  if (!raw) return 'Account';
  return raw
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const NAV_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/(tabs)' as const,
    icon: { ios: 'music.note.house.fill', android: 'home', web: 'home' } as const,
  },
  {
    key: 'search',
    label: 'Log song',
    href: '/(tabs)/search' as const,
    icon: { ios: 'plus', android: 'add', web: 'add' } as const,
  },
  {
    key: 'library',
    label: 'Library',
    href: '/(tabs)/library' as const,
    icon: { ios: 'music.note.list', android: 'library_music', web: 'library_music' } as const,
  },
  {
    key: 'import',
    label: 'Quick start',
    href: '/(tabs)/import' as const,
    icon: { ios: 'paperplane.fill', android: 'rocket_launch', web: 'rocket_launch' } as const,
  },
] as const;

function isActiveRoute(pathname: string, href: string) {
  if (href === '/(tabs)') {
    return pathname === '/' || pathname.endsWith('/index') || pathname === '/(tabs)';
  }
  if (href === '/(tabs)/search') {
    return pathname.includes('/search');
  }
  if (href === '/(tabs)/library') {
    return pathname.includes('/library');
  }
  return pathname.includes('/import');
}

type Props = {
  onSignOut?: () => void;
};

export function AppSidebar({ onSignOut }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius, motion } = getTheme(colorScheme);
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const showSidebar = width >= layout.breakpointWide;
  const displayName = toDisplayName(user);

  if (!showSidebar) return null;

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <View
      style={[
        styles.sidebar,
        {
          width: layout.sidebarWidth,
          backgroundColor: colors.surfaceMuted,
          borderRightColor: colors.separator,
          paddingTop: spacing.xl,
          paddingHorizontal: spacing.md,
        },
      ]}>
      <View style={[styles.brand, { marginBottom: spacing['2xl'], paddingHorizontal: spacing.sm }]}>
        <View style={[styles.logo, { backgroundColor: colors.accent, borderRadius: radius.md }]}>
          <Text style={styles.logoText}>M</Text>
        </View>
        <View style={styles.brandText}>
          <Text variant="label" style={{ fontWeight: '600', fontSize: 15 }}>
            Melly
          </Text>
          <Text variant="caption" tone="tertiary">
            Your music rank
          </Text>
        </View>
      </View>

      <View style={[styles.nav, { gap: spacing.xs, paddingHorizontal: spacing.xs }]}>
        {NAV_ITEMS.map((item) => {
          const active = isActiveRoute(pathname, item.href);
          return (
            <Pressable
              key={item.key}
              onPress={() => router.push(item.href)}
              style={({ pressed, hovered }) => [
                styles.navItem,
                {
                  borderRadius: radius.md,
                  backgroundColor: active
                    ? colors.surface
                    : pressed || hovered
                      ? colors.surfaceHover
                      : 'transparent',
                  paddingVertical: spacing.sm + 2,
                  paddingHorizontal: spacing.md,
                  gap: spacing.sm,
                  transitionDuration: `${motion.fast}ms`,
                  ...(active
                    ? {
                        boxShadow: `0 1px 2px ${colors.shadow}`,
                      }
                    : null),
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}>
              {active ? (
                <View style={[styles.activeBar, { backgroundColor: colors.accent, borderRadius: radius.pill }]} />
              ) : null}
              <SymbolView
                name={item.icon}
                tintColor={active ? colors.text : colors.textSecondary}
                size={17}
              />
              <Text
                variant="label"
                style={{
                  color: active ? colors.text : colors.textSecondary,
                  fontWeight: active ? '600' : '500',
                }}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.separator,
            paddingTop: spacing.md,
            marginTop: spacing.xl,
            paddingHorizontal: spacing.xs,
            paddingBottom: spacing.lg,
          },
        ]}>
        {onSignOut ? (
          <Pressable
            onPress={onSignOut}
            style={({ pressed, hovered }) => [
              styles.userRow,
              {
                borderRadius: radius.md,
                backgroundColor: pressed || hovered ? colors.surfaceHover : colors.surface,
                padding: spacing.sm,
                transitionDuration: `${motion.fast}ms`,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sign out">
            <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
              <Text variant="label" tone="accent">
                {initial}
              </Text>
            </View>
            <View style={styles.userMeta}>
              <Text variant="bodySmall" numberOfLines={1} style={{ fontWeight: '500' }}>
                {displayName}
              </Text>
              <Text variant="caption" tone="tertiary">
                Sign out
              </Text>
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    borderRightWidth: StyleSheet.hairlineWidth,
    flexShrink: 0,
    alignSelf: 'stretch',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  brandText: {
    gap: 1,
  },
  nav: {
    flex: 1,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  activeBar: {
    position: 'absolute',
    left: 4,
    width: 3,
    height: 18,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMeta: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
});
