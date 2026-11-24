//! The missing-judge fallback, enforced at ranking time.
//!
//! A project that finishes short of the announced quorum used to vanish from
//! the board with no rule naming why. These tests pin each frozen policy to
//! the placements it produces, and check that a judge who never scores cannot
//! rearrange anyone beyond what the policy allows.

use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{symbol_short, vec, Address, BytesN, String, Vec};

use crate::constitution::MissingJudgeFallback;
use crate::hashing::scorecard_leaf;
use crate::scorecard::{CriterionScore, Scorecard};
use crate::test::{build_tree, Fixture};

fn payments() -> soroban_sdk::Symbol {
    symbol_short!("payments")
}

/// Two teams enter payments; the first is scored by every judge, the second by
/// only the first `second_scores` of them.
fn ranked_with(
    fallback: MissingJudgeFallback,
    second_scores: u32,
) -> (Fixture, Vec<u32>) {
    let fixture = Fixture::funded_and_open_with(|constitution| {
        constitution.missing_judge_fallback = fallback;
    });
    let env = fixture.env.clone();
    let schedule = fixture.client.state().schedule;

    env.ledger()
        .set_timestamp(schedule.registration_opens_at + 3_600);

    let mut teams = Vec::new(&env);
    for digest in 1u8..=2 {
        let captain = Address::generate(&env);
        fixture.client.apply(&captain);
        let organizer = fixture.organizer.clone();
        fixture.client.approve_application(&organizer, &captain);

        let team = fixture.client.create_team(&captain);
        fixture.client.submit_project(
            &captain,
            &team,
            &payments(),
            &BytesN::from_array(&env, &[digest; 32]),
            &String::from_str(&env, "ipfs://cid"),
        );
        teams.push_back(team);
    }

    env.ledger()
        .set_timestamp(schedule.submission_closes_at + 1);
    fixture.client.advance_phase();
    env.ledger().set_timestamp(schedule.screening_closes_at + 1);
    fixture.client.advance_phase();

    let mut cards = Vec::new(&env);
    for index in 0..3u32 {
        let judge = fixture
            .client
            .constitution()
            .judges
            .get(index)
            .unwrap()
            .judge;

        cards.push_back(scorecard(
            &judge,
            teams.get(0).unwrap(),
            90,
            80,
            &env,
        ));

        if index < second_scores {
            cards.push_back(scorecard(
                &judge,
                teams.get(1).unwrap(),
                40,
                30,
                &env,
            ));
        }
    }

    let mut leaves = Vec::new(&env);
    for index in 0..cards.len() {
        leaves.push_back(scorecard_leaf(&env, &cards.get(index).unwrap()));
    }
    let (root, proofs) = build_tree(&env, &leaves);

    env.ledger().set_timestamp(schedule.judging_closes_at);
    fixture.client.publish_score_root(&root);
    env.ledger().set_timestamp(schedule.judging_closes_at + 1);
    fixture.client.advance_phase();

    for index in 0..cards.len() {
        fixture
            .client
            .reveal_score(&cards.get(index).unwrap(), &proofs.get(index).unwrap());
    }

    fixture.client.finalize_results();

    (fixture, teams)
}

fn scorecard(
    judge: &Address,
    team: u32,
    technical: u32,
    novelty: u32,
    env: &soroban_sdk::Env,
) -> Scorecard {
    Scorecard {
        judge: judge.clone(),
        team,
        scores: vec![
            env,
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

/// Exclude keeps the historical answer: short of quorum means not ranked.
#[test]
fn exclude_leaves_a_short_bench_out_of_the_ranking() {
    let (fixture, teams) = ranked_with(MissingJudgeFallback::Exclude, 2);
    let ranking = fixture.client.ranking(&payments());

    assert_eq!(ranking.len(), 1);
    assert_eq!(ranking.get(0).unwrap().team, teams.get(0).unwrap());
    assert!(!ranking.get(0).unwrap().under_fallback);
}

/// A floor of two scorecards still ranks a project that gathered exactly that.
#[test]
fn rank_available_admits_a_project_at_the_floor() {
    let (fixture, teams) = ranked_with(MissingJudgeFallback::RankAvailable(2), 2);
    let ranking = fixture.client.ranking(&payments());

    assert_eq!(ranking.len(), 2);
    assert_eq!(ranking.get(0).unwrap().team, teams.get(0).unwrap());
    assert_eq!(ranking.get(1).unwrap().team, teams.get(1).unwrap());
    assert!(!ranking.get(0).unwrap().under_fallback);
    assert!(ranking.get(1).unwrap().under_fallback);
}

/// Below the floor is still exclusion, even when the policy is RankAvailable.
#[test]
fn rank_available_still_excludes_below_the_floor() {
    let (fixture, teams) = ranked_with(MissingJudgeFallback::RankAvailable(2), 1);
    let ranking = fixture.client.ranking(&payments());

    assert_eq!(ranking.len(), 1);
    assert_eq!(ranking.get(0).unwrap().team, teams.get(0).unwrap());
}

/// An allowance of one missing judge is the dual of a floor of quorum minus one.
#[test]
fn reassign_admits_a_shortfall_inside_the_allowance() {
    let (fixture, teams) = ranked_with(MissingJudgeFallback::Reassign(1), 2);
    let ranking = fixture.client.ranking(&payments());

    assert_eq!(ranking.len(), 2);
    assert_eq!(ranking.get(1).unwrap().team, teams.get(1).unwrap());
    assert!(ranking.get(1).unwrap().under_fallback);
}

/// A judge who never scores cannot change the order of projects that already
/// met the quorum: the fully scored project stays first, and the short one is
/// either admitted under the policy or left out, never promoted above it.
#[test]
fn a_silent_judge_cannot_reorder_a_fully_scored_project() {
    let (fixture, teams) = ranked_with(MissingJudgeFallback::RankAvailable(2), 2);
    let ranking = fixture.client.ranking(&payments());

    assert_eq!(ranking.get(0).unwrap().team, teams.get(0).unwrap());
    assert!(
        ranking.get(0).unwrap().final_score > ranking.get(1).unwrap().final_score,
        "the fully scored project stays ahead of the fallback entry"
    );
}
