import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Keypair } from "@stellar/stellar-sdk";
import { describe, expect, it } from "vitest";

import { canonicalize, credentialDigest, credentialId, signPayload, toHex, verifyPayload } from "./sign";
import { FIXTURE_SEED } from "./fixtures";

/**
 * The signing scheme, held against the committed fixtures.
 *
 * `sdk/src/credentials/` holds the same scheme, and neither side imports the
 * other: the web application does not depend on that package. So the fixtures
 * in `fixtures/credentials/` are the contract between them — they were signed
 * by the SDK, and this suite reproduces their signatures here. A change on
 * either side turns a suite red and the files say which side moved.
 */

function fixture(name: string): Record<string, unknown> {
  const path = join(import.meta.dirname, "..", "..", "..", "fixtures", "credentials", `${name}.json`);

  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

function payloadOf(credential: Record<string, unknown>): Record<string, unknown> {
  const { signature, ...payload } = credential;

  void signature;

  return payload;
}

const keypair = Keypair.fromRawEd25519Seed(FIXTURE_SEED);

describe("this side's signatures", () => {
  it("are byte for byte the ones the SDK produced for the committed fixtures", () => {
    for (const name of ["placement", "participation"]) {
      const credential = fixture(name);

      expect(signPayload(payloadOf(credential), keypair), name).toBe(credential["signature"]);
    }
  });

  it("verify against the key the fixtures name", () => {
    const credential = fixture("placement");

    expect(
      verifyPayload(payloadOf(credential), String(credential["signature"]), keypair.publicKey()),
    ).toBe(true);
  });

  it("do not verify for the tampered fixture, whose claim was edited", () => {
    const credential = fixture("tampered");

    expect(
      verifyPayload(payloadOf(credential), String(credential["signature"]), keypair.publicKey()),
    ).toBe(false);
  });
});

describe("the canonical form", () => {
  it("sorts keys, so a reformatted credential still verifies", () => {
    const credential = fixture("placement");
    const reordered = {
      issuer: credential["issuer"],
      evidence: credential["evidence"],
      claim: credential["claim"],
      subject: credential["subject"],
      version: credential["version"],
    };

    expect(canonicalize(reordered)).toBe(canonicalize(payloadOf(credential)));
    expect(verifyPayload(reordered, String(credential["signature"]), keypair.publicKey())).toBe(true);
  });

  it("has no whitespace, so a formatter cannot change the digest", () => {
    expect(canonicalize(payloadOf(fixture("placement")))).not.toMatch(/\n|\s{2}/);
  });

  it("drops undefined rather than letting key order decide the bytes", () => {
    expect(canonicalize({ a: 1, b: undefined })).toBe('{"a":1}');
  });
});

describe("a credential's id", () => {
  it("is its digest as hex, and changes with any field", () => {
    const credential = payloadOf(fixture("placement"));
    const edited = { ...credential, claim: { ...(credential["claim"] as object), rank: 2 } };

    expect(credentialId(credential)).toMatch(/^[0-9a-f]{64}$/);
    expect(credentialId(edited)).not.toBe(credentialId(credential));
    expect(toHex(credentialDigest(credential))).toBe(credentialId(credential));
  });
});

describe("a signature that cannot be used", () => {
  it("is refused rather than throwing, because it arrived in a paste", () => {
    const credential = payloadOf(fixture("placement"));

    for (const signature of ["", "nope", "ab", "zz".repeat(64), "ab".repeat(100)]) {
      expect(verifyPayload(credential, signature, keypair.publicKey()), signature.length.toString()).toBe(false);
    }
  });

  it("is refused for a key id that is not a key", () => {
    const credential = fixture("placement");

    expect(verifyPayload(payloadOf(credential), String(credential["signature"]), "GNOPE")).toBe(false);
  });

  it("is refused when a stranger's key is offered for our signature", () => {
    const credential = fixture("placement");

    expect(
      verifyPayload(payloadOf(credential), String(credential["signature"]), Keypair.random().publicKey()),
    ).toBe(false);
  });
});
