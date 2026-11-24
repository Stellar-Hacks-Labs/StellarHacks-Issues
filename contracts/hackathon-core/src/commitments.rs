//! Strict-mode scorecard commitments.
//!
//! In the easy mode a collection service seals every scorecard behind one
//! Merkle root. In the strict mode each judge writes a commitment themselves
//! during the judging window and opens it after the deadline. The shape of a
//! scorecard is the same either way; only who holds the seal changes.
//!
//! The salt is what makes the commitment opaque. Without it an observer who
//! knows the rubric could brute-force every plausible mark combination and
//! read the scores before the window closed. Sixteen random bytes close that
//! door for any scorecard a hackathon actually produces.

use soroban_sdk::xdr::ToXdr;
use soroban_sdk::{Bytes, BytesN, Env};

use crate::scorecard::Scorecard;

/// Domain tag for a strict-mode commitment.
//
// Distinct from the sealed-mode leaf domain on purpose. A commitment and a
// Merkle leaf that happened to hash the same bytes would otherwise collide,
// and a client comparing digests would have no way to tell which role the
// value was playing.
pub const COMMITMENT_DOMAIN: &[u8] = b"stelhacks.v1.scorecard-commitment";

/// Sixteen random bytes, the minimum the PRD asks for.
pub type Salt = BytesN<16>;

/// The digest a judge posts during the judging window.
//
// Payload is the domain, then the scorecard's XDR, then the salt. The
// scorecard already carries the judge and the team, so those do not need a
// second encoding; the salt is what keeps the marks unreadable until the
// disclose.
pub fn scorecard_commitment(env: &Env, scorecard: &Scorecard, salt: &Salt) -> BytesN<32> {
    let mut body = scorecard.clone().to_xdr(env);
    body.extend_from_array(&salt.to_array());

    digest(env, COMMITMENT_DOMAIN, body)
}

/// Whether a disclosure opens the commitment that was posted.
pub fn matches(env: &Env, scorecard: &Scorecard, salt: &Salt, commitment: &BytesN<32>) -> bool {
    &scorecard_commitment(env, scorecard, salt) == commitment
}

fn digest(env: &Env, domain: &[u8], body: Bytes) -> BytesN<32> {
    let mut payload = Bytes::from_slice(env, domain);
    payload.append(&body);

    env.crypto().sha256(&payload).into()
}

#[cfg(test)]
mod test {
    use super::*;
    use crate::fixtures::canonical_scorecard;
    use crate::scorecard::CriterionScore;
    use soroban_sdk::{symbol_short, vec, Env};

    fn salt(env: &Env) -> Salt {
        BytesN::from_array(env, &[0x11u8; 16])
    }

    #[test]
    fn the_same_scorecard_and_salt_always_commit_the_same() {
        let env = Env::default();
        let card = canonical_scorecard(&env);
        let salt = salt(&env);

        assert_eq!(
            scorecard_commitment(&env, &card, &salt),
            scorecard_commitment(&env, &card, &salt)
        );
    }

    /// Changing a mark has to move the commitment, or a judge could improve a
    /// score after posting and still open against the old digest.
    #[test]
    fn a_changed_mark_moves_the_commitment() {
        let env = Env::default();
        let salt = salt(&env);
        let original = canonical_scorecard(&env);
        let mut improved = original.clone();
        improved.scores.set(
            0,
            CriterionScore {
                criterion: symbol_short!("technical"),
                score: 99,
            },
        );

        assert_ne!(
            scorecard_commitment(&env, &original, &salt),
            scorecard_commitment(&env, &improved, &salt)
        );
    }

    #[test]
    fn a_different_salt_moves_the_commitment() {
        let env = Env::default();
        let card = canonical_scorecard(&env);
        let first = BytesN::from_array(&env, &[0x11u8; 16]);
        let second = BytesN::from_array(&env, &[0x22u8; 16]);

        assert_ne!(
            scorecard_commitment(&env, &card, &first),
            scorecard_commitment(&env, &card, &second)
        );
    }

    #[test]
    fn matches_accepts_only_the_opening_that_was_committed() {
        let env = Env::default();
        let card = canonical_scorecard(&env);
        let salt = salt(&env);
        let commitment = scorecard_commitment(&env, &card, &salt);

        assert!(matches(&env, &card, &salt, &commitment));

        let wrong_salt = BytesN::from_array(&env, &[0x22u8; 16]);
        assert!(!matches(&env, &card, &wrong_salt, &commitment));

        let mut other = card.clone();
        other.scores = vec![
            &env,
            CriterionScore {
                criterion: symbol_short!("technical"),
                score: 1,
            },
            CriterionScore {
                criterion: symbol_short!("novelty"),
                score: 1,
            },
        ];
        assert!(!matches(&env, &other, &salt, &commitment));
    }
}
