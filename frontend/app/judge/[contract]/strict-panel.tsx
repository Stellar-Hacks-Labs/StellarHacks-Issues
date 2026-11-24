"use client";

import { useState } from "react";

import { Button } from "../../components/primitives";
import { SpecLabel, SpecRow, SpecRows, SpecValue } from "../../components/spec";
import { commitmentHex, commitmentOf, randomSalt, saltHex, type Scorecard } from "../../../lib/strict";

/**
 * Strict-mode scoring for one project.
 *
 * Two steps and both cost a signature: commit during judging, disclose after
 * the window. The salt stays in the browser until the disclose; losing it
 * means the commitment can never open, which is why it is shown once and
 * offered for download rather than kept only in memory.
 */

export function StrictPanel({
  scorecard,
  phase,
  onCommit,
  onDisclose,
}: {
  scorecard: Scorecard;
  /** Contract phase number: 4 is judging, 5 is reveal. */
  phase: number | null;
  onCommit: (commitment: Uint8Array, salt: Uint8Array) => Promise<void>;
  onDisclose: (scorecard: Scorecard, salt: Uint8Array) => Promise<void>;
}) {
  const [salt, setSalt] = useState<Uint8Array | null>(null);
  const [commitment, setCommitment] = useState<Uint8Array | null>(null);
  const [busy, setBusy] = useState(false);
  const [refused, setRefused] = useState<string | null>(null);

  const judging = phase === 4;
  const reveal = phase === 5;

  async function prepare() {
    setRefused(null);
    const next = randomSalt();
    const digest = await commitmentOf(scorecard, next);
    setSalt(next);
    setCommitment(digest);
  }

  async function commit() {
    if (commitment === null || salt === null) {
      return;
    }

    setBusy(true);
    setRefused(null);

    try {
      await onCommit(commitment, salt);
    } catch (error) {
      setRefused(error instanceof Error ? error.message : "The commitment was refused.");
    } finally {
      setBusy(false);
    }
  }

  async function disclose() {
    if (salt === null) {
      setRefused("No salt is held for this card. Commit again if the window is still open.");
      return;
    }

    setBusy(true);
    setRefused(null);

    try {
      await onDisclose(scorecard, salt);
    } catch (error) {
      setRefused(error instanceof Error ? error.message : "The disclose was refused.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 space-y-4">
      <p className="text-[0.9375rem] text-ink-soft">
        This hackathon runs the strict judging mode. You commit a digest on chain
        during judging and open it yourself after the deadline. There is no
        collection service in between.
      </p>

      <SpecRows>
        <SpecRow>
          <SpecLabel>Phase</SpecLabel>
          <SpecValue>{judging ? "Judging — commit now" : reveal ? "Reveal — disclose now" : "Waiting"}</SpecValue>
        </SpecRow>
        {commitment !== null && salt !== null ? (
          <>
            <SpecRow>
              <SpecLabel>Commitment</SpecLabel>
              <SpecValue className="font-mono text-[0.8125rem] break-all">
                {commitmentHex(commitment)}
              </SpecValue>
            </SpecRow>
            <SpecRow>
              <SpecLabel>Salt</SpecLabel>
              <SpecValue className="font-mono text-[0.8125rem] break-all">{saltHex(salt)}</SpecValue>
            </SpecRow>
          </>
        ) : null}
      </SpecRows>

      {refused !== null ? <p className="text-[0.9375rem] text-rose-700">{refused}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="button" disabled={busy} onClick={() => void prepare()}>
          Prepare commitment
        </Button>
        <Button type="button" disabled={busy || !judging || commitment === null} onClick={() => void commit()}>
          Commit on chain
        </Button>
        <Button type="button" disabled={busy || !reveal || salt === null} onClick={() => void disclose()}>
          Disclose
        </Button>
      </div>
    </div>
  );
}
