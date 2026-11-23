export function DecisionForm({ reportId }: { reportId: string }) {
  return (
    <form className="flex flex-col gap-2">
      <input type="hidden" name="reportId" value={reportId} />
      <label>Action
        <select name="action"><option>hide</option><option>restore</option><option>dismiss</option></select>
      </label>
      <label>Reason <textarea name="reason" required /></label>
      <button type="submit">Record decision</button>
    </form>
  );
}
