import { describe, expect, it } from "vitest";

import {
  fail,
  formatReport,
  pass,
  reportOk,
  type DoctorReport,
} from "../../src/doctor/report.js";

/**
 * Report formatting puts the failure class where an operator can grep it.
 *
 * The property under defence is that a failing report is not ok, and each
 * failure line leads with `FAIL <class>:` rather than burying the class.
 */
describe("doctor report", () => {
  it("is ok only when every check passed", () => {
    const report: DoctorReport = {
      service: "indexer",
      results: [pass("env", "A", "set"), fail("rpc", "STELLAR_RPC_URL", "unreachable")],
    };

    expect(reportOk(report)).toBe(false);
    expect(formatReport(report)).toMatch(/FAIL rpc:/);
    expect(formatReport(report)).toMatch(/1 check\(s\) failed/);
  });

  it("summarises a clean report", () => {
    const report: DoctorReport = {
      service: "clock",
      results: [pass("env", "A", "set")],
    };

    expect(reportOk(report)).toBe(true);
    expect(formatReport(report)).toMatch(/all checks passed/);
  });
});
