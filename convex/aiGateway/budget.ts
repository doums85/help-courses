/**
 * AI Gateway — budget enforcement.
 *
 * Implements the 5-tier degradation ladder from Decision 69:
 *   < 80%   -> normal
 *   80-90%  -> warn (UI badge, no behaviour change)
 *   90-95%  -> economy auto-on (token cap -30%)
 *   95-100% -> kill kid_initiated ("J'en veux encore" rejected)
 *   100-110%-> cache-only (block any palier_base/palier_personalized)
 *   >= 110% -> hard reject all calls
 *
 * Pure functions: take in spend + budget, return a decision. The Convex
 * action layer is responsible for fetching `aiUsage.sumThisMonthUsd()` and
 * `settings.aiMonthlyBudgetUsd` and feeding them in.
 */

import type { AiPurpose } from "./registry";

export type BudgetTier =
  | "normal"
  | "warn"
  | "economy"
  | "kill_kid_initiated"
  | "cache_only"
  | "hard_reject";

export interface BudgetContext {
  spendUsd: number;
  budgetUsd: number;
  /** Forced economy switch from settings. */
  economyForced: boolean;
}

export interface BudgetDecision {
  allowed: boolean;
  tier: BudgetTier;
  ratio: number; // spend / budget, NaN-guarded
  /** Apply economy-mode token cap downgrade. */
  applyEconomy: boolean;
  /** Human-readable reason, surfaced as `error.message` when rejected. */
  reason?: string;
  /** UX-friendly message shown to the kid (Decision 82, kidMessages.ts). */
  kidMessage?: string;
}

const KID_INITIATED_PURPOSES: AiPurpose[] = [
  "palier_personalized", // "J'en veux encore"
];

const GENERATIVE_PURPOSES: AiPurpose[] = [
  "palier_base",
  "palier_personalized",
];

/** Decide whether `purpose` may proceed under current budget conditions. */
export function evaluateBudget(
  purpose: AiPurpose,
  scope: "kid_initiated" | "system_regen" | "system",
  ctx: BudgetContext,
): BudgetDecision {
  const ratio =
    ctx.budgetUsd > 0 ? ctx.spendUsd / ctx.budgetUsd : Number.POSITIVE_INFINITY;

  // Tier resolution
  let tier: BudgetTier;
  if (ratio < 0.8) tier = "normal";
  else if (ratio < 0.9) tier = "warn";
  else if (ratio < 0.95) tier = "economy";
  else if (ratio < 1.0) tier = "kill_kid_initiated";
  else if (ratio < 1.1) tier = "cache_only";
  else tier = "hard_reject";

  // Economy auto-on at 90%, or forced via settings.
  const applyEconomy = ctx.economyForced || ratio >= 0.9;

  // Hard reject — nothing goes through.
  if (tier === "hard_reject") {
    return {
      allowed: false,
      tier,
      ratio,
      applyEconomy,
      reason: "BUDGET_EXCEEDED",
      kidMessage:
        "Oh, on a beaucoup travaillé aujourd'hui ! 🌙 Reviens demain, des nouveaux exos t'attendent.",
    };
  }

  // Cache-only — block any net-new generation.
  if (tier === "cache_only" && GENERATIVE_PURPOSES.includes(purpose)) {
    return {
      allowed: false,
      tier,
      ratio,
      applyEconomy,
      reason: "BUDGET_CACHE_ONLY",
      kidMessage:
        "On utilise les exercices déjà préparés aujourd'hui ! Reviens demain pour des nouveaux 🌟",
    };
  }

  // Kill kid_initiated — block "J'en veux encore" but let system_regen + base bucket gen pass.
  if (
    tier === "kill_kid_initiated" &&
    scope === "kid_initiated" &&
    KID_INITIATED_PURPOSES.includes(purpose)
  ) {
    return {
      allowed: false,
      tier,
      ratio,
      applyEconomy,
      reason: "BUDGET_KILL_KID_INITIATED",
      kidMessage:
        "Tu as déjà fait beaucoup d'exos bonus aujourd'hui ! Reviens demain 🌟",
    };
  }

  return { allowed: true, tier, ratio, applyEconomy };
}

/**
 * Project month-end spend as a linear extrapolation of the current daily run-rate.
 * Used by /admin/ai-settings (Decision 70 — projection calculator).
 */
export function projectMonthEndSpend(
  spendUsd: number,
  dayOfMonth: number,
  daysInMonth: number,
): number {
  if (dayOfMonth <= 0) return 0;
  return (spendUsd / dayOfMonth) * daysInMonth;
}
