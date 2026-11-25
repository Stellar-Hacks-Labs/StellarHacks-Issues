"use client";

import { useState } from "react";

import { Button } from "../../components/primitives";
import { useWallet } from "../../components/wallet-context";

/**
 * Taking your own history with you.
 *
 * Decision 8 says a builder's profile is derived from records rather than from
 * declarations, and until now that derivation lived only here — which means the
 * honest version of somebody's history was something only this website could
 * produce. This is the export: signed JSON, one credential per claim, each
 * pointing at the chain so whoever receives it does not have to trust us.
 *
 * It asks for the **connected** wallet rather than for this profile's owner,
 * and that is deliberate on two counts. A credential is about a key, because a
 * key is what the chain recorded; and connecting the key is the only thing this
 * page can observe about who is asking. The button therefore appears on your own
 * profile and exports what your connected wallet did.
 *
 * No key material is anywhere near this component. The signing key is read on
 * the server from a variable with no `NEXT_PUBLIC_` prefix, and the function
 * that loads it throws if it is ever reached from a browser.
 */

interface Issued {
  keyId: string | null;
  credentials: (Record<string, unknown> & { id: string; claim: { kind: string } })[];
  says?: string;
}

export function ExportCredentials({ username }: { username: string }) {
  const { wallet } = useWallet();
  const address = wallet?.address ?? null;
  const [issued, setIssued] = useState<Issued | null>(null);
  const [busy, setBusy] = useState(false);
  const [refused, setRefused] = useState<string | null>(null);

  async function issue() {
    if (address === null) {
      return;
    }

    setBusy(true);
    setRefused(null);

    try {
      const answered = await fetch("/api/credentials", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const said = (await answered.json()) as Issued & { error?: string };

      if (!answered.ok) {
        setRefused(said.error ?? "The credentials could not be issued.");

        return;
      }

      setIssued(said);
    } catch {
      setRefused("The request did not reach us, so nothing was issued.");
    } finally {
      setBusy(false);
    }
  }

  const file =
    issued === null
      ? null
      : `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(issued.credentials, null, 2))}`;

  return (
    <section className="space-y-4" aria-labelledby="credentials-heading">
      <div className="space-y-2">
        <h2 id="credentials-heading" className="text-[1.25rem]">
          Export your credentials
        </h2>

        <p className="max-w-[46rem] text-[0.9375rem] leading-relaxed text-ink-soft">
          Signed JSON, one credential per placement or participation, each citing the hackathon
          contract and the transaction that paid it. Whoever you hand it to can check it with the
          SDK or on the{" "}
          <a href="/verify" className="underline underline-offset-4 hover:text-ink">
            verification page
          </a>{" "}
          — the signature says we assembled it, and the evidence links are what make it checkable
          without us.
        </p>
      </div>

      {address === null ? (
        <p className="text-[0.9375rem] text-ink-soft">
          Connect the wallet you took part with. A credential is about a key, because a key is what
          the chain recorded.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" disabled={busy} onClick={() => void issue()}>
            {busy ? "Issuing" : "Export credentials"}
          </Button>

          <span className="tabular text-[0.875rem] text-ink-faint">{address}</span>
        </div>
      )}

      {refused !== null && (
        <p role="alert" className="text-[0.9375rem] text-broken">
          {refused}
        </p>
      )}

      {issued !== null && (
        <div className="space-y-3">
          {issued.credentials.length === 0 ? (
            <p className="text-[0.9375rem] text-ink-soft">
              {issued.says ?? "There is nothing recorded for this wallet yet."}
            </p>
          ) : (
            <>
              <p className="text-[0.9375rem] text-ink-soft">
                {issued.credentials.length} credential
                {issued.credentials.length === 1 ? "" : "s"}, signed by{" "}
                <span className="tabular break-all">{issued.keyId}</span>.
              </p>

              <ul className="space-y-2">
                {issued.credentials.map((credential) => (
                  <li
                    key={credential.id}
                    className="rounded-[0.75rem] bg-paper-sunk px-5 py-3 text-[0.9375rem] ring-1 ring-inset ring-rule"
                  >
                    <p>{describe(credential)}</p>
                    <p className="tabular break-all text-[0.75rem] text-ink-faint">{credential.id}</p>
                  </li>
                ))}
              </ul>

              {file !== null && (
                <p className="text-[0.9375rem]">
                  <a
                    href={file}
                    download={`${username}-credentials.json`}
                    className="underline underline-offset-4 hover:text-ink"
                  >
                    Download the signed JSON
                  </a>
                </p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

function describe(credential: Record<string, unknown> & { claim: { kind: string } }): string {
  const claim = credential["claim"] as Record<string, unknown>;
  const evidence = credential["evidence"] as Record<string, unknown>;
  const where = typeof evidence["slug"] === "string" ? evidence["slug"] : String(evidence["contract"]);

  if (claim["kind"] === "placement") {
    return `${where}: place ${String(claim["rank"])} in ${String(claim["track"])}`;
  }

  return `${where}: took part as ${String(claim["role"])}`;
}
