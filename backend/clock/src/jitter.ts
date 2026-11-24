export function jitter(delayMs: number, random = Math.random): number {
  return Math.max(0, Math.round(delayMs * (0.75 + random() * 0.5)));
}
