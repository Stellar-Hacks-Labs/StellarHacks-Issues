import { describe, expect, it } from "vitest";
import { divideSurplusProRata, formatSurplusRoute, type SurplusRoute } from "../src/surplus.js";

describe("Surplus route formatting", () => {
  it("formats ProRata route", () => {
    const route: SurplusRoute = { tag: "ProRata" };
    expect(formatSurplusRoute(route)).toBe("Pro-rata top-up across prize tiers");
  });

  it("formats Return route with address", () => {
    const route: SurplusRoute = {
      tag: "Return",
      values: ["GAMX62ZD4FWIKMWGVPEDR6WNL2TYTPQMO2ZJEAZUAON7VCZ5G2GWDF7W"],
    };
    expect(formatSurplusRoute(route)).toContain("GAMX62ZD4FWIKMWGVPEDR6WNL2TYTPQMO2ZJEAZUAON7VCZ5G2GWDF7W");
  });

  it("formats Roll route with vault address", () => {
    const route: SurplusRoute = {
      tag: "Roll",
      values: ["CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"],
    };
    expect(formatSurplusRoute(route)).toContain("CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC");
  });
});

describe("Pro-rata surplus division", () => {
  it("divides surplus proportionally across tiers with remainder on top rank", () => {
    const tiers = [
      { track: "payments", rank: 1, amount: 5000n },
      { track: "payments", rank: 2, amount: 3000n },
      { track: "defi", rank: 1, amount: 2000n },
    ];
    const surplus = 2500n;
    const shares = divideSurplusProRata(surplus, tiers);

    expect(shares).toHaveLength(3);
    const sum = shares.reduce((acc, s) => acc + s.amount, 0n);
    expect(sum).toBe(2500n);

    // 5000/10000 * 2500 = 1250
    // 3000/10000 * 2500 = 750
    // 2000/10000 * 2500 = 500
    expect(shares[0]?.amount).toBe(1250n);
    expect(shares[1]?.amount).toBe(750n);
    expect(shares[2]?.amount).toBe(500n);
  });

  it("assigns division remainder to the top place", () => {
    const tiers = [
      { track: "payments", rank: 1, amount: 1000n },
      { track: "payments", rank: 2, amount: 1000n },
      { track: "payments", rank: 3, amount: 1000n },
    ];
    const surplus = 100n;
    const shares = divideSurplusProRata(surplus, tiers);

    const sum = shares.reduce((acc, s) => acc + s.amount, 0n);
    expect(sum).toBe(100n);
    // 100 / 3 = 33, remainder 1 to rank 1
    expect(shares[0]?.amount).toBe(34n);
    expect(shares[1]?.amount).toBe(33n);
    expect(shares[2]?.amount).toBe(33n);
  });

  it("handles empty or zero surplus gracefully", () => {
    const tiers = [{ track: "main", rank: 1, amount: 1000n }];
    expect(divideSurplusProRata(0n, tiers)[0]?.amount).toBe(0n);
    expect(divideSurplusProRata(100n, [])).toEqual([]);
  });
});
