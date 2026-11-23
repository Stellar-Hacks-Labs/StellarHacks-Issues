/** Names of the roles a journey signs in as. Secrets come from the environment, never from this file. */
export const ACCOUNTS = ["organizer", "participant", "judge", "voter", "observer"] as const;
export type AccountName = (typeof ACCOUNTS)[number];
