import { describe, it, expect } from 'vitest';
import type {
  PublicHackathon,
  PublicProject,
  PublicResult,
  PublicProof,
  PaginatedResponse,
} from './schemas';

describe('schemas shape contracts', () => {
  it('instantiates valid PublicHackathon shape without missing mandatory fields', () => {
    const hackathon: PublicHackathon = {
      slug: 'stellar-summer-2026',
      contractId: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
      name: 'Stellar Summer 2026',
      tagline: 'Build next-gen Soroban dApps',
      description: 'Annual global hackathon for Soroban developers.',
      bannerUrl: 'https://example.com/banner.png',
      logoUrl: 'https://example.com/logo.png',
      location: 'Virtual',
      tags: ['soroban', 'defi', 'rust'],
      phase: 'submission',
      startsAt: '2026-06-01T00:00:00Z',
      endsAt: '2026-06-30T23:59:59Z',
      createdAt: '2026-05-01T12:00:00Z',
    };

    expect(hackathon.slug).toBe('stellar-summer-2026');
    expect(hackathon.tags).toHaveLength(3);
  });

  it('instantiates valid PublicProject and PublicResult models', () => {
    const project: PublicProject = {
      teamId: 42,
      contractId: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
      title: 'Soroban Vaults',
      summary: 'Yield aggregator',
      description: 'Automated liquidity vaults on Stellar.',
      bannerUrl: null,
      logoUrl: null,
      repositoryUrl: 'https://github.com/stellar/vaults',
      liveUrl: 'https://vaults.stellar.org',
      demoVideoUrl: null,
      teamName: 'Team Stellar',
      members: [
        {
          address: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
          captain: true,
          displayName: 'Alice',
          username: 'alice',
          avatarUrl: null,
        },
      ],
    };

    expect(project.teamId).toBe(42);
    expect(project.members[0].captain).toBe(true);
  });
});
