import type { Decision } from "../../../lib/moderation";

export function History({ decisions }: { decisions: Decision[] }) {
  if (decisions.length === 0) return <p>No decision has been recorded.</p>;
  return (
    <ol>
      {decisions.map((decision) => (
        <li key={`${decision.reportId}:${decision.at}`}>{decision.actorId} {decision.action} at {decision.at}: {decision.reason}</li>
      ))}
    </ol>
  );
}
