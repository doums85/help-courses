import { describe, it, expect } from "vitest";
import {
  evaluateBudget,
  projectMonthEndSpend,
  type BudgetContext,
} from "../aiGateway/budget";

const ctx = (
  spendUsd: number,
  budgetUsd = 100,
  economyForced = false,
): BudgetContext => ({ spendUsd, budgetUsd, economyForced });

describe("evaluateBudget — 5-tier ladder (Decision 69)", () => {
  it("0% → normal, allowed, no economy", () => {
    const d = evaluateBudget("palier_base", "system", ctx(0));
    expect(d.tier).toBe("normal");
    expect(d.allowed).toBe(true);
    expect(d.applyEconomy).toBe(false);
  });
  it("79% → normal", () =>
    expect(evaluateBudget("palier_base", "system", ctx(79)).tier).toBe(
      "normal",
    ));
  it("80% → warn (allowed, not economy yet)", () => {
    const d = evaluateBudget("palier_base", "system", ctx(80));
    expect(d.tier).toBe("warn");
    expect(d.allowed).toBe(true);
    expect(d.applyEconomy).toBe(false);
  });
  it("85% → warn", () =>
    expect(evaluateBudget("palier_base", "system", ctx(85)).tier).toBe(
      "warn",
    ));
  it("90% → economy auto-on", () => {
    const d = evaluateBudget("palier_base", "system", ctx(90));
    expect(d.tier).toBe("economy");
    expect(d.applyEconomy).toBe(true);
    expect(d.allowed).toBe(true);
  });
  it("94.99% still economy", () =>
    expect(evaluateBudget("palier_base", "system", ctx(94.99)).tier).toBe(
      "economy",
    ));
  it("95% → kill_kid_initiated for kid_initiated palier_personalized", () => {
    const d = evaluateBudget("palier_personalized", "kid_initiated", ctx(95));
    expect(d.tier).toBe("kill_kid_initiated");
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("BUDGET_KILL_KID_INITIATED");
    expect(d.kidMessage).toContain("bonus");
  });
  it("95% allows system_regen of palier_personalized", () => {
    const d = evaluateBudget("palier_personalized", "system_regen", ctx(95));
    expect(d.allowed).toBe(true);
  });
  it("95% allows palier_base (system bucket pre-gen)", () => {
    expect(evaluateBudget("palier_base", "system", ctx(95)).allowed).toBe(
      true,
    );
  });
  it("100% → cache_only blocks generative", () => {
    const d = evaluateBudget("palier_base", "system", ctx(100));
    expect(d.tier).toBe("cache_only");
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("BUDGET_CACHE_ONLY");
  });
  it("100% allows verify_math (non-generative)", () => {
    expect(evaluateBudget("verify_math", "system", ctx(100)).allowed).toBe(
      true,
    );
  });
  it("110% → hard_reject all", () => {
    const d = evaluateBudget("verify_math", "system", ctx(110));
    expect(d.tier).toBe("hard_reject");
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("BUDGET_EXCEEDED");
  });
  it("economy forced via settings sticks even at 0%", () => {
    const d = evaluateBudget("palier_base", "system", ctx(0, 100, true));
    expect(d.applyEconomy).toBe(true);
  });
  it("budget=0 → ratio infinity → hard_reject", () => {
    const d = evaluateBudget("palier_base", "system", {
      spendUsd: 1,
      budgetUsd: 0,
      economyForced: false,
    });
    expect(d.tier).toBe("hard_reject");
  });
});

describe("projectMonthEndSpend (Decision 70)", () => {
  it("$30 spent on day 10 of 30 → $90 projected", () => {
    expect(projectMonthEndSpend(30, 10, 30)).toBe(90);
  });
  it("day 0 → 0 (defensive)", () =>
    expect(projectMonthEndSpend(50, 0, 30)).toBe(0));
});
