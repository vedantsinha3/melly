import type { RatingWithTrack } from '@/types';
import { applyComparison, getComparisonIndex } from '@/lib/ranking';

export const PLACEMENT_STATUS_MESSAGES = [
  'Finding the perfect spot...',
  'Comparing against your favorites...',
  'Checking similar ratings...',
  'Narrowing the search...',
  'Almost done...',
] as const;

export type PlacementSearchStep = {
  rank: number;
};

export function buildPlacementSearchSteps(
  rankedList: RatingWithTrack[],
  comparisonLog: { comparedTrackId: string; preferredTrackId: string }[],
  newTrackId: string,
): PlacementSearchStep[] {
  let low = 0;
  let high = rankedList.length;
  const steps: PlacementSearchStep[] = [];

  for (const comparison of comparisonLog) {
    const mid = getComparisonIndex(low, high);
    const compareRating = rankedList[mid];
    if (!compareRating) break;

    steps.push({ rank: compareRating.rank_position });

    const preferNew = comparison.preferredTrackId === newTrackId;
    const next = applyComparison(low, high, preferNew);
    low = next.low;
    high = next.high;
  }

  return steps;
}
