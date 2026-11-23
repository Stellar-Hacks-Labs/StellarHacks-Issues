"use client";

import { useState } from "react";
import { ReportDialog } from "./report-dialog";

/** Opens the report form. Filing it does not change the page's contents. */
export function ReportButton({ targetType, targetId }: { targetType: "project" | "profile"; targetId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>Report</button>
      {open ? <ReportDialog targetType={targetType} targetId={targetId} /> : null}
    </div>
  );
}
