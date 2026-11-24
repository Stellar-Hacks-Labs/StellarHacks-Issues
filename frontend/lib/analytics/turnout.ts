export interface Turnout {
  eligible: number;
  ballots: number;
}
export function turnoutPercent(value: Turnout) {
  return value.eligible === 0
    ? 0
    : Math.round((value.ballots / value.eligible) * 100);
}
