import { serverClient } from "../supabase/server";
import { shapeAnalytics } from "./shape";
export async function readOrganizerAnalytics(contract: string) {
  const db = await serverClient();
  if (!db) return null;
  const [funnel, judges, turnout] = await Promise.all([
    db
      .from("organizer_funnel")
      .select("applications,approved,submissions")
      .eq("contract_id", contract)
      .maybeSingle(),
    db
      .from("organizer_judge_progress")
      .select("expected,completed")
      .eq("contract_id", contract)
      .maybeSingle(),
    db
      .from("organizer_vote_turnout")
      .select("eligible,ballots")
      .eq("contract_id", contract)
      .maybeSingle(),
  ]);
  if (funnel.error || judges.error || turnout.error) return null;
  return shapeAnalytics(funnel.data, judges.data, turnout.data);
}
