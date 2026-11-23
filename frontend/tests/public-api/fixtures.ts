import type {
  PublicHackathon,
  PublicProject,
  PublicResult,
  PublicProof,
} from '../../lib/public-api/schemas';

export const FIXTURE_HACKATHONS: PublicHackathon[] = [
  {
    slug: 'stellar-wave-11',
    contractId: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
    name: 'Stellar Wave 11 Hackathon',
    tagline: 'Scale payments and smart contracts on Soroban',
    description: 'A global hackathon focused on DeFi, payments, and smart contract innovation.',
    bannerUrl: 'https://images.unsplash.com/photo-stellar-banner',
    logoUrl: 'https://images.unsplash.com/photo-stellar-logo',
    location: 'Global Virtual',
    tags: ['soroban', 'stellar', 'defi', 'payments'],
    phase: 'voting',
    startsAt: '2026-05-01T00:00:00Z',
    endsAt: '2026-06-01T23:59:59Z',
    createdAt: '2026-04-15T12:00:00Z',
  },
  {
    slug: 'soroban-build-2026',
    contractId: 'CBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBD2KM',
    name: 'Soroban Build 2026',
    tagline: 'Ecosystem development hackathon',
    description: 'Annual builder hackathon showcasing high-throughput Soroban dApps.',
    bannerUrl: 'https://images.unsplash.com/photo-soroban-banner',
    logoUrl: 'https://images.unsplash.com/photo-soroban-logo',
    location: 'San Francisco, CA',
    tags: ['soroban', 'rust', 'wasm'],
    phase: 'closed',
    startsAt: '2026-03-01T00:00:00Z',
    endsAt: '2026-03-15T23:59:59Z',
    createdAt: '2026-02-10T10:00:00Z',
  },
];

export const FIXTURE_PROJECTS: Record<string, PublicProject[]> = {
  'stellar-wave-11': [
    {
      teamId: 101,
      contractId: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
      title: 'Soroban Liquidity Engine',
      summary: 'Dynamic automated market maker with path payment integration',
      description: 'Full featured DEX AMM running on Soroban testnet.',
      logoUrl: 'https://example.com/project-logo-1.png',
      bannerUrl: null,
      repositoryUrl: 'https://github.com/stellar-builders/amm-engine',
      liveUrl: 'https://amm-engine.stellar.app',
      demoVideoUrl: 'https://youtube.com/watch?v=demo1',
      teamName: 'Liquidity Labs',
      members: [
        {
          address: 'GA1111111111111111111111111111111111111111111111111111111',
          captain: true,
          displayName: 'Alice Engineer',
          username: 'alice_eng',
          avatarUrl: 'https://example.com/alice.png',
        },
        {
          address: 'GA2222222222222222222222222222222222222222222222222222222',
          captain: false,
          displayName: 'Bob Builder',
          username: 'bob_b',
          avatarUrl: null,
        },
      ],
    },
    {
      teamId: 102,
      contractId: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
      title: 'Claimable Escrow Pay',
      summary: 'Time-locked claimable balance management portal',
      description: 'Create, monitor, and claim vesting balances with Soroban contracts.',
      logoUrl: null,
      bannerUrl: null,
      repositoryUrl: 'https://github.com/stellar-builders/escrow-pay',
      liveUrl: 'https://escrow-pay.stellar.app',
      demoVideoUrl: null,
      teamName: 'Escrow Heroes',
      members: [
        {
          address: 'GA3333333333333333333333333333333333333333333333333333333',
          captain: true,
          displayName: 'Charlie Dev',
          username: 'charlie',
          avatarUrl: null,
        },
      ],
    },
  ],
  'soroban-build-2026': [
    {
      teamId: 201,
      contractId: 'CBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBD2KM',
      title: 'Yield Protocol',
      summary: 'Stellar testnet yield distributor',
      description: 'Automated yield distribution smart contract.',
      logoUrl: null,
      bannerUrl: null,
      repositoryUrl: 'https://github.com/stellar-builders/yield-proto',
      liveUrl: null,
      demoVideoUrl: null,
      teamName: 'Yield Wizards',
      members: [
        {
          address: 'GA4444444444444444444444444444444444444444444444444444444',
          captain: true,
          displayName: 'Dave Trader',
          username: 'dave',
          avatarUrl: null,
        },
      ],
    },
  ],
};

export const FIXTURE_RESULTS: Record<string, PublicResult> = {
  'soroban-build-2026': {
    hackathonSlug: 'soroban-build-2026',
    contractId: 'CBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBD2KM',
    publishedAt: '2026-03-16T10:00:00Z',
    rankings: [
      {
        rank: 1,
        teamId: 201,
        teamName: 'Yield Wizards',
        projectTitle: 'Yield Protocol',
        prize: '15,000 XLM',
        score: 96.5,
        scoreRevealed: true,
      },
    ],
  },
  'stellar-wave-11': {
    hackathonSlug: 'stellar-wave-11',
    contractId: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
    publishedAt: null,
    rankings: [
      {
        rank: 1,
        teamId: 101,
        teamName: 'Liquidity Labs',
        projectTitle: 'Soroban Liquidity Engine',
        prize: null,
        score: null,
        scoreRevealed: false, // Voting in progress: scores sealed!
      },
      {
        rank: 2,
        teamId: 102,
        teamName: 'Escrow Heroes',
        projectTitle: 'Claimable Escrow Pay',
        prize: null,
        score: null,
        scoreRevealed: false, // Voting in progress: scores sealed!
      },
    ],
  },
};

export const FIXTURE_PROOFS: Record<string, PublicProof> = {
  'stellar-wave-11': {
    hackathonSlug: 'stellar-wave-11',
    contractId: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
    constitutionHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    merkleRoot: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
    anchorTx: '64f7b2c0e8f7311181283c8479e0a2948bb3e85bbd86fb8ef2791ccfbff537b0',
    verified: true,
    anchoredAt: '2026-06-02T02:15:00Z',
  },
  'soroban-build-2026': {
    hackathonSlug: 'soroban-build-2026',
    contractId: 'CBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBD2KM',
    constitutionHash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
    merkleRoot: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
    anchorTx: 'bf83792c30ecb29dbcf7ff6230bf3a9a1c620e2bc00b73c242e88a03f47c3eb4',
    verified: true,
    anchoredAt: '2026-03-16T12:00:00Z',
  },
};
