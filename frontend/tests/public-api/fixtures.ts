/**
 * One recorded platform, and a stand in for PostgREST that serves it.
 *
 * The routes read with the anonymous key and let row level security decide what
 * a stranger sees, so there is nothing for a test to mock about permissions —
 * what there is to test is the shaping, the paging, the error shapes and the
 * two promises the API makes about what it never serves. All of that needs rows
 * and no database.
 *
 * The stand in answers the same chain of calls the routes make and nothing
 * more. A fake that accepted any query would let a route drift into asking for
 * something real PostgREST would refuse, so an unsupported call throws here
 * rather than returning an empty page.
 */

export const LIVE_SLUG = "an-event";
export const SETTLED_SLUG = "a-finished-event";
export const LIVE_CONTRACT = "CCQ7LAZ7TH3DPWK3MCL2JFOM3JLMK6UKFTOMR2TERRXVLYBZ55LEHHNB";
export const SETTLED_CONTRACT = "CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE";
export const TX_HASH = "ab".repeat(32);
export const CONSTITUTION_HASH = "cd".repeat(32);

export type Row = Record<string, unknown>;

export interface Recorded {
  hackathons: Row[];
  hackathon_state: Row[];
  teams: Row[];
  submissions: Row[];
  projects: Row[];
  results: Row[];
  payments: Row[];
}

/**
 * A platform with two events: one mid judging, one settled.
 *
 * The judging one is what the reveal promise is tested against — it has a full
 * ranking recorded, because the contract ranks before the reveal, and the API
 * must still serve no score for it.
 */
export function recorded(): Recorded {
  return {
    hackathons: [
      {
        contract_id: SETTLED_CONTRACT,
        slug: SETTLED_SLUG,
        name: "A finished event",
        tagline: "It paid out",
        description: "# A finished event",
        logo_url: "https://example.test/logo.png",
        website_url: "https://example.test",
        created_at: "2026-10-01T00:00:00.000Z",
      },
      {
        contract_id: LIVE_CONTRACT,
        slug: LIVE_SLUG,
        name: "An event",
        tagline: null,
        description: null,
        logo_url: null,
        website_url: null,
        created_at: "2026-11-01T00:00:00.000Z",
      },
    ],
    hackathon_state: [
      {
        contract_id: LIVE_CONTRACT,
        phase: 4,
        visibility: 0,
        organizer: "GA3A3NY4VLTTUPJCJSTJ457KAOXKPZ3PQER4M2F5TQRFG5TTNEOBQZ3K",
        constitution_hash: `\\x${CONSTITUTION_HASH}`,
        prize_asset: "CBASSETAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAW",
        vault_id: "CBVAULTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAW",
      },
      {
        contract_id: SETTLED_CONTRACT,
        phase: 7,
        visibility: 0,
        organizer: "GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H",
        constitution_hash: `\\x${CONSTITUTION_HASH}`,
        prize_asset: "CBASSETAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAW",
        vault_id: "CBVAULTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAW",
      },
    ],
    teams: [
      { contract_id: LIVE_CONTRACT, team_id: 1 },
      { contract_id: LIVE_CONTRACT, team_id: 2 },
      { contract_id: LIVE_CONTRACT, team_id: 3 },
    ],
    submissions: [
      {
        contract_id: LIVE_CONTRACT,
        team_id: 1,
        track: "ai",
        metadata_hash: `\\x${"11".repeat(32)}`,
        submitted_at: "2026-11-10T00:00:00.000Z",
        status: 0,
      },
      {
        contract_id: LIVE_CONTRACT,
        team_id: 2,
        track: "ai",
        metadata_hash: `\\x${"22".repeat(32)}`,
        submitted_at: "2026-11-10T01:00:00.000Z",
        status: 0,
      },
      {
        contract_id: LIVE_CONTRACT,
        team_id: 3,
        track: "tooling",
        metadata_hash: `\\x${"33".repeat(32)}`,
        submitted_at: "2026-11-10T02:00:00.000Z",
        /* Disqualified, which the API reports as a flag and explains nowhere
           else: the reason is the organizer's to publish on their own page. */
        status: 2,
      },
      {
        contract_id: SETTLED_CONTRACT,
        team_id: 1,
        track: "ai",
        metadata_hash: `\\x${"44".repeat(32)}`,
        submitted_at: "2026-10-10T00:00:00.000Z",
        status: 0,
      },
    ],
    projects: [
      {
        contract_id: LIVE_CONTRACT,
        team_id: 1,
        title: "A project",
        summary: "What it does",
        repository_url: "https://example.test/repo",
        demo_video_url: null,
        live_url: null,
        /* Columns a project row really carries and the API must not publish.
           The shaping drops them; `visibility.test.ts` is what proves it. */
        owner_email: "someone@example.invalid",
        profile_id: "0b2e5a6c-0000-4000-8000-000000000000",
      },
      { contract_id: LIVE_CONTRACT, team_id: 2, title: "Another project", summary: null },
      { contract_id: SETTLED_CONTRACT, team_id: 1, title: "The winner", summary: "It won" },
    ],
    results: [
      {
        contract_id: LIVE_CONTRACT,
        track: "ai",
        rank: 1,
        team_id: 2,
        final_score: 8_000,
        judge_average: 7_500,
        community: 500,
        decided_by: 0,
      },
      {
        contract_id: LIVE_CONTRACT,
        track: "ai",
        rank: 2,
        team_id: 1,
        final_score: 6_000,
        judge_average: 6_000,
        community: 0,
        decided_by: 1,
      },
      {
        contract_id: SETTLED_CONTRACT,
        track: "ai",
        rank: 1,
        team_id: 1,
        final_score: 9_000,
        judge_average: 9_000,
        community: 0,
        decided_by: 0,
      },
    ],
    payments: [
      {
        contract_id: SETTLED_CONTRACT,
        track: "ai",
        rank: 1,
        recipient: "GCWINNER1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAW",
        amount: "3000",
        kind: 0,
        ledger: 5100,
        tx_hash: `\\x${TX_HASH}`,
      },
    ],
  };
}

