import { expect, it } from "vitest";
import { notificationKey } from "../src/notify/dedupe.js";
it("produces the same dedupe key when an event is replayed", () => { expect(notificationKey("C", 1, 2, "U", "x")).toBe(notificationKey("C", 1, 2, "U", "x")); });
