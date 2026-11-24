export interface Funnel {
  applications: number;
  approved: number;
  submissions: number;
}
export function funnelRows(value: Funnel) {
  return [
    { label: "Applications", count: value.applications },
    { label: "Approved", count: value.approved },
    { label: "Submissions", count: value.submissions },
  ];
}
