import { afterEach, describe, expect, it, vi } from "vitest";

import { newCorrelationId, withCorrelationId } from "../src/correlation.js";
import { createLogger } from "../src/log.js";
import { REDACTION_MARKER } from "../src/redact.js";

/**
 * Structured lines are JSON, carry the service name, and never print secrets.
 */
describe("structured logging", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes one JSON object per line with level, service and message", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const log = createLogger("indexer");

    log.info("ingested", { events: 3, clockSecret: "must-not-appear" });

    expect(info).toHaveBeenCalledOnce();
    const line = JSON.parse(String(info.mock.calls[0]![0])) as Record<string, unknown>;

    expect(line["level"]).toBe("info");
    expect(line["service"]).toBe("indexer");
    expect(line["msg"]).toBe("ingested");
    expect(line["events"]).toBe(3);
    expect(line["clockSecret"]).toBe(REDACTION_MARKER);
    expect(typeof line["ts"]).toBe("string");
    expect(JSON.stringify(line)).not.toContain("must-not-appear");
  });

  it("stamps the correlation id bound for the current tick", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const log = createLogger("clock");
    const id = newCorrelationId();

    withCorrelationId(id, () => {
      log.info("lap");
    });

    const line = JSON.parse(String(info.mock.calls[0]![0])) as Record<string, unknown>;
    expect(line["correlationId"]).toBe(id);
  });
});
