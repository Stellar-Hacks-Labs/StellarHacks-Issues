export function raisedFee(currentStroops: number, ceilingStroops: number): number {
  return Math.min(ceilingStroops, Math.max(currentStroops + 1, Math.ceil(currentStroops * 1.5)));
}
