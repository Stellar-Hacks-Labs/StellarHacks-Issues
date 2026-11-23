/**
 * OpenAPI 3.1.0 Description for StellarHacks Public Read-Only API (v1).
 */

export const OPENAPI_SPEC = {
  openapi: '3.1.0',
  info: {
    title: 'StellarHacks Public API',
    version: '1.0.0',
    description:
      'Versioned read-only API exposing Stellar hackathons, projects, results, and cryptographic proofs with pagination, rate limiting, and caching.',
    contact: {
      name: 'StellarHacks Labs',
      url: 'https://github.com/Stellar-Hacks-Labs/StellarHacks-Issues',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 root',
    },
  ],
  paths: {
    '/hackathons': {
      get: {
        summary: 'List hackathons',
        description: 'Returns a paginated list of public hackathons.',
        operationId: 'listHackathons',
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number (default: 1)',
            schema: { type: 'integer', default: 1, minimum: 1 },
          },
          {
            name: 'per_page',
            in: 'query',
            description: 'Items per page (default: 20, max: 100)',
            schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
          },
        ],
        responses: {
          '200': {
            description: 'Paginated hackathon list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/PublicHackathon' },
                    },
                    pagination: { $ref: '#/components/schemas/PaginationMeta' },
                  },
                  required: ['data', 'pagination'],
                },
              },
            },
          },
          '429': {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PublicApiError' },
              },
            },
          },
        },
      },
    },
    '/hackathons/{slug}': {
      get: {
        summary: 'Get hackathon details',
        description: 'Returns details of a hackathon by unique slug.',
        operationId: 'getHackathonBySlug',
        parameters: [
          {
            name: 'slug',
            in: 'path',
            required: true,
            description: 'Hackathon slug identifier',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Hackathon details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PublicHackathon' },
              },
            },
          },
          '404': {
            description: 'Hackathon not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PublicApiError' },
              },
            },
          },
          '429': {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PublicApiError' },
              },
            },
          },
        },
      },
    },
    '/hackathons/{slug}/projects': {
      get: {
        summary: 'List hackathon projects',
        description: 'Returns a paginated list of projects submitted to a hackathon.',
        operationId: 'listHackathonProjects',
        parameters: [
          {
            name: 'slug',
            in: 'path',
            required: true,
            description: 'Hackathon slug identifier',
            schema: { type: 'string' },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number (default: 1)',
            schema: { type: 'integer', default: 1, minimum: 1 },
          },
          {
            name: 'per_page',
            in: 'query',
            description: 'Items per page (default: 20, max: 100)',
            schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
          },
        ],
        responses: {
          '200': {
            description: 'Paginated project list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/PublicProject' },
                    },
                    pagination: { $ref: '#/components/schemas/PaginationMeta' },
                  },
                  required: ['data', 'pagination'],
                },
              },
            },
          },
          '404': {
            description: 'Hackathon not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PublicApiError' },
              },
            },
          },
          '429': {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PublicApiError' },
              },
            },
          },
        },
      },
    },
    '/hackathons/{slug}/results': {
      get: {
        summary: 'Get hackathon results and rankings',
        description: 'Returns public rankings, prizes, and revealed scores for a hackathon.',
        operationId: 'getHackathonResults',
        parameters: [
          {
            name: 'slug',
            in: 'path',
            required: true,
            description: 'Hackathon slug identifier',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Hackathon results',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PublicResult' },
              },
            },
          },
          '404': {
            description: 'Hackathon not found or results pending',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PublicApiError' },
              },
            },
          },
          '429': {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PublicApiError' },
              },
            },
          },
        },
      },
    },
    '/hackathons/{slug}/proof': {
      get: {
        summary: 'Get cryptographic proof data',
        description: 'Returns contract, Merkle root, and Stellar anchor proof details.',
        operationId: 'getHackathonProof',
        parameters: [
          {
            name: 'slug',
            in: 'path',
            required: true,
            description: 'Hackathon slug identifier',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Cryptographic proof',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PublicProof' },
              },
            },
          },
          '404': {
            description: 'Hackathon not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PublicApiError' },
              },
            },
          },
          '429': {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PublicApiError' },
              },
            },
          },
        },
      },
    },
    '/openapi.json': {
      get: {
        summary: 'OpenAPI description document',
        description: 'Returns this OpenAPI 3.1.0 document in JSON format.',
        operationId: 'getOpenApiDocument',
        responses: {
          '200': {
            description: 'OpenAPI 3.1.0 JSON specification',
            content: {
              'application/json': {
                schema: { type: 'object' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      PublicMember: {
        type: 'object',
        properties: {
          address: { type: 'string' },
          captain: { type: 'boolean' },
          displayName: { type: ['string', 'null'] },
          username: { type: ['string', 'null'] },
          avatarUrl: { type: ['string', 'null'] },
        },
        required: ['address', 'captain'],
      },
      PublicHackathon: {
        type: 'object',
        properties: {
          slug: { type: 'string' },
          contractId: { type: 'string' },
          name: { type: 'string' },
          tagline: { type: ['string', 'null'] },
          description: { type: ['string', 'null'] },
          bannerUrl: { type: ['string', 'null'] },
          logoUrl: { type: ['string', 'null'] },
          location: { type: ['string', 'null'] },
          tags: { type: 'array', items: { type: 'string' } },
          phase: { type: 'string' },
          startsAt: { type: ['string', 'null'] },
          endsAt: { type: ['string', 'null'] },
          createdAt: { type: 'string' },
        },
        required: ['slug', 'contractId', 'name', 'tags', 'phase', 'createdAt'],
      },
      PublicProject: {
        type: 'object',
        properties: {
          teamId: { type: 'integer' },
          contractId: { type: 'string' },
          title: { type: 'string' },
          summary: { type: ['string', 'null'] },
          description: { type: ['string', 'null'] },
          logoUrl: { type: ['string', 'null'] },
          bannerUrl: { type: ['string', 'null'] },
          repositoryUrl: { type: ['string', 'null'] },
          liveUrl: { type: ['string', 'null'] },
          demoVideoUrl: { type: ['string', 'null'] },
          teamName: { type: ['string', 'null'] },
          members: {
            type: 'array',
            items: { $ref: '#/components/schemas/PublicMember' },
          },
        },
        required: ['teamId', 'contractId', 'title', 'members'],
      },
      PublicRanking: {
        type: 'object',
        properties: {
          rank: { type: 'integer' },
          teamId: { type: 'integer' },
          teamName: { type: ['string', 'null'] },
          projectTitle: { type: 'string' },
          prize: { type: ['string', 'null'] },
          score: { type: ['number', 'null'] },
          scoreRevealed: { type: 'boolean' },
        },
        required: ['rank', 'teamId', 'projectTitle', 'scoreRevealed'],
      },
      PublicResult: {
        type: 'object',
        properties: {
          hackathonSlug: { type: 'string' },
          contractId: { type: 'string' },
          publishedAt: { type: ['string', 'null'] },
          rankings: {
            type: 'array',
            items: { $ref: '#/components/schemas/PublicRanking' },
          },
        },
        required: ['hackathonSlug', 'contractId', 'rankings'],
      },
      PublicProof: {
        type: 'object',
        properties: {
          hackathonSlug: { type: 'string' },
          contractId: { type: 'string' },
          constitutionHash: { type: 'string' },
          merkleRoot: { type: 'string' },
          anchorTx: { type: ['string', 'null'] },
          verified: { type: 'boolean' },
          anchoredAt: { type: ['string', 'null'] },
        },
        required: ['hackathonSlug', 'contractId', 'constitutionHash', 'merkleRoot', 'verified'],
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          page: { type: 'integer' },
          perPage: { type: 'integer' },
          totalPages: { type: 'integer' },
          hasNext: { type: 'boolean' },
          hasPrev: { type: 'boolean' },
        },
        required: ['total', 'page', 'perPage', 'totalPages', 'hasNext', 'hasPrev'],
      },
      PublicApiError: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'string' },
          status: { type: 'integer' },
          details: {},
        },
        required: ['error', 'code', 'status'],
      },
    },
  },
};

/**
 * Validates an object against a schema defined in OPENAPI_SPEC.components.schemas.
 */
export function validateAgainstSchema(
  data: Record<string, unknown>,
  schemaName: keyof typeof OPENAPI_SPEC.components.schemas
): { valid: boolean; missing: string[] } {
  const schema = OPENAPI_SPEC.components.schemas[schemaName] as {
    properties: Record<string, unknown>;
    required?: string[];
  };

  const required = schema.required || [];
  const missing = required.filter((field) => data[field] === undefined);

  return {
    valid: missing.length === 0,
    missing,
  };
}
