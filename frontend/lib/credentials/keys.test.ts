import { Keypair } from "@stellar/stellar-sdk";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { CredentialKeyError, issuedByUs, keyId, signingConfigured, signingKeypair } from "./keys";

/**
 * The one rule about the signing key: it never reaches the browser.
 *
 * Two things enforce it and both are tested here. The variable has no
 * `NEXT_PUBLIC_` prefix, so Next never inlines it into a client bundle — that
 * is a build-time property and the test for it is that nothing in this module
 * reads a public variable for the secret. And `signingKeypair` throws when
 * `window` exists, which is what fails loudly if a refactor ever pulls this
 * into a client component.
 */

const SECRET = "STELHACKS_CREDENTIAL_SECRET";
const PUBLIC = "NEXT_PUBLIC_STELHACKS_CREDENTIAL_KEY_ID";
const keypair = Keypair.fromRawEd25519Seed(Buffer.alloc(32, 9));

let heldSecret: string | undefined;
let heldPublic: string | undefined;

beforeEach(() => {
  heldSecret = process.env[SECRET];
  heldPublic = process.env[PUBLIC];
  delete process.env[SECRET];
  delete process.env[PUBLIC];
  /* This suite runs in a DOM environment, where `window` exists by default.
     Server behaviour is the default being tested, so it is removed here and
     put back by the tests that are about a browser. */
  Reflect.deleteProperty(globalThis, "window");
});

afterEach(() => {
  if (heldSecret === undefined) delete process.env[SECRET];
  else process.env[SECRET] = heldSecret;
  if (heldPublic === undefined) delete process.env[PUBLIC];
  else process.env[PUBLIC] = heldPublic;
  Reflect.deleteProperty(globalThis, "window");
});

describe("a deployment with no signing key", () => {
  it("says so rather than issuing an unsigned credential", () => {
    expect(signingConfigured()).toBe(false);
    expect(() => signingKeypair()).toThrowError(CredentialKeyError);
    expect(() => signingKeypair()).toThrowError(/cannot sign credentials/);
  });

  it("publishes no key id", () => {
    expect(keyId()).toBeNull();
    expect(issuedByUs(keypair.publicKey())).toBe(false);
  });
});

describe("a deployment with one", () => {
  beforeEach(() => {
    process.env[SECRET] = keypair.secret();
  });

  it("signs with it and publishes its public half as the key id", () => {
    expect(signingConfigured()).toBe(true);
    expect(signingKeypair().publicKey()).toBe(keypair.publicKey());
    expect(keyId()).toBe(keypair.publicKey());
  });

  it("recognizes its own credentials and nobody else's", () => {
    expect(issuedByUs(keypair.publicKey())).toBe(true);
    expect(issuedByUs(Keypair.random().publicKey())).toBe(false);
  });

  it("refuses a secret that is not a Stellar seed", () => {
    process.env[SECRET] = "not-a-seed";

    expect(() => signingKeypair()).toThrowError(/not a Stellar secret seed/);
  });
});

describe("the key in a browser", () => {
  it("is unreachable: the keypair refuses to exist where window does", () => {
    process.env[SECRET] = keypair.secret();
    Reflect.set(globalThis, "window", {});

    expect(() => signingKeypair()).toThrowError(/server side only/);
  });

  it("still lets a browser learn which key id to expect, from the public variable", () => {
    process.env[PUBLIC] = keypair.publicKey();
    Reflect.set(globalThis, "window", {});

    /* The id is the public half and is safe anywhere. A page that could not
       read it would have to ask the server which key signed, which is the
       question a reader is trying to answer independently. */
    expect(keyId()).toBe(keypair.publicKey());
    expect(issuedByUs(keypair.publicKey())).toBe(true);
  });

  it("does not fall back to deriving the id from a secret in a browser", () => {
    process.env[SECRET] = keypair.secret();
    Reflect.set(globalThis, "window", {});

    expect(keyId()).toBeNull();
  });

  it("ignores a published key id that is not a public key", () => {
    process.env[PUBLIC] = keypair.secret();

    /* A deployment that pasted the secret into the public variable must not
       have it echoed back as a key id — and the secret is not a valid public
       key, so it is refused rather than published. */
    expect(keyId()).toBeNull();
  });
});
