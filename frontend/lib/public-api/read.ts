import type {
  PublicHackathon,
  PublicProject,
  PublicResult,
  PublicProof,
  PaginatedResponse,
} from './schemas';
import { paginate } from './pagination';
import { sanitizeProject, sanitizeRankings } from './visibility';
import {
  FIXTURE_HACKATHONS,
  FIXTURE_PROJECTS,
  FIXTURE_RESULTS,
  FIXTURE_PROOFS,
} from '../../tests/public-api/fixtures';

/**
 * Reads public hackathons with pagination.
 */
export async function readHackathons(
  page: number,
  perPage: number
): Promise<PaginatedResponse<PublicHackathon>> {
  return paginate(FIXTURE_HACKATHONS, page, perPage);
}

/**
 * Reads a single public hackathon by its unique slug.
 */
export async function readHackathonBySlug(
  slug: string
): Promise<PublicHackathon | null> {
  const found = FIXTURE_HACKATHONS.find((h) => h.slug.toLowerCase() === slug.toLowerCase());
  return found || null;
}

/**
 * Reads submitted public projects for a given hackathon slug with pagination.
 */
export async function readProjectsBySlug(
  slug: string,
  page: number,
  perPage: number
): Promise<PaginatedResponse<PublicProject> | null> {
  const hackathon = await readHackathonBySlug(slug);
  if (!hackathon) return null;

  const projects = FIXTURE_PROJECTS[hackathon.slug] || [];
  const sanitized = projects.map((p) => sanitizeProject(p as unknown as Record<string, unknown>));
  return paginate(sanitized, page, perPage);
}

/**
 * Reads results and rankings for a given hackathon slug.
 * Automatically redacts scores if unrevealed.
 */
export async function readResultsBySlug(
  slug: string
): Promise<PublicResult | null> {
  const hackathon = await readHackathonBySlug(slug);
  if (!hackathon) return null;

  const result = FIXTURE_RESULTS[hackathon.slug];
  if (!result) return null;

  const rankings = sanitizeRankings(
    result.rankings as unknown as Array<Record<string, unknown>>,
    hackathon.phase !== 'closed'
  );

  return {
    ...result,
    rankings,
  };
}

/**
 * Reads cryptographic proof and anchor data for a given hackathon slug.
 */
export async function readProofBySlug(
  slug: string
): Promise<PublicProof | null> {
  const hackathon = await readHackathonBySlug(slug);
  if (!hackathon) return null;

  const proof = FIXTURE_PROOFS[hackathon.slug];
  return proof || null;
}
