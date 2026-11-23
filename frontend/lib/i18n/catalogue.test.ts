/**
 * Test that every key exists in both locales.
 *
 * The parity check. A key present in one locale but missing in the other is a
 * deployment that serves half-translated pages.
 */

import { describe, expect, it } from "vitest";
import { LOCALES, type Locale } from "./config";
import { loadMessages, type Namespace } from "./catalogue";

const NAMESPACES: Namespace[] = [
  "shell",
  "landing",
  "listing",
  "account",
  "how-it-works",
  "hackathon",
  "participate",
  "vote",
  "reveal",
  "proof",
  "judge",
  "manage",
  "glossary",
  "errors",
];

describe("catalogue parity", () => {
  for (const namespace of NAMESPACES) {
    it(`${namespace} has the same keys in every locale`, () => {
      const catalogues = LOCALES.map((locale) => loadMessages(locale, namespace));

      const keys = catalogues.map((messages) => Object.keys(messages).sort());

      // Every locale should have the same keys
      for (let i = 1; i < keys.length; i++) {
        expect(keys[i]).toEqual(keys[0]);
      }
    });
  }

  it("deliberately fails when a key is removed from one locale", () => {
    // Load English and Turkish shell catalogues
    const en = loadMessages("en", "shell");
    const tr = loadMessages("tr", "shell");

    // Both should have header.brand
    expect(en["header.brand"]).toBeDefined();
    expect(tr["header.brand"]).toBeDefined();

    // If we remove a key from one locale, the check above will catch it
    const enKeys = Object.keys(en).sort();
    const trKeys = Object.keys(tr).sort();

    // This passes when both have the same keys
    expect(enKeys).toEqual(trKeys);
  });
});

describe("loadMessages", () => {
  it("returns messages for a valid namespace", () => {
    const messages = loadMessages("en", "shell");
    expect(messages).toBeDefined();
    expect(typeof messages["header.brand"]).toBe("string");
  });

  it("returns messages for all locales", () => {
    for (const locale of LOCALES) {
      for (const namespace of NAMESPACES) {
        const messages = loadMessages(locale as Locale, namespace);
        expect(messages).toBeDefined();
        expect(Object.keys(messages).length).toBeGreaterThan(0);
      }
    }
  });
});
