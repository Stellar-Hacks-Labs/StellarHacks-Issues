import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { verify } from "./verify-form";

/**
 * What a reader is told, for each thing they might paste.
 *
 * The committed fixtures are the real cases: one honest credential and one with
 * a field edited and the signature left alone. The property worth defending is
 * that the page never conflates "we signed it" with "it is true" — so the
 * signature outcome and the evidence links are separate fields, and a forged
 * credential is refused on the signature rather than on a guess.
 */

function fixture(name: string): Record<string, unknown> {
  const path = join(import.meta.dirname, "..", "..", "..", "fixtures", "credentials", `${name}.json`);

  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

const placement = fixture("placement");
const OUR_KEY = String((placement["issuer"] as Record<string, unknown>)["keyId"]);

describe("an honest credential", () => {
  const outcome = verify(JSON.stringify(placement), OUR_KEY);

  it("passes the signature check in the browser, with no request to us", () => {
    expect(outcome.ok).toBe(true);
    expect(outcome.signature).toMatchObject({ valid: true, keyId: OUR_KEY });
    expect(outcome.issuedByUs).toBe(true);
  });

  it("hands the claim and the evidence back for the page to lay out", () => {
    expect(outcome.claim).toMatchObject({ kind: "placement", rank: 1, track: "ai" });
    expect(outcome.evidence).toMatchObject({ payoutTxHash: "ab".repeat(32) });
    expect(outcome.subject).toMatchObject({ username: "ada" });
  });

  it("says the signer is somebody else when the key id is not ours", () => {
    const elsewhere = verify(JSON.stringify(placement), "GA3A3NY4VLTTUPJCJSTJ457KAOXKPZ3PQER4M2F5TQRFG5TTNEOBQZ3K");

    /* Still a valid signature, and still not ours. Keeping the two apart is the
       whole point: "valid" alone would let anybody mint credentials. */
    expect(elsewhere.signature?.valid).toBe(true);
    expect(elsewhere.issuedByUs).toBe(false);
  });

  it("says there is nothing to compare against when this deployment publishes no key", () => {
    expect(verify(JSON.stringify(placement), null).issuedByUs).toBeNull();
  });
});

describe("a credential with a field edited", () => {
  it("fails on the signature, and says what that means", () => {
    const outcome = verify(JSON.stringify(fixture("tampered")), OUR_KEY);

    expect(outcome.ok).toBe(false);
    expect(outcome.signature?.valid).toBe(false);
    expect(outcome.signature?.says).toContain("A field has changed");
  });

  it("still shows the claim and the links, so a reader can see what was asserted", () => {
    const outcome = verify(JSON.stringify(fixture("tampered")), OUR_KEY);

    expect(outcome.claim).not.toBeNull();
    expect(outcome.evidence).not.toBeNull();
  });
});

describe("a paste that is not one credential", () => {
  it("is refused as not JSON", () => {
    expect(verify("{nope", OUR_KEY).format).toEqual([{ field: "$", says: "is not JSON" }]);
  });

  it("asks for one credential rather than verdicting a whole list", () => {
    // An export is a list. One verdict over many credentials would hide a
    // single forged entry among the honest ones.
    const outcome = verify(JSON.stringify([placement, placement]), OUR_KEY);

    expect(outcome.format[0]?.says).toContain("paste one of them on its own");
  });

  it("is refused when it is not an object at all", () => {
    for (const pasted of ["null", '"a credential"', "7"]) {
      expect(verify(pasted, OUR_KEY).format.length, pasted).toBeGreaterThan(0);
    }
  });

  it("names every field that is wrong before any signature is attempted", () => {
    const broken = {
      ...placement,
      version: "stelhacks.credential.v2",
      signature: "nope",
      issuer: { keyId: "GNOPE", signedAt: "2026-11-21T10:00:00.000Z" },
    };
    const outcome = verify(JSON.stringify(broken), OUR_KEY);

    expect(outcome.format.map((problem) => problem.field)).toEqual([
      "version",
      "signature",
      "issuer.keyId",
    ]);
    expect(outcome.signature).toBeNull();
  });

  it("refuses an evidence digest that is not a digest", () => {
    const broken = {
      ...placement,
      evidence: { ...(placement["evidence"] as object), payoutTxHash: "soon" },
    };

    expect(verify(JSON.stringify(broken), OUR_KEY).format.map((p) => p.field)).toEqual([
      "evidence.payoutTxHash",
    ]);
  });
});
