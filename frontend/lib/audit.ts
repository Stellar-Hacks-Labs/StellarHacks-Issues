import type { AuditCheckpoint } from "@stelhacks/sdk";

export async function latestAuditCheckpoint(contract: string): Promise<AuditCheckpoint | null> {
  const base = process.env["NEXT_PUBLIC_SEALER_URL"];
  if (!base) return null;
  const response = await fetch(`${base}/audit/checkpoints?contract=${encodeURIComponent(contract)}`, { cache: "no-store" });
  if (!response.ok) return null;
  const body = (await response.json()) as { checkpoints?: AuditCheckpoint[] };
  return body.checkpoints?.at(-1) ?? null;
}
