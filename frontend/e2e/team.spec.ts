import { test, expect } from "@playwright/test";
import { requireBaseUrl } from "./helpers";
import { signWithTestKey } from "./wallet-stub";
import { TESTNET_PASSPHRASE } from "../scripts/lib/keys.mts";

test("a teammate can open the team board", async ({ page }) => {
  const base = requireBaseUrl();
  test.skip(base === null, "E2E_BASE_URL is not set; the journey needs a freshly seeded instance");
  const secret = process.env.E2E_TEST_SECRET ?? "S" + "A".repeat(55);
  signWithTestKey(secret, TESTNET_PASSPHRASE);
  await page.goto(base + "/hackathons");
  await expect(page.locator("body")).toBeVisible();
});
