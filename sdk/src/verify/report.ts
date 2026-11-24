import { allOk, disagreements, type Check } from "./compare.js";

/**
 * The verifier's finished answer: every check, and whether any disagreed.
 */

export interface Report {
  contractId: string;
  /** True only when every check passed. */
  ok: boolean;
  checks: Check[];
  disagreements: Check[];
}

export function buildReport(contractId: string, checks: readonly Check[]): Report {
  return {
    contractId,
    ok: allOk(checks),
    checks: [...checks],
    disagreements: disagreements(checks),
  };
}

/** Machine-readable form for piping into other tools. */
export function formatJson(report: Report): string {
  return `${JSON.stringify(report, jsonReplacer, 2)}\n`;
}

/**
 * Human-readable form that names each disagreement without burying it in JSON.
 *
 * A passing run still lists every check so a reader can see what was proved,
 * not only that something passed.
 */
export function formatText(report: Report): string {
  const lines: string[] = [];

  lines.push(`Verifier report for ${report.contractId}`);
  lines.push(report.ok ? "Result: agree" : "Result: disagree");
  lines.push("");
  lines.push("Checks:");

  for (const check of report.checks) {
    const mark = check.ok ? "ok" : "FAIL";
    lines.push(`  [${mark}] ${check.name}`);
    if (!check.ok && check.detail !== undefined) {
      lines.push(`         ${check.detail}`);
      lines.push(`         expected: ${preview(check.expected)}`);
      lines.push(`         actual:   ${preview(check.actual)}`);
    }
  }

  if (!report.ok) {
    lines.push("");
    lines.push(
      `${report.disagreements.length} disagreement(s): ${report.disagreements
        .map((check) => check.name)
        .join(", ")}`,
    );
  }

  return `${lines.join("\n")}\n`;
}

function jsonReplacer(_key: string, value: unknown): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Uint8Array) {
    return Buffer.from(value).toString("hex");
  }

  return value;
}

function preview(value: unknown): string {
  const text = typeof value === "string" ? value : JSON.stringify(value, jsonReplacer);

  if (text === undefined) {
    return String(value);
  }

  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
}
