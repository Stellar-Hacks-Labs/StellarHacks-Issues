import type { Funnel } from "./funnel";
import type { JudgeProgress } from "./judges";
import type { Turnout } from "./turnout";
export interface OrganizerAnalytics {
  funnel: Funnel;
  judges: JudgeProgress;
  turnout: Turnout;
}
export function shapeAnalytics(
  funnel: Partial<Funnel> | null,
  judges: Partial<JudgeProgress> | null,
  turnout: Partial<Turnout> | null,
): OrganizerAnalytics {
  return {
    funnel: {
      applications: Number(funnel?.applications ?? 0),
      approved: Number(funnel?.approved ?? 0),
      submissions: Number(funnel?.submissions ?? 0),
    },
    judges: {
      expected: Number(judges?.expected ?? 0),
      completed: Number(judges?.completed ?? 0),
    },
    turnout: {
      eligible: Number(turnout?.eligible ?? 0),
      ballots: Number(turnout?.ballots ?? 0),
    },
  };
}
