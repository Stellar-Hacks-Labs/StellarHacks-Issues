use soroban_sdk::{contracttype, Address};

use crate::errors::Error;

/// How judges seal their scorecards until the reveal.
//
// The easy mode carries the address that will seal them, because that address
// is the one piece of trust this design does not remove and hiding it would be
// dishonest. A participant reading the rules sees exactly who collects the
// scorecards and publishes their root, and knows that if that party leaves one
// out, the judge it belonged to can prove it.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum JudgingMode {
    /// The judge signs a scorecard off chain in a single action, paying no fee
    /// and never having to come back. The collection service publishes a Merkle
    /// root when the window closes, and the leaves at the reveal.
    //
    // This is the default because the alternative loses scorecards. A judge who
    // must return to reveal is a judge who sometimes does not, and a missing
    // scorecard breaks the quorum for a project that did nothing wrong. The
    // cost is that the collection service could in theory omit a scorecard,
    // which is why every submission returns a signed receipt and every judge
    // gets an inclusion proof the moment the root is published.
    Easy(Address),
    /// The judge writes a commitment on chain themselves and opens it
    /// themselves. Two transactions, no trust in any service.
    //
    // For events where the prize is large enough, or the dispute risk high
    // enough, that the easy mode's trust assumption is not acceptable.
    Strict,
}

impl JudgingMode {
    /// The address allowed to seal the scorecards, if any.
    pub fn sealer(&self) -> Option<Address> {
        match self {
            JudgingMode::Easy(sealer) => Some(sealer.clone()),
            JudgingMode::Strict => None,
        }
    }

    /// Whether a collection service stands between the judge and the chain.
    pub fn relies_on_collection_service(&self) -> bool {
        matches!(self, JudgingMode::Easy(_))
    }
}

/// What happens when a project finishes judging short of the announced quorum.
//
// Leaving the answer unwritten made shortfall an invisible exclusion: the
// ranking simply omitted the project, and a team that did nothing wrong learned
// it only by reading who was missing from the board. Freezing one of these
// before the lock turns that into a rule participants can read and the contract
// can enforce the same way in every language.
//
// The three shapes are the ones the product can honour at ranking time without
// inventing a mid-event judge swap the contract has no entry point for. Exclude
// keeps the historical answer. RankAvailable names a floor of scorecards that
// still count. Reassign names how many assigned judges may fail to score before
// the project is still ranked — the "reassignment" is of scoring burden onto
// the remaining bench, not a live appointment of a substitute.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MissingJudgeFallback {
    /// Projects short of the quorum are left out of the ranking.
    Exclude,
    /// Rank on the scorecards that arrived, provided at least this many did.
    //
    // The floor must be positive and strictly below the quorum: zero would
    // rank a project nobody scored, and a floor at or above the quorum is the
    // quorum under another name.
    RankAvailable(u32),
    /// Rank when the shortfall is at most this many judges.
    //
    // An allowance of zero is Exclude under another name. An allowance at or
    // above the quorum would admit a project nobody scored. Both are refused.
    Reassign(u32),
}

impl MissingJudgeFallback {
    /// Rejects a policy that cannot be told apart from the quorum itself, or
    /// that would rank a project with no scorecards at all.
    pub fn validate(&self, judge_quorum: u32) -> Result<(), Error> {
        match self {
            MissingJudgeFallback::Exclude => Ok(()),
            MissingJudgeFallback::RankAvailable(floor) => {
                if *floor == 0 || *floor >= judge_quorum {
                    return Err(Error::ConstitutionInvalid);
                }
                Ok(())
            }
            MissingJudgeFallback::Reassign(allowance) => {
                if *allowance == 0 || *allowance >= judge_quorum {
                    return Err(Error::ConstitutionInvalid);
                }
                Ok(())
            }
        }
    }

    /// How many scorecards a project needs under this policy.
    pub fn scores_required(&self, judge_quorum: u32) -> u32 {
        match self {
            MissingJudgeFallback::Exclude => judge_quorum,
            MissingJudgeFallback::RankAvailable(floor) => *floor,
            MissingJudgeFallback::Reassign(allowance) => {
                let needed = judge_quorum.saturating_sub(*allowance);
                if needed == 0 {
                    1
                } else {
                    needed
                }
            }
        }
    }
}

#[cfg(test)]
mod test {
    use super::{JudgingMode, MissingJudgeFallback};
    use crate::errors::Error;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::{Address, Env};

    #[test]
    fn the_easy_mode_names_the_service_it_leans_on() {
        let env = Env::default();
        let sealer = Address::generate(&env);
        let mode = JudgingMode::Easy(sealer.clone());

        assert!(mode.relies_on_collection_service());
        assert_eq!(mode.sealer(), Some(sealer));
    }

    #[test]
    fn the_strict_mode_leans_on_nobody() {
        assert!(!JudgingMode::Strict.relies_on_collection_service());
        assert_eq!(JudgingMode::Strict.sealer(), None);
    }

    #[test]
    fn exclude_asks_for_the_full_quorum() {
        assert_eq!(MissingJudgeFallback::Exclude.scores_required(3), 3);
        assert_eq!(MissingJudgeFallback::Exclude.validate(3), Ok(()));
    }

    #[test]
    fn a_floor_inside_the_quorum_is_accepted() {
        let policy = MissingJudgeFallback::RankAvailable(2);

        assert_eq!(policy.validate(3), Ok(()));
        assert_eq!(policy.scores_required(3), 2);
    }

    #[test]
    fn a_floor_of_zero_or_at_the_quorum_is_rejected() {
        assert_eq!(
            MissingJudgeFallback::RankAvailable(0).validate(3),
            Err(Error::ConstitutionInvalid)
        );
        assert_eq!(
            MissingJudgeFallback::RankAvailable(3).validate(3),
            Err(Error::ConstitutionInvalid)
        );
    }

    #[test]
    fn an_allowance_inside_the_quorum_is_accepted() {
        let policy = MissingJudgeFallback::Reassign(1);

        assert_eq!(policy.validate(3), Ok(()));
        assert_eq!(policy.scores_required(3), 2);
    }

    #[test]
    fn an_allowance_of_zero_or_at_the_quorum_is_rejected() {
        assert_eq!(
            MissingJudgeFallback::Reassign(0).validate(3),
            Err(Error::ConstitutionInvalid)
        );
        assert_eq!(
            MissingJudgeFallback::Reassign(3).validate(3),
            Err(Error::ConstitutionInvalid)
        );
    }
}
