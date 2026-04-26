import { SCORE_THRESHOLDS } from './constants';

export function getScoreColor(score: number): string {
  if (score >= SCORE_THRESHOLDS.HIGH) return 'border-vibrant-emerald bg-vibrant-emerald/5 text-vibrant-emerald';
  if (score >= SCORE_THRESHOLDS.MEDIUM) return 'border-vibrant-gold/30 bg-vibrant-gold/10 text-vibrant-gold';
  return 'border-vibrant-rose/20 bg-vibrant-rose/5 text-vibrant-rose';
}

export function getScoreTextColor(score: number): string {
  if (score >= SCORE_THRESHOLDS.HIGH) return 'text-vibrant-emerald';
  if (score >= SCORE_THRESHOLDS.MEDIUM) return 'text-vibrant-gold';
  return 'text-vibrant-rose';
}