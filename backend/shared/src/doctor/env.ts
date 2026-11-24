import { fail, pass, type CheckResult } from "./report.js";

/**
 * Confirms every named variable is present and non-empty.
 *
 * Empty strings from a copied `.env.example` are treated as missing: several
 * services already learned that `X=""` reads as zero or as an empty loop
 * wait, and the doctor should catch that before the process starts.
 */
export function checkRequiredEnv(
  names: readonly string[],
  env: NodeJS.ProcessEnv = process.env,
): CheckResult[] {
  return names.map((name) => {
    const value = env[name];
    if (value === undefined || value === "") {
      return fail(
        "env",
        name,
        `is not set. See backend/.env.example.`,
      );
    }
    return pass("env", name, "set");
  });
}

/** True when a variable is present and non-empty. */
export function envPresent(name: string, env: NodeJS.ProcessEnv = process.env): boolean {
  const value = env[name];
  return value !== undefined && value !== "";
}

/** Returns the value or throws — for callers that already passed checkRequiredEnv. */
export function requireEnv(name: string, env: NodeJS.ProcessEnv = process.env): string {
  const value = env[name];
  if (value === undefined || value === "") {
    throw new Error(`${name} is not set`);
  }
  return value;
}
