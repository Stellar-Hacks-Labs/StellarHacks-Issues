/**
 * Test glossary functions for phase names, roles, and verdicts.
 *
 * Ensures consistent terminology across surfaces.
 */

import { describe, expect, it } from "vitest";
import { phaseName, journeyTitle, roleName, verdictLabel } from "./glossary";
import { LOCALES } from "./config";

describe("phaseName", () => {
  it("returns phase names for valid phase numbers", () => {
    for (const locale of LOCALES) {
      expect(phaseName(0, locale)).toBeTruthy(); // Draft
      expect(phaseName(1, locale)).toBeTruthy(); // Funding
      expect(phaseName(2, locale)).toBeTruthy(); // Open
      expect(phaseName(8, locale)).toBeTruthy(); // Completed
    }
  });

  it("returns different translations for different locales", () => {
    const enDraft = phaseName(0, "en");
    const trDraft = phaseName(0, "tr");

    expect(enDraft).not.toBe(trDraft);
    expect(enDraft).toBe("Draft");
    expect(trDraft).toBe("Taslak");
  });

  it("handles null phase", () => {
    for (const locale of LOCALES) {
      const name = phaseName(null, locale);
      expect(name).toBeTruthy();
      expect(name).not.toBe("Unknown");
    }
  });

  it("handles unknown phase numbers", () => {
    for (const locale of LOCALES) {
      const name = phaseName(999, locale);
      expect(name).toBeTruthy();
    }
  });
});

describe("journeyTitle", () => {
  it("returns journey step titles", () => {
    for (const locale of LOCALES) {
      expect(journeyTitle(0, locale)).toBeTruthy(); // Setup
      expect(journeyTitle(1, locale)).toBeTruthy(); // Sign-ups
      expect(journeyTitle(5, locale)).toBeTruthy(); // Payouts
    }
  });

  it("returns different translations for different locales", () => {
    const enSetup = journeyTitle(0, "en");
    const trSetup = journeyTitle(0, "tr");

    expect(enSetup).not.toBe(trSetup);
    expect(enSetup).toBe("Setup");
    expect(trSetup).toBe("Kurulum");
  });

  it("returns empty string for invalid indices", () => {
    expect(journeyTitle(-1, "en")).toBe("");
    expect(journeyTitle(999, "en")).toBe("");
  });
});

describe("roleName", () => {
  it("returns role names", () => {
    for (const locale of LOCALES) {
      expect(roleName("organizer", locale)).toBeTruthy();
      expect(roleName("judge", locale)).toBeTruthy();
      expect(roleName("participant", locale)).toBeTruthy();
      expect(roleName("observer", locale)).toBeTruthy();
    }
  });

  it("returns different translations for different locales", () => {
    const enJudge = roleName("judge", "en");
    const trJudge = roleName("judge", "tr");

    expect(enJudge).not.toBe(trJudge);
    expect(enJudge).toBe("Judge");
    expect(trJudge).toBe("Hakem");
  });
});

describe("verdictLabel", () => {
  it("returns verdict labels", () => {
    for (const locale of LOCALES) {
      expect(verdictLabel("verified", locale)).toBeTruthy();
      expect(verdictLabel("does_not_match", locale)).toBeTruthy();
      expect(verdictLabel("unchecked", locale)).toBeTruthy();
      expect(verdictLabel("not_available", locale)).toBeTruthy();
    }
  });

  it("returns different translations for different locales", () => {
    const enVerified = verdictLabel("verified", "en");
    const trVerified = verdictLabel("verified", "tr");

    expect(enVerified).not.toBe(trVerified);
    expect(enVerified).toBe("Verified");
    expect(trVerified).toBe("Doğrulandı");
  });
});
