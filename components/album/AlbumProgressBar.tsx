import { ProgressBar as UIProgressBar } from '@/components/ui/ProgressBar';

type Props = {
  completionPct: number | null;
  isComplete: boolean;
  showLabel?: boolean;
  height?: number;
  /** @deprecated animated prop is visual-only; kept for API compatibility */
  animated?: boolean;
};

export function AlbumProgressBar({
  completionPct,
  isComplete,
  showLabel = false,
  height = 6,
}: Props) {
  return (
    <UIProgressBar
      value={completionPct ?? 0}
      isComplete={isComplete}
      showLabel={showLabel}
      height={height}
      variant="milestone"
    />
  );
}
