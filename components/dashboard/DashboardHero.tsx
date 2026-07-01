import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { useColorScheme } from '@/components/useColorScheme';
import { getTheme } from '@/constants/theme';

type Props = {
  displayName: string;
  totalRanked: number;
  averageScore: number;
  perfectScores: number;
  favoriteArtist: string | null;
  queueActive: boolean;
  queueCurrent: number;
  queueTotal: number;
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
  primaryLabel: string;
  showImport?: boolean;
  onImport?: () => void;
  onViewRanking?: () => void;
  showFullRanking?: boolean;
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function MetricCell({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const { spacing } = getTheme(colorScheme);

  return (
    <View style={[styles.metricCell, { gap: spacing.xs }]}>
      <Text variant="overline" tone="tertiary">
        {label}
      </Text>
      <Text variant="metricSm" style={styles.metricValue} numberOfLines={1}>
        {value}
      </Text>
      {hint ? (
        <Text variant="caption" tone="tertiary" numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export function DashboardToolbar({
  displayName,
  onViewRanking,
  showFullRanking,
  showImport,
  onImport,
  onSignOut,
  showSignOut,
}: Pick<
  Props,
  'displayName' | 'onViewRanking' | 'showFullRanking' | 'showImport' | 'onImport'
> & {
  onSignOut?: () => void;
  showSignOut?: boolean;
}) {
  const colorScheme = useColorScheme() ?? 'light';
  const { spacing, colors, radius } = getTheme(colorScheme);

  return (
    <View style={[styles.toolbar, { gap: spacing.sm, marginBottom: spacing.xs }]}>
      <View style={styles.toolbarLeft}>
        <Text variant="overline" tone="tertiary">
          {getGreeting()}
        </Text>
        <Text variant="title">{displayName}</Text>
      </View>
      <View style={[styles.toolbarActions, { gap: spacing.sm }]}>
        {showImport && onImport ? (
          <Button title="Import" variant="secondary" size="sm" onPress={onImport} />
        ) : null}
        {onViewRanking ? (
          <Button
            title={showFullRanking ? 'Hide list' : 'Full list'}
            variant="ghost"
            size="sm"
            onPress={onViewRanking}
          />
        ) : null}
        {showSignOut && onSignOut ? (
          <Pressable
            onPress={onSignOut}
            style={({ pressed }) => [
              styles.avatarBtn,
              {
                backgroundColor: colors.surfaceMuted,
                borderRadius: radius.pill,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sign out">
            <Text variant="label">{displayName.charAt(0).toUpperCase()}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function DashboardHero({
  totalRanked,
  averageScore,
  perfectScores,
  favoriteArtist,
  queueActive,
  queueCurrent,
  queueTotal,
  onPrimaryAction,
  onSecondaryAction,
  primaryLabel,
}: Omit<Props, 'displayName' | 'showImport' | 'onImport' | 'onViewRanking' | 'showFullRanking'>) {
  const colorScheme = useColorScheme() ?? 'light';
  const { colors, spacing, radius } = getTheme(colorScheme);

  return (
    <View
      style={[
        styles.hero,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          gap: spacing.md,
        },
      ]}>
      <View style={styles.heroBody}>
        <View style={[styles.metricsRow, { gap: spacing.md }]}>
          <MetricCell label="Ranked" value={String(totalRanked)} hint="songs" />
          <View style={[styles.metricDivider, { backgroundColor: colors.separator }]} />
          <MetricCell
            label="Average"
            value={averageScore > 0 ? averageScore.toFixed(1) : '—'}
            hint="score"
          />
          <View style={[styles.metricDivider, { backgroundColor: colors.separator }]} />
          <MetricCell label="Perfect" value={String(perfectScores)} hint="10.0 rated" />
          <View style={[styles.metricDivider, { backgroundColor: colors.separator }]} />
          <MetricCell
            label="Favorite"
            value={favoriteArtist ?? '—'}
            hint={favoriteArtist ? 'most ranked' : undefined}
          />
        </View>

        <View style={[styles.heroActions, { gap: spacing.sm }]}>
          <Button title={primaryLabel} onPress={onPrimaryAction} />
          {queueActive && onSecondaryAction ? (
            <Button title="Continue" variant="secondary" onPress={onSecondaryAction} />
          ) : null}
        </View>
      </View>

      {queueActive ? (
        <View
          style={[
            styles.queueBanner,
            { backgroundColor: colors.accentSoft, borderRadius: radius.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
          ]}>
          <Text variant="caption" tone="accent">
            {queueCurrent} of {queueTotal} songs left in your ranking queue
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  toolbarLeft: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    borderCurve: 'continuous',
  },
  heroBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    flex: 1,
    minWidth: 280,
  },
  metricCell: {
    minWidth: 72,
    flex: 1,
    maxWidth: 140,
  },
  metricValue: {
    fontVariant: ['tabular-nums'],
  },
  metricDivider: {
    width: 1,
    height: 36,
    alignSelf: 'center',
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    flexShrink: 0,
  },
  queueBanner: {},
});
