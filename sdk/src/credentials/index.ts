export {
  CREDENTIAL_DOMAIN,
  CREDENTIAL_VERSION,
  canonicalize,
  credentialDigest,
  credentialId,
  payloadOf,
  problemsWithFormat,
  type Credential,
  type CredentialClaim,
  type CredentialEvidence,
  type CredentialIssuer,
  type CredentialPayload,
  type CredentialRole,
  type CredentialSubject,
  type FormatProblem,
  type ParticipationClaim,
  type PlacementClaim,
} from "./format.js";
export {
  REVEAL_PHASE,
  coverageOf,
  problemsAgainstEvidence,
  revealed,
  type EvidenceProblem,
  type ObservedEvent,
} from "./evidence.js";
export {
  canonicalCredential,
  changedFields,
  verifyCredential,
  verifySignature,
  type CredentialReport,
} from "./verify.js";
