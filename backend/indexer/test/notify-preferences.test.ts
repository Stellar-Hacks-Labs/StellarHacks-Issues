import { expect, it } from "vitest";
import { preferenceAllows } from "../src/notify/preferences.js";
it("suppresses only the matching notification type", () => { expect(preferenceAllows({ judging_open: false }, "judging_open")).toBe(false); expect(preferenceAllows({ judging_open: false }, "results_revealed")).toBe(true); });
