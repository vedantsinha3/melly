import { supabase } from './supabase';
import type { RatingWithTrack } from '@/types';

export const DEFAULT_FIRST_SCORE = 7.0;
const NEIGHBOR_STEP = 0.2;
const LEGACY_MIGRATION_MIN_SIZE = 6;
const LEGACY_MATCH_THRESHOLD = 0.02;

export function scoreForRank(rankPosition: number, totalCount: number): number {
  if (totalCount <= 1) return DEFAULT_FIRST_SCORE;
  return Math.round((1 + (9 * (totalCount - rankPosition)) / (totalCount - 1)) * 10) / 10;
}

function clampScore(value: number): number {
  return Math.max(1, Math.min(10, Number(value.toFixed(1))));
}

function legacyCurveScore(rankPosition: number, totalCount: number): number {
  if (totalCount <= 1) return DEFAULT_FIRST_SCORE;
  const normalized = 1 - (rankPosition - 1) / Math.max(totalCount - 1, 1);
  const curved = 3 + 7 * Math.pow(normalized, 0.78);
  return clampScore(Math.round(curved * 5) / 5);
}

function isLikelyLegacyRankBased(ratings: Array<{ rank_position: number; score: number }>): boolean {
  if (ratings.length < LEGACY_MIGRATION_MIN_SIZE) return false;

  const total = ratings.length;
  let matched = 0;
  for (const rating of ratings) {
    const expected = scoreForRank(rating.rank_position, total);
    if (Math.abs(Number(rating.score) - expected) <= LEGACY_MATCH_THRESHOLD) {
      matched += 1;
    }
  }

  return matched / total >= 0.95;
}

async function migrateLegacyRankScoresIfNeeded(
  userId: string,
  ratings: Array<{ id: string; rank_position: number; score: number }>,
): Promise<void> {
  if (!isLikelyLegacyRankBased(ratings)) return;

  for (const rating of ratings) {
    const nextScore = legacyCurveScore(rating.rank_position, ratings.length);
    const { error } = await supabase.from('ratings').update({ score: nextScore }).eq('id', rating.id);
    if (error) throw error;
  }
}

export function calculateScoreForInsertion(
  sortedRatings: Array<{ score: number }>,
  insertionIndex: number,
): number {
  if (sortedRatings.length === 0) return DEFAULT_FIRST_SCORE;

  const above = sortedRatings[insertionIndex - 1];
  const below = sortedRatings[insertionIndex];
  const aboveScore = above ? Number(above.score) : null;
  const belowScore = below ? Number(below.score) : null;

  if (aboveScore != null && belowScore != null) {
    return clampScore((aboveScore + belowScore) / 2);
  }

  if (belowScore != null) {
    if (belowScore >= 9.95) return 10;
    return clampScore(belowScore + NEIGHBOR_STEP);
  }

  if (aboveScore != null) {
    if (aboveScore <= 1.05) return 1;
    return clampScore(aboveScore - NEIGHBOR_STEP);
  }

  return DEFAULT_FIRST_SCORE;
}

export function getComparisonIndex(low: number, high: number): number {
  return Math.floor((low + high) / 2);
}

export function isComparisonComplete(low: number, high: number): boolean {
  return low >= high;
}

export function estimateComparisonCount(listLength: number): number {
  if (listLength === 0) return 0;
  return Math.ceil(Math.log2(listLength + 1));
}

export function estimatePlacement(
  low: number,
  high: number,
  rankedList: Array<{ score: number }>,
  comparisonsMade: number,
): { estimatedRank: number; estimatedScore: number; confidence: number } {
  const listLength = rankedList.length;
  const estimatedIndex = getComparisonIndex(low, high);
  const estimatedRank = estimatedIndex + 1;
  const estimatedScore = calculateScoreForInsertion(rankedList, estimatedIndex);
  const remainingRange = Math.max(high - low, 1);
  const narrowed = 1 - remainingRange / Math.max(listLength, 1);
  const confidence = Math.round(Math.min(92, Math.max(18, narrowed * 68 + comparisonsMade * 14)));
  return { estimatedRank, estimatedScore, confidence };
}

export function applyComparison(
  low: number,
  high: number,
  preferNew: boolean,
): { low: number; high: number } {
  const mid = getComparisonIndex(low, high);
  if (preferNew) {
    return { low, high: mid };
  }
  return { low: mid + 1, high };
}

