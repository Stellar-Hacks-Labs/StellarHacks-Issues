import { decodeEvent, type DecodedEvent, type RawEvent, type UnknownEvent } from "../events.js";

/**
 * Turn a raw or fixture event stream into named fields the verifier can read.
 *
 * Live mode feeds Soroban RPC payloads; offline mode feeds the JSON fixture.
 * Both paths end here so disclosure extraction does not care which one ran.
 */

export interface VerifierEvent {
  name: string;
  fields: Record<string, unknown>;
}

export function decodeVerifierEvents(events: readonly RawEvent[]): VerifierEvent[] {
  return decodeEventsKeepingUnknown(events).flatMap((event) => {
    if (event.name === null) {
      return [];
    }

    return [{ name: event.name, fields: event.fields }];
  });
}

/**
 * Parse the offline events fixture.
 *
 * Each entry is already named; unknown rows are kept so a reader can see that
 * the fixture carried something this build does not decode, matching the
 * authority rule that unknown events must not vanish quietly.
 */
export function parseEventFixture(raw: unknown): VerifierEvent[] {
  if (!Array.isArray(raw)) {
    throw new Error("events fixture must be an array");
  }

  return raw.map((entry, index) => {
    if (entry === null || typeof entry !== "object") {
      throw new Error(`events[${index}] must be an object`);
    }

    const body = entry as Record<string, unknown>;
    if (typeof body["name"] !== "string") {
      throw new Error(`events[${index}] needs a name`);
    }

    const fields =
      body["fields"] !== undefined && typeof body["fields"] === "object" && body["fields"] !== null
        ? (body["fields"] as Record<string, unknown>)
        : {};

    return { name: body["name"], fields };
  });
}

function decodeEventsKeepingUnknown(
  events: readonly RawEvent[],
): (DecodedEvent | UnknownEvent)[] {
  return events.map(decodeEvent);
}
