export function directRecipients(fields: Record<string, unknown>): string[] {
  return [fields["applicant"], fields["judge"], fields["recipient"]].filter((value): value is string => typeof value === "string");
}
