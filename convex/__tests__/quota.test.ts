import { describe, it, expect } from "vitest";
import { evaluateQuota, dayKey, endOfDayUtc } from "../aiGateway/quota";

describe("evaluateQuota — kid_initiated daily cap (Decision 47, 54)", () => {
  it("0/3 used → allowed, remaining 3", () => {
    expect(
      evaluateQuota({
        scope: "kid_initiated",
        currentCount: 0,
        dailyCap: 3,
      }),
    ).toEqual({ allowed: true, remaining: 3 });
  });
  it("1/3 used → allowed remaining 2", () => {
    expect(
      evaluateQuota({
        scope: "kid_initiated",
        currentCount: 1,
        dailyCap: 3,
      }).remaining,
    ).toBe(2);
  });
  it("2/3 → allowed remaining 1", () => {
    expect(
      evaluateQuota({
        scope: "kid_initiated",
        currentCount: 2,
        dailyCap: 3,
      }).remaining,
    ).toBe(1);
  });
  it("3/3 → rejected QUOTA_EXCEEDED", () => {
    const d = evaluateQuota({
      scope: "kid_initiated",
      currentCount: 3,
      dailyCap: 3,
    });
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("QUOTA_EXCEEDED");
    expect(d.kidMessage).toMatch(/3 séries|reviens demain/i);
  });
  it("exceeded count (4/3) still blocks", () => {
    expect(
      evaluateQuota({
        scope: "kid_initiated",
        currentCount: 4,
        dailyCap: 3,
      }).allowed,
    ).toBe(false);
  });
  it("custom cap 5 — 4/5 allowed", () => {
    expect(
      evaluateQuota({
        scope: "kid_initiated",
        currentCount: 4,
        dailyCap: 5,
      }).allowed,
    ).toBe(true);
  });
});

describe("evaluateQuota — system_regen unbounded (Decision 54)", () => {
  it("system_regen at any count → allowed", () => {
    expect(
      evaluateQuota({
        scope: "system_regen",
        currentCount: 1000,
        dailyCap: 3,
      }),
    ).toMatchObject({
      allowed: true,
      remaining: Number.POSITIVE_INFINITY,
    });
  });
});

describe("dayKey / endOfDayUtc helpers", () => {
  it("dayKey is YYYY-MM-DD UTC", () => {
    const k = dayKey(Date.UTC(2026, 3, 28, 5, 0, 0));
    expect(k).toBe("2026-04-28");
  });
  it("endOfDayUtc returns next-day midnight", () => {
    const t = endOfDayUtc(Date.UTC(2026, 3, 28, 5, 0, 0));
    expect(new Date(t).toISOString()).toBe("2026-04-29T00:00:00.000Z");
  });
});
