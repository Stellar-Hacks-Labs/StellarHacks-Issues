export async function transitionStillDue(readPhase: () => Promise<number>, expected: number) {
  return (await readPhase()) === expected;
}
