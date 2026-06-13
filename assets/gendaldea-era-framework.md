# Gendaldea — Three-Era Framework

Ground rules for back-projecting the Gendaldea archipelago sector across three eras.
Tied to the *Imperium* chronology in the espacesociety macropedia
(First Expanse → First Decline → Imperium).

## Files

Each era has its own directory under `assets/`:

- `gendaldea-expanse-era/` — end of the First Expanse (greatest extent, pre-Decline)
- `gendaldea-decline-era/` — the First Decline (network shattered)
- `gendaldea-imperium-era/` — height of the Imperium (the **baseline**)

The `*.json` in each directory currently **starts as an identical copy of the
Imperium-height baseline**. Expanse and Decline are *derived* from it via an
`adjustment.md` ledger (two-pass: write the ledger, review, then apply to JSON).
Source map: `assets/gendaldea-archipelago.json` / `.svg`.

## Era chronology & character

| Era | Centuries | Tech peak | Governance | Population |
|-----|-----------|-----------|------------|-----------|
| **First Expanse** | 24c–26c | **TL 13** (the *higher* peak) | No central government — Oligarch/corporate/national/religious patchwork | Smallest |
| **First Decline** | 27c–37c | regresses (isolation) | Balkanized / warlord / feudal as the network shatters | Growing |
| **Imperium** (*Bellicose* era) | later | recovers only to ~TL 11 (lost Ancient tech) | Unified empire — but only **2 islands** are imperial | Largest |

Key inversion: **the Imperium is NOT the tech high-water mark.** The Expanse
reached TL 13; the Imperium claws back only to ~11. The Imperium baseline's low
tail (TL-0 worlds, X-ports, empty worlds) is read as **Decline scars** that never
recovered.

## Invariants (all eras)

- **Astrophysics never changes**: star, orbits, planet size/atmosphere/hydrographics,
  gas giants, belts, AU. Only the **human overlay** moves: `population`,
  `tech_level`, `government`, `law_level`, `starport`, `bases`, `factions`.
- `trade_codes` / `travel_code` **and the T5 extensions** (`ix`, `ex`, `cx`, `ru`)
  are **derived** (recomputed from UWP), never hand-set. See the T5 cascade below.
- **Canon worlds are authoritative.** The 45 gold-shaded systems in the SVG
  (`<g class='canon' fill='#ffcf3f'>`, hex in each polygon's `<!--HHHH-->` comment)
  are hand-authored. Demographics/tech may be back-projected, but governance and
  authored lore are left untouched.

## Population model — monotonic growth

Population grows **Expanse < Decline < Imperium**. The Decline collapses
*civilization* (connectivity, tech, governance), **not headcount** — people keep
being born even when cut off. (No alien plague.)

- **Expanse** = baseline − 2 (floor 1)
- **Decline** = baseline − 1 (floor 1)
- **Imperium** = baseline

Exception — **scar worlds**: the 6 worlds at pop 0 in the Imperium baseline were
*settled and alive in the Expanse* (pop ~4), collapsed to 0 in the Decline, and
stayed empty. For them the trend reverses (Expanse pop > Imperium pop = 0).

## Tech model

- **Expanse**: peak **13**, drop 1 TL per **2 hops** from each island's anchor
  (the highest-population world). Distance = BFS hop count within the **jump-2**
  island graph. Floor TL 7.
  `expanse_TL = 13 − (hops_from_anchor // 2)`
- **Dependency**: **TL ≤ 8 = no jump drive** (Traveller jump-1 needs TL 9). These
  worlds are settled & growing but depend on hub worlds and Imudring traders for
  every inter-system link — first casualties of the Decline; prime story settings.

## Islands (jump-2 clusters)

The **island is the political unit**. Major islands by size, with anchor world:

| # | Systems | Subsectors | Anchor | Role |
|---|---------|------------|--------|------|
| 1 | 51 | E,F,I,J,K,M,N | **Corvallisio** (0823) | Imperium — **Annexed** (via consolidation wars, ended before *Bellicose*) |
| 2 | 48 | C,D,G,H,K,L | **Sigurd** (3115) | Imperium — **Core** |
| 3 | 37 | A,B,E | Shoa (0413) | independent |
| 4 | 15 | O,P | Kiluwa (2636) | independent |
| 5 | 14 | C,F,G | Vodais (1718) | independent |
| 6 | 12 | K,O | Agni (2132) | independent |
| 7 | 12 | K,L | Logarto (3226) | independent |
| 8 | 8 | E,I | Big Ben (0121) | independent |
| 9 | 8 | N,O | Ardamador (1540) | independent |
| — | 24 | scattered | 13 small clusters / singletons | TBD |

Connectivity is a **percolation** structure: jump-1 = 109 fragments, jump-2 ≈ these
islands, jump-3 = one supercluster. The Decline = effective jump range dragged
3→2→1 (the islands shatter); the Expanse = the reverse.

## Governance model

- Each island's **governance center is set by its founding basis** (see
  `gendaldea-islands.md`), and procedural worlds are pulled within **±2 levels** of
  it; canon worlds keep authored codes. Minor holdings keep baseline governance.
