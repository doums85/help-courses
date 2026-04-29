import { describe, it, expect } from "vitest";
import { shuffleDeterministic } from "../paliers";

function jaccardSimilarity(a: string, b: string): number {
  const ta = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const tb = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  if (ta.size === 0 && tb.size === 0) return 1;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const union = ta.size + tb.size - inter;
  return union === 0 ? 0 : inter / union;
}

describe("shuffleDeterministic (Decision 75)", () => {
  it("same seed → same output", () => {
    const a = shuffleDeterministic([1, 2, 3, 4, 5, 6, 7, 8], "seed1");
    const b = shuffleDeterministic([1, 2, 3, 4, 5, 6, 7, 8], "seed1");
    expect(a).toEqual(b);
  });
  it("different seeds → different output (with high probability)", () => {
    const a = shuffleDeterministic([1, 2, 3, 4, 5, 6, 7, 8], "seed1");
    const b = shuffleDeterministic([1, 2, 3, 4, 5, 6, 7, 8], "seed2");
    expect(a).not.toEqual(b);
  });
  it("preserves all elements", () => {
    const out = shuffleDeterministic(["a", "b", "c", "d", "e"], "x");
    expect([...out].sort()).toEqual(["a", "b", "c", "d", "e"]);
  });
  it("empty array", () =>
    expect(shuffleDeterministic<string>([], "s")).toEqual([]));
});

describe("variation similarity guard (Skeptic R4)", () => {
  it("identical statements flagged as too similar", () => {
    const orig =
      "Aïssatou achète 5 mangues à 200 FCFA chacune. Combien paye-t-elle ?";
    const variation =
      "Aïssatou achète 5 mangues à 200 FCFA chacune. Combien paye-t-elle ?";
    expect(jaccardSimilarity(orig, variation)).toBeGreaterThan(0.9);
  });
  it("good variation has different chiffres + contexte", () => {
    const orig =
      "Aïssatou achète 5 mangues à 200 FCFA chacune. Combien paye-t-elle ?";
    const variation =
      "Modou prend 7 oranges au marché Sandaga pour 150 FCFA pièce. Total ?";
    expect(jaccardSimilarity(orig, variation)).toBeLessThan(0.4);
  });
});

describe("regen cumulative cap (Decision 60)", () => {
  function canRegen(cumulativeRegens: number, hardCap = 3): boolean {
    return cumulativeRegens < hardCap;
  }
  it("0 → allowed", () => expect(canRegen(0)).toBe(true));
  it("2 → allowed (3rd is fine)", () => expect(canRegen(2)).toBe(true));
  it("3 → blocked", () => expect(canRegen(3)).toBe(false));
  it("99 → blocked", () => expect(canRegen(99)).toBe(false));
});
