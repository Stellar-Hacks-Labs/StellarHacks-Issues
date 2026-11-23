/**
 * Schemas and contracts for the StellarHacks Public Read-Only API (v1).
 *
 * All public shapes are versioned, typed, and guaranteed against schema drift.
 */

export interface PublicMember {
  address: string;
  captain: boolean;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
}

export interface PublicHackathon {
  slug: string;
  contractId: string;
  name: string;
  tagline: string | null;
  description: string | null;
  bannerUrl: string | null;
  logoUrl: string | null;
  location: string | null;
  tags: string[];
  phase: string;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

export interface PublicProject {
  teamId: number;
  contractId: string;
  title: string;
  summary: string | null;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  repositoryUrl: string | null;
  liveUrl: string | null;
  demoVideoUrl: string | null;
  teamName: string | null;
  members: PublicMember[];
}

export interface PublicRanking {
  rank: number;
  teamId: number;
  teamName: string | null;
  projectTitle: string;
  prize: string | null;
  score: number | null;
  scoreRevealed: boolean;
}

export interface PublicResult {
  hackathonSlug: string;
  contractId: string;
  publishedAt: string | null;
  rankings: PublicRanking[];
}

export interface PublicProof {
  hackathonSlug: string;
  contractId: string;
  constitutionHash: string;
  merkleRoot: string;
  anchorTx: string | null;
  verified: boolean;
  anchoredAt: string | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface PublicApiError {
  error: string;
  code: string;
  status: number;
  details?: unknown;
}
