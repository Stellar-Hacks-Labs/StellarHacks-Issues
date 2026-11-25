"use client";

import { useState } from "react";

import { VerifyResult, type VerifyOutcome } from "./verify-result";
import { Button } from "../components/primitives";
import { verifyPayload } from "../../lib/credentials/sign";

/**
 * Paste a credential, learn what it establishes.
 *
 * The signature check happens here, in the browser, with no request to us: the
 * credential carries its own key id and the check is arithmetic. That matters
 * more than it looks — a verification page that asked its own server whether a
 * credential was valid would be a page asking the issuer to vouch for the
 * issuer, and a reader may as well have taken our word in the first place.
 *
 * The key id this deployment publishes is handed in by the page, so a reader can
 * also see whether the signer is us. The evidence half is links, which
 * `verify-result.tsx` lays out; nothing here pretends to have checked it.
 */

const ADDRESS = /^G[A-Z2-7]{55}$/;
const CONTRACT = /^C[A-Z2-7]{55}$/;
const HEX32 = /^[0-9a-f]{64}$/;
const SIGNATURE = /^[0-9a-f]{128}$/;

export function VerifyForm({ ourKeyId }: { ourKeyId: string | null }) {
  const [pasted, setPasted] = useState("");
  const [outcome, setOutcome] = useState<VerifyOutcome | null>(null);

  function check() {
    setOutcome(verify(pasted, ourKeyId));
  }

  return (
    <div className="space-y-8">
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          check();
        }}
      >
        <label className="flex flex-col gap-2 text-[0.9375rem]">
          Paste a credential
          <textarea
            value={pasted}
            onChange={(event) => setPasted(event.target.value)}
            rows={10}
            spellCheck={false}
            placeholder='{ "version": "stelhacks.credential.v1", … }'
            className="tabular rounded-[0.5rem] bg-paper-sunk px-4 py-3 text-[0.8125rem] ring-1 ring-inset ring-rule"
          />
        </label>

        <Button size="sm" type="submit" disabled={pasted.trim().length === 0}>
          Check it
        </Button>
      </form>

      {outcome !== null && <VerifyResult outcome={outcome} />}
    </div>
  );
}

/**
 * The check, as a function, so it can be tested without a page.
 *
 * Shape first: a reader who pasted half a file should be told that rather than
 * told a signature failed. The shape rules are the credential format's own, kept
 * narrow here to what a verifier must insist on.
 */
export function verify(pasted: string, ourKeyId: string | null): VerifyOutcome {
  let parsed: unknown;

  try {
    parsed = JSON.parse(pasted);
  } catch {
    return blank([{ field: "$", says: "is not JSON" }]);
  }

  if (Array.isArray(parsed)) {
    /* An export is a list of credentials. Checking one at a time is the honest
       interface: a list where the third is forged and the rest are fine must
       not read as one verdict. */
    return blank([
      { field: "$", says: "is a list of credentials; paste one of them on its own" },
    ]);
  }

  if (parsed === null || typeof parsed !== "object") {
    return blank([{ field: "$", says: "is not a credential object" }]);
  }

  const credential = parsed as Record<string, unknown>;
  const problems = shapeProblems(credential);

  if (problems.length > 0) {
    return blank(problems);
  }

  const { signature, id, ...payload } = credential;

  void id;

  const keyId = String((credential["issuer"] as Record<string, unknown>)["keyId"]);
  const valid = verifyPayload(payload, String(signature), keyId);

  return {
    ok: valid,
    id: typeof id === "string" ? id : null,
    format: [],
    signature: {
      valid,
      keyId,
      says: valid
        ? "The signature covers this credential exactly as it is written here."
        : "A field has changed since it was signed, or this key is not the signer.",
    },
    issuedByUs: ourKeyId === null ? null : ourKeyId === keyId,
    claim: credential["claim"] as VerifyOutcome["claim"],
    evidence: credential["evidence"] as VerifyOutcome["evidence"],
    subject: credential["subject"] as VerifyOutcome["subject"],
  };
}

function blank(format: { field: string; says: string }[]): VerifyOutcome {
  return {
    ok: false,
    id: null,
    format,
    signature: null,
    issuedByUs: null,
    claim: null,
    evidence: null,
    subject: null,
  };
}

function shapeProblems(credential: Record<string, unknown>): { field: string; says: string }[] {
  const problems: { field: string; says: string }[] = [];
  const say = (field: string, says: string) => problems.push({ field, says });

  if (credential["version"] !== "stelhacks.credential.v1") {
    say("version", "is not stelhacks.credential.v1");
  }
  if (typeof credential["signature"] !== "string" || !SIGNATURE.test(credential["signature"])) {
    say("signature", "is not a 64 byte hex signature");
  }

  const subject = credential["subject"] as Record<string, unknown> | undefined;

  if (subject === undefined || typeof subject["address"] !== "string" || !ADDRESS.test(subject["address"])) {
    say("subject.address", "is not a Stellar account address");
  }

  const issuer = credential["issuer"] as Record<string, unknown> | undefined;

  if (issuer === undefined || typeof issuer["keyId"] !== "string" || !ADDRESS.test(issuer["keyId"])) {
    say("issuer.keyId", "is not a Stellar account address");
  }

  const evidence = credential["evidence"] as Record<string, unknown> | undefined;

  if (evidence === undefined || typeof evidence["contract"] !== "string" || !CONTRACT.test(evidence["contract"])) {
    say("evidence.contract", "is not a contract address");
  } else {
    for (const field of ["constitutionHash", "payoutTxHash", "submissionDigest", "scoreRoot"]) {
      const held = evidence[field];

      if (held !== null && held !== undefined && (typeof held !== "string" || !HEX32.test(held))) {
        say(`evidence.${field}`, "is neither a 32 byte hex digest nor null");
      }
    }
  }

  const claim = credential["claim"] as Record<string, unknown> | undefined;

  if (claim === undefined) {
    say("claim", "is missing");
  } else if (claim["kind"] !== "placement" && claim["kind"] !== "participation") {
    say("claim.kind", "is neither placement nor participation");
  }

  return problems;
}
