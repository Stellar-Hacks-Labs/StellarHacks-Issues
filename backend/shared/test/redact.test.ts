import { describe, it, expect } from "vitest";
import { redact, redactObject } from "../src/redact.js";

describe("Redaction", () => {
  it("redacts Stellar secret seeds", () => {
    const seed = "SAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    const out = redact(`Signing using seed ${seed} failed`);
    expect(out).not.toContain(seed);
    expect(out).toContain("[REDACTED_SECRET_SEED]");
  });

  it("redacts JWTs and service role keys", () => {
    const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakThisSecretSignature123";
    const out = redact(`Bearer ${jwt}`);
    expect(out).not.toContain(jwt);
    expect(out).toContain("[REDACTED_JWT]");
  });

  it("redacts database URLs containing user credentials", () => {
    const dbUrl = "postgresql://postgres:mysecretpassword@db.supabase.co:5432/postgres";
    const out = redact(`Connecting to ${dbUrl}`);
    expect(out).not.toContain("mysecretpassword");
    expect(out).toContain("[REDACTED_DATABASE_URL]");
  });

  it("redacts sensitive fields in nested metadata objects", () => {
    const meta = {
      user: "worker_1",
      privateKey: "0123456789abcdef0123456789abcdef",
      nested: {
        token: "secret_token_123",
      },
    };
    const redacted = redactObject(meta);
    expect(redacted.user).toBe("worker_1");
    expect(redacted.privateKey).toBe("[REDACTED]");
    expect(redacted.nested.token).toBe("[REDACTED]");
  });
});
