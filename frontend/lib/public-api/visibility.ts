import type {
  PublicHackathon,
  PublicProject,
  PublicMember,
  PublicResult,
  PublicRanking,
} from './schemas';

const FORBIDDEN_PRIVATE_KEYS = [
  'email',
  'phone',
  'password',
  'secret',
  'private_key',
  'privateKey',
  'auth_id',
  'userId',
  'session',
  'token',
  'kyc',
  'tlock_secret',
  'tlockSecret',
];

/**
 * Sanitizes a team member to ensure NO private fields (email, credentials, private keys)
 * ever leak through the public API.
 */
export function sanitizeMember(raw: Record<string, unknown>): PublicMember {
  // Strip any accidental private fields
  return {
    address: String(raw.address || ''),
    captain: Boolean(raw.captain),
    displayName: typeof raw.displayName === 'string' ? raw.displayName : (typeof raw.display_name === 'string' ? raw.display_name : null),
    username: typeof raw.username === 'string' ? raw.username : null,
    avatarUrl: typeof raw.avatarUrl === 'string' ? raw.avatarUrl : (typeof raw.avatar_url === 'string' ? raw.avatar_url : null),
  };
}

/**
 * Sanitizes a project and all its nested members.
 */
export function sanitizeProject(raw: Record<string, unknown>): PublicProject {
  const membersRaw = Array.isArray(raw.members) ? raw.members : [];
  const members = membersRaw.map((m) => sanitizeMember(m as Record<string, unknown>));

  return {
    teamId: Number(raw.teamId ?? raw.team_id ?? 0),
    contractId: String(raw.contractId ?? raw.contract_id ?? ''),
    title: String(raw.title || ''),
    summary: typeof raw.summary === 'string' ? raw.summary : null,
    description: typeof raw.description === 'string' ? raw.description : null,
    logoUrl: typeof raw.logoUrl === 'string' ? raw.logoUrl : (typeof raw.logo_url === 'string' ? raw.logo_url : null),
    bannerUrl: typeof raw.bannerUrl === 'string' ? raw.bannerUrl : (typeof raw.banner_url === 'string' ? raw.banner_url : null),
    repositoryUrl: typeof raw.repositoryUrl === 'string' ? raw.repositoryUrl : (typeof raw.repository_url === 'string' ? raw.repository_url : null),
    liveUrl: typeof raw.liveUrl === 'string' ? raw.liveUrl : (typeof raw.live_url === 'string' ? raw.live_url : null),
    demoVideoUrl: typeof raw.demoVideoUrl === 'string' ? raw.demoVideoUrl : (typeof raw.demo_video_url === 'string' ? raw.demo_video_url : null),
    teamName: typeof raw.teamName === 'string' ? raw.teamName : (typeof raw.team_name === 'string' ? raw.team_name : null),
    members,
  };
}

/**
 * Sanitizes rankings ensuring unrevealed scores are completely redacted.
 * When judging has not completed or results are still sealed/unrevealed,
 * score MUST be null.
 */
export function sanitizeRankings(
  rawRankings: Array<Record<string, unknown>>,
  forceUnrevealed = false
): PublicRanking[] {
  return rawRankings.map((r) => {
    const isRevealed = !forceUnrevealed && Boolean(r.scoreRevealed ?? r.score_revealed);
    return {
      rank: Number(r.rank ?? 0),
      teamId: Number(r.teamId ?? r.team_id ?? 0),
      teamName: typeof r.teamName === 'string' ? r.teamName : (typeof r.team_name === 'string' ? r.team_name : null),
      projectTitle: String(r.projectTitle ?? r.project_title ?? ''),
      prize: typeof r.prize === 'string' ? r.prize : null,
      score: isRevealed && typeof r.score === 'number' ? r.score : null,
      scoreRevealed: isRevealed,
    };
  });
}

/**
 * Strips any sensitive or forbidden keys from arbitrary objects recursively.
 */
export function assertNoPrivateFields(obj: unknown): void {
  if (!obj || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      assertNoPrivateFields(item);
    }
    return;
  }

  const record = obj as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const lowerKey = key.toLowerCase();
    if (FORBIDDEN_PRIVATE_KEYS.some((forbidden) => lowerKey.includes(forbidden.toLowerCase()))) {
      throw new Error(`Security Violation: Private field '${key}' detected in public response`);
    }
    assertNoPrivateFields(record[key]);
  }
}
