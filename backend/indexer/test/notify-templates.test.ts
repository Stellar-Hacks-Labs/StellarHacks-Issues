import { expect, it } from "vitest";
import { notificationCopy } from "../src/notify/templates.js";
it("provides user-facing copy for every mapped type", () => { expect(notificationCopy("prize_payable")).toContain("prize"); });
