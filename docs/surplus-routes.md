# Surplus Routes

How deposits beyond the frozen prize table are routed out of the vault at closure.

## Background

The prize vault accepts deposits from anyone at any phase without restriction. However, under earlier designs, every route out of the vault was strictly tied to declared prize positions in the frozen prize table.

When sponsors deposited funds directly into the vault beyond the prize table (or late undirected contributions arrived), those excess funds were stranded at settlement. The core contract had no withdrawal function by design, leaving an undirected surplus stuck in the vault when the hackathon reached the `Completed` phase (as asserted in `a_surplus_beyond_the_prize_table_has_no_route_out_yet`).

## Constitution-Bound Surplus Routes

To guarantee that the vault reaches exactly zero balance at closure without compromising security or immutability, the organizer binds an explicit `SurplusRoute` in the sponsorship policy before the constitution locks:

```rust
pub enum SurplusRoute {
    /// Tops up all payable positions pro rata in proportion to their prize amount.
    ProRata,
    /// Returns the surplus to a declared recipient address.
    Return(Address),
    /// Rolls the surplus into the prize vault of a named next hackathon instance.
    Roll(Address),
}
```

### Route Semantics

1. **`ProRata`**:
   The remaining surplus is divided among all payable prize positions proportional to their base prize tier amount (`tier.amount`). Any leftover due to integer division is placed on the top position (lowest rank). Each winning team/member receives their pro rata share automatically.

2. **`Return(Address)`**:
   The entire surplus amount is transferred directly to the declared address (such as the sponsor or organizer treasury).

3. **`Roll(Address)`**:
   The entire surplus amount is transferred into the vault of the next scheduled hackathon instance, bootstrapping its prize pool.

## Lifecycle Enforcement

- **Constitution Lock**: The `surplus_route` is declared inside `SponsorshipPolicy` within the constitution. When `lock_rules()` is signed, this route is immutably sealed and hashed into the constitution digest.
- **Settlement Execution**: During `complete()`, after all prize positions and platform fees are paid or swept, `hackathon-core` queries `VaultClient::new(&env, &vault).balance()`.
- If `surplus > 0`, the core contract executes the declared route, commands `prize-vault.pay(...)`, and emits `SurplusRouted`.
- In all routes, the vault balance reaches exactly zero when the hackathon advances to `Phase::Completed`.
