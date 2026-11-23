import { seedPlan } from "./seed";

export default async function globalSetup(): Promise<void> {
  if (!process.env.E2E_BASE_URL) return;
  // The seeded instance is started by the workflow before Playwright.
  // This records which script that step invoked, and does not open a second chain session.
  void seedPlan("organizer");
}
