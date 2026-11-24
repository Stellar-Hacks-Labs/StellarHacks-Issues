"use client";

import { useEffect, useState } from "react";

/**
 * Offer the evidence zip once the size and contents are known.
 *
 * The preview request is what makes the control honest: a reader sees what they
 * are about to keep before the download starts, including how large it is and
 * which files sit inside. Without that, a zip is just a button.
 *
 * The control is a plain anchor on purpose. A client-side Link would try to
 * treat the zip as a route; the browser needs a normal navigation so
 * Content-Disposition can start the download.
 */

interface Preview {
  bytes: number;
  files: { path: string; bytes: number }[];
}

export function BundleDownload({ contractId }: { contractId: string }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(
          `/api/bundle?contract=${encodeURIComponent(contractId)}&preview=1`,
        );
        if (!response.ok) {
          if (!cancelled) {
            setFailed(true);
          }
          return;
        }
        const body = (await response.json()) as Preview;
        if (!cancelled) {
          setPreview(body);
        }
      } catch {
        if (!cancelled) {
          setFailed(true);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [contractId]);

  if (failed) {
    return (
      <p className="text-[0.875rem] text-ink-faint">
        The evidence bundle is not available for this hackathon yet.
      </p>
    );
  }

  if (preview === null) {
    return <p className="text-[0.875rem] text-ink-faint">Measuring the evidence bundle…</p>;
  }

  return (
    <div className="grid gap-3">
      <p className="max-w-[40rem] text-[0.875rem] text-ink-soft">
        Download a self-contained archive of the constitution, every event, the sealed roots, the
        disclosures and the payouts. A verifier can check the hash manifest offline without talking
        to this site or to an RPC node.
      </p>

      <p className="text-[0.875rem] text-ink-soft">
        Archive size: <span className="tabular-nums text-ink">{formatBytes(preview.bytes)}</span>
      </p>

      <ul className="grid gap-1 text-[0.875rem] text-ink-soft">
        {preview.files.map((file) => (
          <li key={file.path} className="flex justify-between gap-4 tabular-nums">
            <span>{file.path}</span>
            <span className="text-ink-faint">{formatBytes(file.bytes)}</span>
          </li>
        ))}
      </ul>

      <div>
        <a
          href={`/api/bundle?contract=${encodeURIComponent(contractId)}`}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-ink px-4 text-[0.875rem] font-medium text-paper transition-[background-color,color,transform] duration-150 ease-settle hover:bg-ink/90 active:translate-y-px"
        >
          Download evidence bundle
        </a>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
