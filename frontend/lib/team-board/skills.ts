/** Skills the seed publishes. A free-typed skill is still stored; this list is the filter. */
export const SKILL_CATALOG = [
  "soroban",
  "frontend",
  "design",
  "solidity",
  "writing",
  "mobile",
] as const;

export type Skill = (typeof SKILL_CATALOG)[number];

export function knownSkill(value: string): value is Skill {
  return (SKILL_CATALOG as readonly string[]).includes(value);
}
