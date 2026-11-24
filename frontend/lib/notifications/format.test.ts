import { expect, it } from "vitest";
import { notificationTime } from "./format";
it("formats notification age without exposing locale variance", () => {
  expect(
    notificationTime(
      "2026-01-01T00:00:00Z",
      Date.parse("2026-01-01T00:05:00Z"),
    ),
  ).toBe("5m ago");
});
