/**
 * A single doctor finding.
 *
 * `class` is the failure class an operator keys on when reading a non-zero
 * exit: env, network, rpc, contracts, or funding. Specific messages live in
 * `message` so a script can match the class without parsing prose.
 */
export type FailureClass = "env" | "network" | "rpc" | "contracts" | "funding";

export interface CheckResult {
  ok: boolean;
  class: FailureClass;
  /** Short label printed before the message, e.g. STELLAR_RPC_URL. */
  name: string;
  message: string;
}

export interface DoctorReport {
  service: string;
  results: CheckResult[];
}

/** True when every check passed. */
export function reportOk(report: DoctorReport): boolean {
  return report.results.every((result) => result.ok);
}

/**
 * Formats the report for a terminal.
 *
 * Pass lines stay quiet enough to scan; failures lead with the class so an
 * operator can grep for `env:` or `funding:` without reading every line.
 */
export function formatReport(report: DoctorReport): string {
  const lines: string[] = [`doctor: ${report.service}`];

  for (const result of report.results) {
    if (result.ok) {
      lines.push(`  ok  ${result.name}: ${result.message}`);
    } else {
      lines.push(`  FAIL ${result.class}: ${result.name}: ${result.message}`);
    }
  }

  const failed = report.results.filter((result) => !result.ok);
  if (failed.length === 0) {
    lines.push("all checks passed");
  } else {
    lines.push(`${failed.length} check(s) failed`);
  }

  return lines.join("\n");
}

/** Prints the report and returns the process exit code (0 or 1). */
export function printReport(report: DoctorReport): number {
  const text = formatReport(report);
  if (reportOk(report)) {
    console.log(text);
    return 0;
  }
  console.error(text);
  return 1;
}

export function pass(klass: FailureClass, name: string, message: string): CheckResult {
  return { ok: true, class: klass, name, message };
}

export function fail(klass: FailureClass, name: string, message: string): CheckResult {
  return { ok: false, class: klass, name, message };
}
