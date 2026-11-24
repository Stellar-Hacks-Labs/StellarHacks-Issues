//! Strict judging: each judge commits on chain and discloses after the window.

use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{symbol_short, Address, BytesN, String};

use crate::commitments::{scorecard_commitment, Salt};
use crate::constitution::{JudgingMode, VotePolicy};
use crate::errors::Error;
use crate::phase::Phase;
use crate::scorecard::{CriterionScore, Scorecard};
use crate::test::Fixture;
use soroban_sdk::vec;

/// A strict-mode hackathon in its judging window, with one project entered.
struct Strict {
    fixture: Fixture,
    team: u32,
}

impl Strict {
    fn new() -> Strict {
        let fixture = Fixture::funded_and_open_with(|constitution| {
            constitution.judging_mode = JudgingMode::Strict;
            constitution.vote = VotePolicy::judges_only();
            constitution.schedule.community_vote_opens_at = 0;
            constitution.schedule.community_vote_closes_at = 0;
            // One card is enough for these checks; quorum is not what they
            // are about.
            constitution.judge_quorum = 1;
        });

        let schedule = fixture.client.state().schedule;
        fixture
            .env
            .ledger()
            .set_timestamp(schedule.registration_opens_at + 3_600);

        let captain = Address::generate(&fixture.env);
        fixture.client.apply(&captain);
        let organizer = fixture.organizer.clone();
        fixture.client.approve_application(&organizer, &captain);

        let team = fixture.client.create_team(&captain);
        fixture.client.submit_project(
            &captain,
            &team,
            &symbol_short!("payments"),
            &BytesN::from_array(&fixture.env, &[1u8; 32]),
            &String::from_str(&fixture.env, "ipfs://cid"),
        );

        fixture
            .env
            .ledger()
            .set_timestamp(schedule.submission_closes_at + 1);
        fixture.client.advance_phase();
        fixture
            .env
            .ledger()
            .set_timestamp(schedule.screening_closes_at + 1);
        fixture.client.advance_phase();

        Strict { fixture, team }
    }

    fn scorecard(&self, judge: &Address, technical: u32, novelty: u32) -> Scorecard {
        Scorecard {
            judge: judge.clone(),
            team: self.team,
            scores: vec![
                &self.fixture.env,
                CriterionScore {
                    criterion: symbol_short!("technical"),
                    score: technical,
                },
                CriterionScore {
                    criterion: symbol_short!("novelty"),
                    score: novelty,
                },
            ],
        }
    }

    fn salt(&self) -> Salt {
        BytesN::from_array(&self.fixture.env, &[0x11u8; 16])
    }

    fn judge(&self, index: u32) -> Address {
        self.fixture
            .client
            .constitution()
            .judges
            .get(index)
            .unwrap()
            .judge
    }

    fn commit(&self, card: &Scorecard, salt: &Salt) {
        let digest = scorecard_commitment(&self.fixture.env, card, salt);
        self.fixture
            .client
            .commit_scorecard(&card.judge, &card.team, &digest);
    }

    fn advance_to_reveal(&self) {
        let closes_at = self.fixture.client.state().schedule.judging_closes_at;
        self.fixture.env.ledger().set_timestamp(closes_at + 1);
        self.fixture.client.advance_phase();
        assert_eq!(self.fixture.client.phase(), Phase::Reveal);
    }
}

/// A commitment can only be posted while the judging window is open.
#[test]
fn a_judge_can_commit_during_the_window() {
    let strict = Strict::new();
    let judge = strict.judge(0);
    let card = strict.scorecard(&judge, 80, 60);
    let salt = strict.salt();

    strict.commit(&card, &salt);

    let digest = scorecard_commitment(&strict.fixture.env, &card, &salt);
    assert_eq!(
        strict.fixture.client.commitment(&strict.team, &judge),
        digest
    );
}

/// A second commitment for the same project would let a judge replace their
/// marks after seeing how the rest of the bench is leaning.
#[test]
fn the_same_judge_cannot_commit_twice_for_one_project() {
    let strict = Strict::new();
    let judge = strict.judge(0);
    let card = strict.scorecard(&judge, 80, 60);
    let salt = strict.salt();

    strict.commit(&card, &salt);

    assert_eq!(
        strict
            .fixture
            .client
            .try_commit_scorecard(
                &judge,
                &strict.team,
                &scorecard_commitment(&strict.fixture.env, &card, &salt)
            )
            .err(),
        Some(Ok(Error::ScorecardAlreadyRecorded))
    );
}

