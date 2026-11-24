export const CHECKPOINT_INTERVAL = 100;
export function checkpointDue(sequence: number): boolean {
  return sequence > 0 && sequence % CHECKPOINT_INTERVAL === 0;
}
