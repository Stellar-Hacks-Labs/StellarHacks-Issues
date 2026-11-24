import {
  FieldRule,
  ProjectVisibility,
  RefundRoute,
  RegistrationPolicy,
  type Constitution,
} from "hackathon-core";

import { hashConstitution } from "../hashing.js";
import { toHex } from "../hex.js";
import { compareCheck, type Check } from "./compare.js";

/**
 * Prove the rules being served are the rules that were locked.
 *
 * Everything downstream is only meaningful once this check passes: a ranking
 * derived from the wrong constitution is a coherent lie rather than a proof.
 */

export interface ConstitutionSnapshot {
  constitution: Constitution;
  /** Hex digest published on chain (or in the fixture). */
  publishedHash: string;
}

export function checkConstitution(snapshot: ConstitutionSnapshot): Check {
  const derived = toHex(hashConstitution(snapshot.constitution));

  return compareCheck("constitution.hash", derived, normalizeHex(snapshot.publishedHash));
}

export function normalizeHex(value: string | Uint8Array | Buffer): string {
  if (typeof value === "string") {
    return value.trim().toLowerCase().replace(/^0x/, "");
  }

  return toHex(value instanceof Uint8Array ? value : new Uint8Array(value));
}

/**
 * Rehydrate a constitution that round-tripped through JSON.
 *
 * Digests and amounts leave JSON as arrays and strings; the XDR encoder needs
 * Buffer and bigint again before a hash comparison means anything.
 */
export function reviveConstitution(raw: unknown): Constitution {
  if (raw === null || typeof raw !== "object") {
    throw new Error("constitution must be an object");
  }

  const body = structuredClone(raw) as Record<string, unknown>;

  body["metadata_hash"] = asBuffer(body["metadata_hash"]);
  body["visibility"] = asEnum(body["visibility"], ProjectVisibility);
  body["registration"] = asEnum(body["registration"], RegistrationPolicy);

  const requirements = body["submission_requirements"] as Record<string, unknown>;
  for (const key of Object.keys(requirements)) {
    requirements[key] = asEnum(requirements[key], FieldRule);
  }

  const tiers = body["prize_tiers"] as Record<string, unknown>[];
  for (const tier of tiers) {
    tier["amount"] = asBigInt(tier["amount"]);
  }

  const sponsorship = body["sponsorship"] as Record<string, unknown>;
  sponsorship["min_bounty"] = asBigInt(sponsorship["min_bounty"]);

  const schedule = body["schedule"] as Record<string, unknown>;
  for (const key of Object.keys(schedule)) {
    schedule[key] = asBigInt(schedule[key]);
  }

  const extensions = body["extensions"] as Record<string, unknown>;
  extensions["max_total_seconds_per_deadline"] = asBigInt(
    extensions["max_total_seconds_per_deadline"],
  );

  const discretion = body["discretion"] as Record<string, unknown>;
  discretion["appeal_window"] = asBigInt(discretion["appeal_window"]);
  discretion["prize_claim_period"] = asBigInt(discretion["prize_claim_period"]);
  discretion["unclaimed_refund"] = asEnum(discretion["unclaimed_refund"], RefundRoute);
  discretion["no_award_refund"] = asEnum(discretion["no_award_refund"], RefundRoute);
  discretion["cancellation_refund"] = asEnum(discretion["cancellation_refund"], RefundRoute);

  const settlement = discretion["settlement"] as { tag: string; values?: unknown[] };
  if (Array.isArray(settlement.values)) {
    settlement.values = settlement.values.map(asBigInt);
  }

  return body as unknown as Constitution;
}

function asBuffer(value: unknown): Buffer {
  if (Buffer.isBuffer(value)) {
    return value;
  }

  if (value instanceof Uint8Array) {
    return Buffer.from(value);
  }

  if (typeof value === "string") {
    return Buffer.from(value.replace(/^0x/, ""), "hex");
  }

  if (Array.isArray(value)) {
    return Buffer.from(value as number[]);
  }

  // Node's JSON.stringify(Buffer) shape.
  if (
    value !== null &&
    typeof value === "object" &&
    (value as { type?: string }).type === "Buffer" &&
    Array.isArray((value as { data?: unknown }).data)
  ) {
    return Buffer.from((value as { data: number[] }).data);
  }

  throw new Error("metadata_hash must be bytes");
}

function asBigInt(value: unknown): bigint {
  if (typeof value === "bigint") {
    return value;
  }

  if (typeof value === "number" || typeof value === "string") {
    return BigInt(value);
  }

  throw new Error(`cannot convert ${String(value)} to bigint`);
}

function asEnum<T extends Record<string, number | string>>(
  value: unknown,
  table: T,
): T[keyof T] {
  if (typeof value === "number") {
    return value as T[keyof T];
  }

  if (typeof value === "string" && value in table) {
    return table[value as keyof T];
  }

  throw new Error(`unknown enum value ${String(value)}`);
}