#[test]
fn a_commitment_after_the_window_closes_is_refused() {
    let strict = Strict::new();
    let judge = strict.judge(0);
    let card = strict.scorecard(&judge, 80, 60);
    let salt = strict.salt();
    let closes_at = strict.fixture.client.state().schedule.judging_closes_at;
    strict.fixture.env.ledger().set_timestamp(closes_at + 1);

    assert_eq!(
        strict
            .fixture
            .client
            .try_commit_scorecard(
                &judge,
                &strict.team,
                &scorecard_commitment(&strict.fixture.env, &card, &salt)
            )
            .err(),
        Some(Ok(Error::DeadlinePassed))
    );
}

/// Easy mode still owns the sealed path; a strict call against it has to die
/// at the mode check rather than at some later gate that would confuse a
/// client.
#[test]
fn the_easy_mode_refuses_a_strict_commitment() {
    let fixture = Fixture::funded_and_open();
    let schedule = fixture.client.state().schedule;
    fixture
        .env
        .ledger()
        .set_timestamp(schedule.registration_opens_at + 3_600);

    let captain = Address::generate(&fixture.env);
    fixture.client.apply(&captain);
    fixture
        .client
        .approve_application(&fixture.organizer, &captain);
    let team = fixture.client.create_team(&captain);
    fixture.client.submit_project(
        &captain,
        &team,
        &symbol_short!("payments"),
        &BytesN::from_array(&fixture.env, &[1u8; 32]),
        &String::from_str(&fixture.env, "ipfs://cid"),
    );
    fixture
        .env
        .ledger()
        .set_timestamp(schedule.submission_closes_at + 1);
    fixture.client.advance_phase();
    fixture
        .env
        .ledger()
        .set_timestamp(schedule.screening_closes_at + 1);
    fixture.client.advance_phase();

    let judge = fixture.client.constitution().judges.get(0).unwrap().judge;

    assert_eq!(
        fixture
            .client
            .try_commit_scorecard(&judge, &team, &BytesN::from_array(&fixture.env, &[9u8; 32]))
            .err(),
        Some(Ok(Error::WrongJudgingMode))
    );
}

/// A mismatched disclosure is refused and leaves the commitment and the
/// tallies untouched, so a forged open cannot overwrite a posted seal.
#[test]
fn a_mismatched_disclosure_is_refused_and_leaves_state_unchanged() {
    let strict = Strict::new();
    let judge = strict.judge(0);
    let card = strict.scorecard(&judge, 80, 60);
    let salt = strict.salt();
    strict.commit(&card, &salt);
    strict.advance_to_reveal();

    let forged = strict.scorecard(&judge, 100, 100);
    assert_eq!(
        strict
            .fixture
            .client
            .try_disclose_scorecard(&forged, &salt)
            .err(),
        Some(Ok(Error::CommitmentMismatch))
    );

    assert_eq!(
        strict.fixture.client.commitment(&strict.team, &judge),
        scorecard_commitment(&strict.fixture.env, &card, &salt)
    );
    assert_eq!(
        strict.fixture.client.try_score(&strict.team, &judge).err(),
        Some(Ok(Error::NotFound))
    );
    assert_eq!(strict.fixture.client.score_tally(&strict.team).count, 0);
}

/// Opening the commitment that was posted feeds the same tally path the
/// sealed reveal uses, so the ranking cannot disagree between the modes on
/// the same marks.
#[test]
fn a_matching_disclosure_feeds_the_same_tally_path_as_a_sealed_reveal() {
    let strict = Strict::new();
    let judge = strict.judge(0);
    let card = strict.scorecard(&judge, 80, 60);
    let salt = strict.salt();
    strict.commit(&card, &salt);
    strict.advance_to_reveal();

    let weighted = strict.fixture.client.disclose_scorecard(&card, &salt);
    assert_eq!(weighted, 80 * 6_000 + 60 * 4_000);
    assert_eq!(strict.fixture.client.score(&strict.team, &judge), weighted);
    assert_eq!(strict.fixture.client.score_tally(&strict.team).count, 1);
    assert_eq!(
        strict.fixture.client.score_tally(&strict.team).total,
        weighted as u64
    );
}

#[test]
fn the_same_scorecard_cannot_be_disclosed_twice() {
    let strict = Strict::new();
    let judge = strict.judge(0);
    let card = strict.scorecard(&judge, 80, 60);
    let salt = strict.salt();
    strict.commit(&card, &salt);
    strict.advance_to_reveal();
    strict.fixture.client.disclose_scorecard(&card, &salt);

    assert_eq!(
        strict
            .fixture
            .client
            .try_disclose_scorecard(&card, &salt)
            .err(),
        Some(Ok(Error::ScorecardAlreadyRecorded))
    );
}