- Founding-basis centers (Expanse): Corvallisio 5, Sigurd 3, Shoa 8, Kiluwa 5,
  Vodais 4, Agni 2, Logarto 6, Big Ben 12, Ardamador 1.
- **Code 6 (captive/colony) IS allowed** in the Expanse — read as captive to the
  island's *founding corporation/nation*, not the Imperium. Naval/Scout bases are
  still removed (no Imperium yet). Government has **no T5 cascade** (ix/trade/
  extensions don't depend on it), so it can be re-run independently.
- **Imperial affiliation** (deferred): in the two big islands, **only the
  shaded/canon systems are imperial**, and only in the Imperium era. Non-canon
  systems there join the Imperium later; their politics lean toward their canon
  neighbors. The other 8 islands are unaffiliated.

## Starports

Expanse: X-ports raised to E (no portless worlds pre-Decline); others kept.

## Decline-era model

**Setting-wide TL floors (advanced-society minimum):** Expanse **7** · Decline **6** ·
Imperium **7**. The Imperium baseline was raised to floor 7 (50 non-canon worlds → 7;
4 canon preserved below it & flagged: Rosendanio TL0/scar, Naqsa TL5, Ochvenio TL6,
Xaryio TL6). No world in any era falls to stone age.

The Decline is the **percolation trough** between the Expanse peak and the Imperium
recovery. Derived from the (floor-corrected) Imperium baseline:

- **Connectivity:** effective jump range collapses **2 → 1**. J-1 clusters decide who
  stays linked; 56 worlds become isolated singletons.
- **Population:** baseline − 1 (floor 1) — still *growing* (collapse of civilization,
  not headcount). Scar worlds (Imperium pop 0) are dying: Expanse 4 → **Decline 2** →
  Imperium 0.
- **Tech:** baseline − regression, **floored at TL 6**, never above the Imperium
  value, and **clamped ≤ the Expanse value** (the trough can't exceed the prior peak).
  Regression by J-1 cluster size (singleton −4 / 2–4 −3 / 5–7 −2 / 8+ −1), reduced by
  resilience (−1 if pop≥7, −1 if Ri/In). No stone-age crashes — worst worlds bottom at
  early-stellar TL 6; most cut-off worlds pile at the floor while resilient hubs hold at
  7–10. Result: a shallow, flat-bottomed V across the eras.
- **Governance:** founding-basis blocs fragment — coordinated polities (1,2,3,4,8,9)
  → balkanised (7); feudal/colony (5,6) survive locally; isolated singletons →
  warlord (10) or anarchy (0) if tiny. Canon kept (conservative).
- **Starport:** decay by isolation (singleton −2, small cluster −1). **Bases:** N/S stripped.
- **Open tension:** population grows even on worlds that crash to TL≤3 (per the
  no-plague rule). Decoupling pop-growth for stone-age-crashed worlds is a possible refinement.

## T5 derived-extension cascade

We use **T5 rules**, so shifting `tech_level` or `population` cascades into the
derived extensions. These are recomputed **at apply-time** (not in the ledger),
using the **delta method** — preserve each world's original flux/2D roll and apply
only the deterministic shift, so results stay consistent with the source generator.
Formulas below were reverse-engineered and verified against the baseline data
(match rate in parens).

| Trigger | Field | Rule |
|---------|-------|------|
| **TL shifts (ΔTL)** | `cx.sym` (Symbols) | `+= ΔTL` — Symbols = TL + flux (verified ✓) |
| | `ex.res` (Resources) | base 2D **+ (gas giants + belts) if TL ≥ 8**; add/remove the bonus when TL crosses 8 (verified: mean res TL≥8 vs <8 differs by ~GG+belts) |
| | `ix` (Importance) | recompute exact (229/229 ✓): +1 starport A/B; −1 D/E/X; +1 TL≥10; +1 TL≥16; −1 TL≤8; +1 each Ag/Hi/In/Ri; −1 pop≤6; +1 if Naval+Scout bases |
| | trade codes | `Ht` (TL≥12), `Lt` (TL≤5) |
| **Pop shifts (Δpop)** | `ex.lab` (Labour) | `= max(0, pop−1)` (229/229 ✓) |
| | `cx.homo` (Homogeneity) | `+= Δpop` — Homogeneity = pop + flux, floor 1 |
| | `ix` | recompute (pop≤6 DM) |
| | trade codes | `Hi`/`Lo`/`Ni`/`Na`/`Ph`… |
| **ix changes** | `cx.acc` (Acceptance) | `= max(1, pop + ix)` (229/229 ✓) |
| | `ex.inf` (Infrastructure) | `+= Δix` (preserve rolled component; tracks ix) |
| **then** | `ru` (Resource Units) | `= res × lab × inf × eff`, any 0 component → 1 (229/229 ✓) |
| | `travel_code` | recompute from full UWP |

`ex.eff` (Efficiency) and `cx.str` (Strangeness) are pure flux — TL/pop-independent,
left untouched.

**Effect on the Expanse:** the cascade redraws the economic map — TL-12/13 hubs gain
`Ht` and higher `ix`/`res`; dependent TL-7 worlds fall below the TL≥8 line and lose
their gas-giant/belt Resources bonus. Net: hub-rich, frontier-poor.

## Ledger format

`adjustment.md` per era directory lists **only changed worlds**, grouped by island:
`Hex | World | Canon | field: before → after (reason)`. Two-pass: ledger first,
then apply to JSON.

## Canon overrides

Authored facts that override generated/derived values live in
`gendaldea-canon-overrides.md`. The **Imperium-era JSON is the canonical baseline**;
overrides are applied there and propagate to Expanse/Decline via the −1/−2 rule
(explicit per-era values win when they don't follow the rule). The T5 cascade is
recomputed for any overridden world.

## Status

- ✅ Expanse-era `adjustment.md` generated (`gendaldea-expanse-era/adjustment.md`).
- ✅ **Expanse APPLIED to `gendaldea-expanse-era.json`** — primary values + verified
  T5 cascade + trade-code recompute (climate/planetary codes preserved as invariant,
  demographic/tech/economic codes recomputed); orbit mainworld copies synced.
- ✅ Canon overrides started (`gendaldea-canon-overrides.md`): Guna (1219) pop 4/5/6
  (Imperium baseline corrected). Rosendanio (1018) flagged/deferred (pop 0 untransformed).
- ✅ Founding basis per island documented (`gendaldea-islands.md`); Expanse
  governance re-run to match (founding-basis centers, ±2).
- ✅ Setting-wide TL floors set (Expanse 7 / Decline 6 / Imperium 7); Imperium
  baseline raised (50 worlds → TL 7, sym+Lt cascade); 4 canon preserved below floor.
- ✅ Decline-era `adjustment.md` regenerated with TL-6 floor.
- ✅ **Decline APPLIED to `gendaldea-decline-era.json`** (primary values + T5 cascade +
  trade-code recompute; orbit copies synced). All three era JSONs now populated.
- ⬜ **Derived files stale:** `.svg` / `.tab` / `.sector.txt` in every era folder still
  show baseline UWPs (no in-repo generator). Resync deferred — needs external generator
  or build JSON→tab/sector converters + in-place SVG UWP substitution.
- ✅ Cross-era validated: pop monotonic (except by-design scars), Decline ≤ Expanse &
  Imperium, floors respected. Germania (3005) Decline clamped 10→9.
- ⬜ **Open — Imperium TL > Expanse TL on 20 far-from-anchor worlds** (e.g. Tiercel
  7→11): accept (Imperium developed frontier worlds; "lost Ancient tech" = ceiling/
  aggregate only) or enforce Expanse ≥ Imperium per-world?
- ⬜ Open: religious-founded island · minor-holdings affiliation · Rosendanio (1018)
  · 4 canon worlds below TL-7 floor · flat-trough gradient.
