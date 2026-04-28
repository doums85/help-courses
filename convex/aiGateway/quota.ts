/**
 * AI Gateway — per-user quotas.
 *
 * Two scopes (Decision 54):
 *   - `kid_initiated`: hard daily cap (default 3, tunable via
 *     `settings.dailyMoreLimitPerKid`). Resets at local midnight UTC.
 *   - `system_regen`: NO daily cap, but subject to a 7-day rolling cumulative
 *     cap of 3 regens per (userId, palierId) — that one is enforced in
 *     `convex/paliers/index.ts` against `palierAttemptHistory`.
 *
 * This module exposes pure helpers so it can be unit-tested without Convex.
 */

export type QuotaScope = "kid_initiated" | "system_regen";

export interface QuotaCheckArgs {
  scope: QuotaScope;
  currentCount: number; // existing aiUserQuota.count for today
  dailyCap: number; // settings.dailyMoreLimitPerKid (or override per scope)
}

export interface QuotaDecision {
  allowed: boolean;
  remaining: number;
  reason?: "QUOTA_EXCEEDED";
  kidMessage?: string;
}

export function evaluateQuota(args: QuotaCheckArgs): QuotaDecision {
  // system_regen has no daily cap.
  if (args.scope === "system_regen") {
    return { allowed: true, remaining: Number.POSITIVE_INFINITY };
  }
  const remaining = Math.max(0, args.dailyCap - args.currentCount);
  if (remaining <= 0) {
    return {
      allowed: false,
      remaining: 0,
      reason: "QUOTA_EXCEEDED",
      kidMessage:
        "Tu as déjà fait 3 séries d'exos en bonus aujourd'hui ! Reviens demain pour en faire d'autres 🌟",
    };
  }
  return { allowed: true, remaining };
}

/** YYYY-MM-DD in UTC; the row is rotated when a new dayKey is encountered. */
export function dayKey(now = Date.now()): string {
  const d = new Date(now);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
}

/** End-of-UTC-day timestamp, used to populate aiUserQuota.resetAt. */
export function endOfDayUtc(now = Date.now()): number {
  const d = new Date(now);
  return Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() + 1,
    0,
    0,
    0,
    0,
  );
}
