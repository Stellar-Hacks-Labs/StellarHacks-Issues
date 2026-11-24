import { describe, expect, it } from "vitest";

import { isSensitiveKey, redact, REDACTION_MARKER } from "../src/redact.js";

/**
 * No log line may carry a secret key, service role key, or seed.
 *
 * The redactor is the only gate between process memory and stdout, so these
 * names are the ones that must disappear even when nested under another field.
 */
describe("redaction of secrets", () => {
  it("marks secret keys, service role keys and seeds so they never reach a log line", () => {
    const cleaned = redact({
      msg: "tick",
      clockSecret: "SCRETSEEDVALUE000000000000000000000000000000000000000000",
      SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service",
      serviceRoleKey: "role-key-material",
      seed: "sown-in-soil",
      secret: "top-secret",
      nested: {
        private_key: "still-secret",
        contract: "CCQ7LAZ7TH3DPWK3MCL2JFOM3JLMK6UKFTOMR2TERRXVLYBZ55LEHHNB",
      },
    }) as Record<string, unknown>;

    expect(cleaned["clockSecret"]).toBe(REDACTION_MARKER);
    expect(cleaned["SUPABASE_SERVICE_ROLE_KEY"]).toBe(REDACTION_MARKER);
    expect(cleaned["serviceRoleKey"]).toBe(REDACTION_MARKER);
    expect(cleaned["seed"]).toBe(REDACTION_MARKER);
    expect(cleaned["secret"]).toBe(REDACTION_MARKER);
    expect((cleaned["nested"] as Record<string, unknown>)["private_key"]).toBe(REDACTION_MARKER);
    expect((cleaned["nested"] as Record<string, unknown>)["contract"]).toBe(
      "CCQ7LAZ7TH3DPWK3MCL2JFOM3JLMK6UKFTOMR2TERRXVLYBZ55LEHHNB",
    );
    expect(JSON.stringify(cleaned)).not.toContain("SCRETSEEDVALUE");
    expect(JSON.stringify(cleaned)).not.toContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
    expect(JSON.stringify(cleaned)).not.toContain("role-key-material");
    expect(JSON.stringify(cleaned)).not.toContain("sown-in-soil");
  });

  it("recognises the key names operators commonly put in env files", () => {
    expect(isSensitiveKey("CLOCK_SECRET_KEY")).toBe(true);
    expect(isSensitiveKey("apiKey")).toBe(true);
    expect(isSensitiveKey("authorization")).toBe(true);
    expect(isSensitiveKey("contractId")).toBe(false);
  });
});
