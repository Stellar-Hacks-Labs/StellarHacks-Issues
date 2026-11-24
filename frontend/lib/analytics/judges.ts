export interface JudgeProgress {
  expected: number;
  completed: number;
}
export function judgePercent(value: JudgeProgress) {
  return value.expected === 0
    ? 0
    : Math.round((value.completed / value.expected) * 100);
}
