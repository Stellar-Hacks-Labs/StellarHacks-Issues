import { errorSchema, type JsonSchema } from "./schemas";

/**
 * Every failure this API can answer with, in one shape and one list.
 *
 * A read-only API's error codes are part of its contract as much as its
 * fields are: a consumer branches on them, and a code that changes meaning
 * breaks a dashboard that was written correctly. So they are enumerated here,
 * the catalogue is what the OpenAPI document publishes, and the rule is written
 * down with them — codes are added, never repurposed.
 *
 * The HTTP status travels with the code rather than being chosen at each route,
 * because the same mistake answered 400 on one route and 422 on another is a
 * consumer writing two error branches for one condition.
 */

export type ApiErrorCode =
  | "not_found"
  | "invalid_request"
  | "invalid_cursor"
  | "rate_limited"
  | "unavailable";

export const API_ERRORS: Record<ApiErrorCode, { status: number; message: string }> = {
  not_found: { status: 404, message: "No such hackathon." },
  invalid_request: { status: 400, message: "The request is not one this API can answer." },
  invalid_cursor: { status: 400, message: "That cursor did not come from this API." },
  rate_limited: { status: 429, message: "Too many requests from this client." },
  /* 503 rather than 500: the API is fine and a source it reads is not, which is
     a distinction a dashboard retrying on a schedule needs to be able to make. */
  unavailable: { status: 503, message: "A source this API reads could not be reached." },
};

export interface ApiErrorBody {
  error: { code: ApiErrorCode; message: string; detail?: string | null };
}

export function errorBody(code: ApiErrorCode, detail?: string): ApiErrorBody {
  return {
    error: {
      code,
      message: API_ERRORS[code].message,
      ...(detail === undefined ? {} : { detail }),
    },
  };
}

/** The error as a response, with the status the catalogue pairs with the code. */
export function errorResponse(
  code: ApiErrorCode,
  detail?: string,
  headers: Record<string, string> = {},
): Response {
  return Response.json(errorBody(code, detail), {
    status: API_ERRORS[code].status,
    headers: { "content-type": "application/json", ...headers },
  });
}

export const errorResponseSchema: JsonSchema = errorSchema;
