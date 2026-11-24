import { beforeEach, describe, expect, it } from "vitest";

import { LIMIT_PER_WINDOW, WINDOW_MS, clientOf, guard, rateHeaders, resetRateLimits, take } from "./rate-limit";

beforeEach(() => resetRateLimits());

describe("who a request is from", () => {
  it("is the first forwarded address, which is the client behind a proxy", () => {
    const request = new Request("http://localhost/api/v1/hackathons", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    });

    expect(clientOf(request)).toBe("203.0.113.7");
  });

  it("falls back to the real IP header, then to one local bucket", () => {
    expect(clientOf(new Request("http://localhost/", { headers: { "x-real-ip": "198.51.100.4" } }))).toBe("198.51.100.4");
    expect(clientOf(new Request("http://localhost/"))).toBe("local");
  });
});

describe("the window", () => {
  it("allows the documented number of requests and then refuses", () => {
    for (let at = 0; at < LIMIT_PER_WINDOW; at += 1) {
      expect(take("client", 1_000).allowed, `request ${at + 1}`).toBe(true);
    }

    const refused = take("client", 1_000);

    expect(refused.allowed).toBe(false);
    expect(refused.remaining).toBe(0);
  });

  it("counts down so a client can pace itself rather than discovering the wall", () => {
    expect(take("client", 1_000).remaining).toBe(LIMIT_PER_WINDOW - 1);
    expect(take("client", 1_000).remaining).toBe(LIMIT_PER_WINDOW - 2);
  });

  it("opens again when the window passes", () => {
    for (let at = 0; at < LIMIT_PER_WINDOW; at += 1) {
      take("client", 1_000);
    }

    expect(take("client", 1_000).allowed).toBe(false);
    expect(take("client", 1_000 + WINDOW_MS + 1).allowed).toBe(true);
  });

  it("counts one client's requests against that client only", () => {
    for (let at = 0; at < LIMIT_PER_WINDOW; at += 1) {
      take("noisy", 1_000);
    }

    expect(take("noisy", 1_000).allowed).toBe(false);
    expect(take("quiet", 1_000).allowed).toBe(true);
  });
});

describe("the headers", () => {
  it("are on every answer, so a client never has to guess its budget", () => {
    const headers = rateHeaders(take("client", 1_000));

    expect(headers["ratelimit-limit"]).toBe(String(LIMIT_PER_WINDOW));
    expect(headers["ratelimit-remaining"]).toBe(String(LIMIT_PER_WINDOW - 1));
    expect(Number(headers["ratelimit-reset"])).toBe(Math.ceil((1_000 + WINDOW_MS) / 1000));
    expect("retry-after" in headers).toBe(false);
  });

  it("add a retry-after on a refusal, rather than teaching a client to retry blindly", () => {
    for (let at = 0; at < LIMIT_PER_WINDOW; at += 1) {
      take("client", 1_000);
    }

    const headers = rateHeaders(take("client", 1_000));

    expect(headers["retry-after"]).toBe(String(WINDOW_MS / 1000));
  });
});

describe("the gate a route opens with", () => {
  it("hands back the headers to attach and nothing to refuse, while there is budget", () => {
    const { headers, refused } = guard(new Request("http://localhost/api/v1/hackathons"));

    expect(refused).toBeNull();
    expect(headers["ratelimit-remaining"]).toBe(String(LIMIT_PER_WINDOW - 1));
  });

  it("hands back a 429 carrying the same headers once there is not", async () => {
    const request = new Request("http://localhost/api/v1/hackathons");

    for (let at = 0; at < LIMIT_PER_WINDOW; at += 1) {
      guard(request);
    }

    const { refused } = guard(request);

    expect(refused?.status).toBe(429);
    expect(refused?.headers.get("retry-after")).not.toBeNull();
    expect(refused?.headers.get("ratelimit-limit")).toBe(String(LIMIT_PER_WINDOW));
    await expect(refused?.json()).resolves.toMatchObject({ error: { code: "rate_limited" } });
  });
});
