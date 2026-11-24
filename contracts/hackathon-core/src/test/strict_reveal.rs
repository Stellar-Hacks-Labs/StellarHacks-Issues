//! Strict disclose against the sealed ranking path, and withheld openings.

use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{symbol_short, Address, BytesN, String};

use crate::commitments::{scorecard_commitment, Salt};
use crate::constitution::{JudgingMode, VotePolicy};
use crate::hashing::scorecard_leaf;
use crate::merkle;
use crate::phase::Phase;
use crate::scorecard::{CriterionScore, Scorecard};
use crate::test::Fixture;
use soroban_sdk::vec;

fn salt(env: &soroban_sdk::Env) -> Salt {
    BytesN::from_array(env, &[0x11u8; 16])
}

fn scorecard(env: &soroban_sdk::Env, judge: &Address, team: u32, a: u32, b: u32) -> Scorecard {
    Scorecard {
        judge: judge.clone(),
        team,
        scores: vec![
            env,
            CriterionScore {
                criterion: symbol_short!("technical"),
                score: a,
            },
            CriterionScore {
                criterion: symbol_short!("novelty"),
                score: b,
            },
        ],
    }
}

/// Stand a hackathon in judging with one project, under either mode.
fn judging(strict: bool) -> (Fixture, u32) {
    let fixture = if strict {
        Fixture::funded_and_open_with(|constitution| {
            constitution.judging_mode = JudgingMode::Strict;
            constitution.vote = VotePolicy::judges_only();
            constitution.schedule.community_vote_opens_at = 0;
            constitution.schedule.community_vote_closes_at = 0;
            constitution.judge_quorum = 1;
        })
    } else {
        Fixture::funded_and_open_with(|constitution| {
            constitution.vote = VotePolicy::judges_only();
            constitution.schedule.community_vote_opens_at = 0;
            constitution.schedule.community_vote_closes_at = 0;
            constitution.judge_quorum = 1;
        })
    };

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

    (fixture, team)
}

/// Ranking from strict mode matches sealed mode on the same scores.
#[test]
fn ranking_from_strict_mode_matches_sealed_mode_on_the_same_scores() {
    let sealed_average = {
        let (fixture, team) = judging(false);
        let judge_a = fixture.client.constitution().judges.get(0).unwrap().judge;
        let judge_b = fixture.client.constitution().judges.get(1).unwrap().judge;
        let card_a = scorecard(&fixture.env, &judge_a, team, 80, 60);
        let card_b = scorecard(&fixture.env, &judge_b, team, 70, 90);

        let leaf_a = scorecard_leaf(&fixture.env, &card_a);
        let leaf_b = scorecard_leaf(&fixture.env, &card_b);
        let root = merkle::node(&fixture.env, &leaf_a, &leaf_b);

        let closes_at = fixture.client.state().schedule.judging_closes_at;
        fixture.env.ledger().set_timestamp(closes_at);
        fixture.client.publish_score_root(&root);
        fixture.env.ledger().set_timestamp(closes_at + 1);
        fixture.client.advance_phase();

        fixture
            .client
            .reveal_score(&card_a, &vec![&fixture.env, leaf_b]);
        fixture
            .client
            .reveal_score(&card_b, &vec![&fixture.env, leaf_a]);

        fixture.client.score_tally(&team).average().unwrap()
    };

    let strict_average = {
        let (fixture, team) = judging(true);
        let judge_a = fixture.client.constitution().judges.get(0).unwrap().judge;
        let judge_b = fixture.client.constitution().judges.get(1).unwrap().judge;
        let card_a = scorecard(&fixture.env, &judge_a, team, 80, 60);
        let card_b = scorecard(&fixture.env, &judge_b, team, 70, 90);
        let salt = salt(&fixture.env);

        for card in [&card_a, &card_b] {
            let digest = scorecard_commitment(&fixture.env, card, &salt);
            fixture
                .client
                .commit_scorecard(&card.judge, &card.team, &digest);
        }

        let closes_at = fixture.client.state().schedule.judging_closes_at;
        fixture.env.ledger().set_timestamp(closes_at + 1);
        fixture.client.advance_phase();
        assert_eq!(fixture.client.phase(), Phase::Reveal);

        fixture.client.disclose_scorecard(&card_a, &salt);
        fixture.client.disclose_scorecard(&card_b, &salt);

        fixture.client.score_tally(&team).average().unwrap()
    };

    assert_eq!(sealed_average, strict_average);
}

/// A judge who commits and never discloses leaves that card out of the tally.
/// The commitment stays on chain so the omission is visible rather than silent.
#[test]
fn a_withheld_disclosure_leaves_the_commitment_and_omits_the_score() {
    let (fixture, team) = judging(true);
    let judge = fixture.client.constitution().judges.get(0).unwrap().judge;
    let other = fixture.client.constitution().judges.get(1).unwrap().judge;
    let salt = salt(&fixture.env);

    let withheld = scorecard(&fixture.env, &judge, team, 80, 60);
    let opened = scorecard(&fixture.env, &other, team, 70, 90);

    for card in [&withheld, &opened] {
        let digest = scorecard_commitment(&fixture.env, card, &salt);
        fixture
            .client
            .commit_scorecard(&card.judge, &card.team, &digest);
    }

    let closes_at = fixture.client.state().schedule.judging_closes_at;
    fixture.env.ledger().set_timestamp(closes_at + 1);
    fixture.client.advance_phase();

    // Only the second judge discloses. The first commitment stands as proof
    // that a card was sealed and never opened.
    fixture.client.disclose_scorecard(&opened, &salt);

    assert!(fixture.client.try_score(&team, &judge).is_err());
    assert_eq!(
        fixture.client.commitment(&team, &judge),
        scorecard_commitment(&fixture.env, &withheld, &salt)
    );
    assert_eq!(fixture.client.score_tally(&team).count, 1);
    assert_eq!(fixture.client.score(&team, &other), 70 * 6_000 + 90 * 4_000);
}
