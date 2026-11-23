"use client";

import { REPORT_CATEGORIES } from "../../lib/moderation";

export function ReportDialog({ targetType, targetId }: { targetType: "project" | "profile"; targetId: string }) {
  return (
    <form action="/api/reports" method="post" className="flex flex-col gap-2">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <label>Category
        <select name="category">{REPORT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select>
      </label>
      <label>What is wrong <textarea name="note" maxLength={500} /></label>
      <button type="submit">Send report</button>
    </form>
  );
}
