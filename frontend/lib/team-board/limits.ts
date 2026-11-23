/**
 * Bounds for a listing.
 *
 * A listing that can name dozens of skills stops being a role and becomes a
 * resume. Eight skills and four open roles is enough to say what the team
 * needs. The note is a short message, not a second project description.
 */
export const TEAM_BOARD_LIMITS = {
  maxSkills: 8,
  maxRoles: 4,
  maxNote: 280,
  maxListingsPerTeam: 1,
} as const;

export function withinLimits(input: { skills: string[]; roles: string[]; note: string }): string | null {
  if (input.skills.length > TEAM_BOARD_LIMITS.maxSkills) return "too many skills";
  if (input.roles.length > TEAM_BOARD_LIMITS.maxRoles) return "too many roles";
  if (input.note.length > TEAM_BOARD_LIMITS.maxNote) return "note is too long";
  return null;
}