export async function fetchRankedRatings(userId: string): Promise<RatingWithTrack[]> {
  const { data, error } = await supabase
    .from('ratings')
    .select('*, track:tracks(*)')
    .eq('user_id', userId)
    .order('rank_position', { ascending: true });

  if (error) throw error;
  const ratings = data as RatingWithTrack[];
  const scoreSnapshot = ratings.map((r) => ({ rank_position: r.rank_position, score: Number(r.score) }));
  const hadLegacyScores = isLikelyLegacyRankBased(scoreSnapshot);

  await migrateLegacyRankScoresIfNeeded(
    userId,
    ratings.map((rating) => ({
      id: rating.id,
      rank_position: rating.rank_position,
      score: Number(rating.score),
    })),
  );

  if (hadLegacyScores) {
    const { data: refreshed, error: refreshError } = await supabase
      .from('ratings')
      .select('*, track:tracks(*)')
      .eq('user_id', userId)
      .order('rank_position', { ascending: true });

    if (refreshError) throw refreshError;
    return refreshed as RatingWithTrack[];
  }

  return ratings;
}

export async function hasExistingRating(
  userId: string,
  trackId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('ratings')
    .select('id')
    .eq('user_id', userId)
    .eq('track_id', trackId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function insertFirstRating(
  userId: string,
  trackId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from('ratings')
    .insert({
      user_id: userId,
      track_id: trackId,
      rank_position: 1,
      score: DEFAULT_FIRST_SCORE,
      listened_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function finalizeRating(
  userId: string,
  trackId: string,
  insertionIndex: number,
  comparisons: {
    comparedTrackId: string;
    preferredTrackId: string;
  }[],
): Promise<string> {
  const { data: existingRatings, error: fetchError } = await supabase
    .from('ratings')
    .select('id, rank_position, score')
    .eq('user_id', userId)
    .order('rank_position', { ascending: true });

  if (fetchError) throw fetchError;

  const newRankPosition = insertionIndex + 1;
  const newScore = calculateScoreForInsertion(existingRatings ?? [], insertionIndex);

  const toShift = (existingRatings ?? []).filter(
    (r) => r.rank_position >= newRankPosition,
  );

  for (const rating of toShift) {
    const { error } = await supabase
      .from('ratings')
      .update({ rank_position: rating.rank_position + 1 })
      .eq('id', rating.id);

    if (error) throw error;
  }

  const { data: newRating, error: insertError } = await supabase
    .from('ratings')
    .insert({
      user_id: userId,
      track_id: trackId,
      rank_position: newRankPosition,
      score: newScore,
      listened_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (insertError) throw insertError;

  if (comparisons.length > 0) {
    const { error: comparisonError } = await supabase.from('comparisons').insert(
      comparisons.map((c) => ({
        user_id: userId,
        new_track_id: trackId,
        compared_track_id: c.comparedTrackId,
        preferred_track_id: c.preferredTrackId,
      })),
    );

    if (comparisonError) throw comparisonError;
  }

  return newRating.id;
}

export async function updateRatingNotes(ratingId: string, notes: string): Promise<void> {
  const { error } = await supabase.from('ratings').update({ notes }).eq('id', ratingId);
  if (error) throw error;
}

export async function deleteRating(userId: string, ratingId: string): Promise<void> {
  const { data: rating, error: fetchError } = await supabase
    .from('ratings')
    .select('rank_position')
    .eq('id', ratingId)
    .eq('user_id', userId)
    .single();

  if (fetchError) throw fetchError;

  const { error: deleteError } = await supabase
    .from('ratings')
    .delete()
    .eq('id', ratingId);

  if (deleteError) throw deleteError;

  const { data: remaining, error: remainingError } = await supabase
    .from('ratings')
    .select('id, rank_position')
    .eq('user_id', userId)
    .order('rank_position', { ascending: true });

  if (remainingError) throw remainingError;

  const totalCount = remaining?.length ?? 0;
  for (let i = 0; i < totalCount; i++) {
    const r = remaining![i];
    const newPosition = i + 1;
    const { error } = await supabase
      .from('ratings')
      .update({
        rank_position: newPosition,
      })
      .eq('id', r.id);

    if (error) throw error;
  }
}

export async function fetchComparisonCountForTrack(
  userId: string,
  trackId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('comparisons')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('new_track_id', trackId);

  if (error) throw error;
  return count ?? 0;
}

export async function fetchRatingById(
  userId: string,
  ratingId: string,
): Promise<RatingWithTrack | null> {
  const { data, error } = await supabase
    .from('ratings')
    .select('*, track:tracks(*)')
    .eq('id', ratingId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as RatingWithTrack | null;
}
