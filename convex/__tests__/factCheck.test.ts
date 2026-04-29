import { describe, it, expect } from "vitest";
import {
  checkMathExercise,
  evaluateExpression,
  parseAnswerNumber,
} from "../aiGateway/factCheck";

describe("evaluateExpression — arithmetic", () => {
  it.each([
    ["2+3", 5],
    ["10-7", 3],
    ["4*5", 20],
    ["20/4", 5],
    ["2 * (3 + 4)", 14],
    ["(3/4) + (1/2)", 1.25],
    ["53 - 27", 26],
    ["-3 + 5", 2],
    ["+7", 7],
    ["2 × 7", 14],
    ["6 ÷ 2", 3],
    ["2,5 + 1,5", 4],
  ])("eval(%s) = %s", (expr, exp) =>
    expect(evaluateExpression(expr)).toBeCloseTo(exp, 6),
  );
  it("division by zero throws", () =>
    expect(() => evaluateExpression("1/0")).toThrow());
  it("unbalanced paren throws", () =>
    expect(() => evaluateExpression("(2+3")).toThrow());
  it("garbage throws", () => expect(() => evaluateExpression("abc")).toThrow());
});

describe("parseAnswerNumber", () => {
  it.each<[string, number | null]>([
    ["5", 5],
    ["3.14", 3.14],
    ["3,14", 3.14],
    ["1/2", 0.5],
    ["12 FCFA", 12],
    ["-7", -7],
    ["", null],
    ["abc", null],
    ["3/0", null],
  ])("parse(%s) = %s", (raw, exp) =>
    expect(parseAnswerNumber(raw)).toEqual(exp),
  );
});

describe("checkMathExercise — Decision 53", () => {
  it("matching → ok", () => {
    const r = checkMathExercise("53 - 27", "26");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.computed).toBe(26);
  });
  it("divergence → flagged", () => {
    const r = checkMathExercise("53 - 27", "36");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("divergence");
  });
  it("null mathExpression → parse_error (triggers fallback verify_math, Decision 72)", () => {
    const r = checkMathExercise(null, "5");
    expect(r).toMatchObject({ ok: false, reason: "parse_error" });
  });
  it("empty string → parse_error", () => {
    expect(checkMathExercise("", "5")).toMatchObject({
      ok: false,
      reason: "parse_error",
    });
  });
  it("non-numeric answer → answer_not_numeric", () => {
    const r = checkMathExercise("2+3", "vingt-six");
    expect(r).toMatchObject({ ok: false, reason: "answer_not_numeric" });
  });
  it("fraction expression vs decimal answer", () => {
    const r = checkMathExercise("(3/4)+(1/2)", "1.25");
    expect(r.ok).toBe(true);
  });
  it("tolerance epsilon — small diff still ok", () => {
    const r = checkMathExercise("1/3", "0.333333");
    expect(r.ok).toBe(true);
  });
  it("integer answer with FCFA suffix tolerated", () => {
    const r = checkMathExercise("100 + 50", "150 FCFA");
    expect(r.ok).toBe(true);
  });
});
