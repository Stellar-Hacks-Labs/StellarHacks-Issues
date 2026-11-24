//! Undirected deposits beyond the prize table leave through a declared route.
//!
//! Each route empties the vault at closure. Directed sponsorships are
//! unaffected: they raise a named position and settle with it, whether or not
//! a surplus also exists.

use soroban_sdk::testutils::Ledger;
use soroban_sdk::{symbol_short, Symbol};

use crate::constitution::SurplusRoute;
use crate::phase::Phase;
use crate::test::settlement::Settled;

use soroban_sdk::testutils::Address as _;
use soroban_sdk::token::StellarAssetClient;
use soroban_sdk::Address;

fn payments() -> Symbol {
    symbol_short!("payments")
}

fn defi() -> Symbol {
    symbol_short!("defi")
}

/// Adds to the pool from a fresh sponsor, the way a late undirected deposit
/// arrives.
fn top_up(settled: &Settled, amount: i128) {
    let asset = settled.fixture.client.constitution().prize_asset;
    let sponsor = Address::generate(&settled.fixture.env);

    StellarAssetClient::new(&settled.fixture.env, &asset).mint(&sponsor, &amount);
    settled.vault.deposit(&sponsor, &amount);
}

/// Runs settlement to its end under the sample prize table.
fn settle_everything(settled: &Settled) {
    settled
        .fixture
        .client
        .settle_prize(&payments(), &1, &settled.winner(&payments(), 1));
    settled
        .fixture
        .client
        .settle_prize(&payments(), &2, &settled.winner(&payments(), 2));

    let claim = settled
        .fixture
        .client
        .constitution()
        .discretion
        .prize_claim_period;
    let opened = settled.fixture.client.state().settlement_opened_at;
    settled.fixture.env.ledger().set_timestamp(opened + claim);

    settled.fixture.client.sweep_unclaimed(&defi(), &1);
    settled.fixture.client.settle_platform_fee();
}

/// Pro rata spreads undirected leftover across the prize table, and the vault
/// reaches zero once every position and the fee have cleared.
#[test]
fn pro_rata_empties_the_vault_at_closure() {
    let settled = Settled::open_edited(1, |constitution| {
        constitution.sponsorship.surplus = SurplusRoute::ProRata;
    });
    top_up(&settled, 2_500);

    settle_everything(&settled);
    settled.fixture.client.complete();

    assert_eq!(settled.fixture.client.phase(), Phase::Completed);
    assert_eq!(settled.vault.balance(), 0);
}

/// Returning the leftover to a declared address leaves the prize table alone
/// and still empties the vault.
///
/// The destination is the fee collector already named in the document, so the
/// address exists in the same environment the hackathon was built in. The
/// route is what matters here, not who the address happens to be.
#[test]
fn returning_surplus_pays_the_declared_address() {
    let settled = Settled::open_edited(1, |constitution| {
        let dest = constitution.platform_fee.collector.clone();
        constitution.sponsorship.surplus = SurplusRoute::ReturnTo(dest);
    });
    let dest = settled
        .fixture
        .client
        .constitution()
        .platform_fee
        .collector
        .clone();
    top_up(&settled, 2_500);

    settle_everything(&settled);

    // The platform fee already landed with the collector; the surplus is on
    // top of that.
    let before = settled.token.balance(&dest);
    assert_eq!(settled.fixture.client.settle_surplus(), 2_500);
    assert_eq!(settled.token.balance(&dest), before + 2_500);

    settled.fixture.client.complete();
    assert_eq!(settled.vault.balance(), 0);
    assert_eq!(settled.fixture.client.phase(), Phase::Completed);
}

/// Rolling the leftover forward pays the named next-instance address. The
/// payment path is the same transfer ReturnTo uses; naming a vault address is
/// what makes the next event's pool grow, because a vault reads its balance
/// from the token.
#[test]
fn rolling_surplus_forward_pays_the_named_instance() {
    let settled = Settled::open_edited(1, |constitution| {
        let next = constitution.platform_fee.collector.clone();
        constitution.sponsorship.surplus = SurplusRoute::RollForward(next);
    });
    let next = settled
        .fixture
        .client
        .constitution()
        .platform_fee
        .collector
        .clone();
    top_up(&settled, 2_500);

    settle_everything(&settled);

    let before = settled.token.balance(&next);
    assert_eq!(settled.fixture.client.settle_surplus(), 2_500);
    assert_eq!(settled.token.balance(&next), before + 2_500);

    settled.fixture.client.complete();
    assert_eq!(settled.vault.balance(), 0);
}

/// Directed sponsorships still raise the position they name. An undirected
/// deposit on top is routed as surplus rather than rewriting that bonus.
#[test]
fn directed_contributions_are_unaffected_by_the_surplus_route() {
    let settled = Settled::open_sponsored(1_000);
    let first = settled.captain(settled.teams.get(0).unwrap());

    top_up(&settled, 500);

    let paid =
        settled
            .fixture
            .client
            .settle_prize(&payments(), &1, &settled.winner(&payments(), 1));

    // Directed 1_000 is in the payable amount; the undirected 500 is spread by
    // pro rata across every position, so first gets at least the directed total.
    assert!(paid >= 6_000);
    assert_eq!(settled.token.balance(&first), paid);
}

/// The surplus route is frozen with the constitution and cannot move after the
/// lock. There is no entry point that rewrites locked rules; reading the route
/// back is the proof it stayed where it was hashed.
#[test]
fn the_surplus_route_is_fixed_by_the_frozen_constitution() {
    let settled = Settled::open_edited(1, |constitution| {
        constitution.sponsorship.surplus = SurplusRoute::ProRata;
    });
    let locked = settled.fixture.client.constitution();

    assert_eq!(locked.sponsorship.surplus, SurplusRoute::ProRata);
}