type Condition = (row: Row) => boolean;

/** The subset of PostgREST's builder the routes use, over recorded rows. */
class Query implements PromiseLike<{ data: Row[] | null; error: { message: string } | null; count: number | null }> {
  private conditions: Condition[] = [];
  private orders: { column: string; ascending: boolean }[] = [];
  private cap: number | null = null;
  private single = false;
  private headOnly = false;

  constructor(
    private readonly rows: Row[],
    private readonly table: string,
    private readonly failing: string | null,
  ) {}

  select(_columns: string, options?: { count?: string; head?: boolean }): this {
    this.headOnly = options?.head === true;

    return this;
  }

  eq(column: string, value: unknown): this {
    this.conditions.push((row) => String(row[column]) === String(value));

    return this;
  }

  in(column: string, values: unknown[]): this {
    const wanted = values.map(String);

    this.conditions.push((row) => wanted.includes(String(row[column])));

    return this;
  }

  gt(column: string, value: unknown): this {
    this.conditions.push((row) => Number(row[column]) > Number(value));

    return this;
  }

  lt(column: string, value: unknown): this {
    this.conditions.push((row) => String(row[column]) < String(value));

    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.orders.push({ column, ascending: options?.ascending !== false });

    return this;
  }

  limit(count: number): this {
    this.cap = count;

    return this;
  }

  maybeSingle(): this {
    this.single = true;

    return this;
  }

  private answer() {
    if (this.failing === this.table) {
      return { data: null, error: { message: `the ${this.table} table could not be read` }, count: null };
    }

    let rows = this.rows.filter((row) => this.conditions.every((condition) => condition(row)));

    for (const { column, ascending } of [...this.orders].reverse()) {
      rows = [...rows].sort((left, right) => {
        const compared = String(left[column]).localeCompare(String(right[column]), undefined, { numeric: true });

        return ascending ? compared : -compared;
      });
    }

    const count = rows.length;

    if (this.cap !== null) {
      rows = rows.slice(0, this.cap);
    }

    if (this.headOnly) {
      return { data: null, error: null, count };
    }

    return this.single
      ? { data: (rows[0] ?? null) as unknown as Row[] | null, error: null, count }
      : { data: rows, error: null, count };
  }

  then<Result1 = { data: Row[] | null; error: { message: string } | null; count: number | null }, Result2 = never>(
    resolve?: ((value: { data: Row[] | null; error: { message: string } | null; count: number | null }) => Result1 | PromiseLike<Result1>) | null,
    reject?: ((reason: unknown) => Result2 | PromiseLike<Result2>) | null,
  ): PromiseLike<Result1 | Result2> {
    return Promise.resolve(this.answer()).then(resolve, reject);
  }
}

export interface FakeDatabase {
  from: (table: string) => Query;
}

/**
 * A database that answers from recorded rows.
 *
 * `failing` names one table that answers with an error instead, which is how
 * the "a source could not be read" path is tested without pretending the whole
 * deployment is unconfigured.
 */
export function fakeDatabase(rows: Recorded = recorded(), failing: string | null = null): FakeDatabase {
  return {
    from(table: string) {
      const held = (rows as unknown as Record<string, Row[]>)[table];

      if (held === undefined) {
        throw new Error(`the recorded platform has no ${table} table; a route asked for one`);
      }

      return new Query(held, table, failing);
    },
  };
}

/** A request with a client address, so each test gets its own rate limit window. */
export function asking(path: string, client = `test-${Math.random().toString(36).slice(2)}`): Request {
  return new Request(`http://localhost/api/v1${path}`, { headers: { "x-forwarded-for": client } });
}
