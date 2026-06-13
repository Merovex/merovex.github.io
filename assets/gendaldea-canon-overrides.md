# Gendaldea — Canon Overrides

Authored facts that **override** procedurally-generated / rule-derived values.
The **Imperium-era JSON is the canonical baseline**; canon overrides are applied
there, and the Expanse/Decline files derive from the corrected baseline (so a
single Imperium value usually propagates correctly via the monotonic −1 / −2
population rule). Where an override's per-era values don't follow the standard
rule, the explicit per-era columns win.

T5 cascade (see `gendaldea-era-framework.md`) is recomputed for any overridden
world at apply-time.

| Hex | World | Field | Expanse | Decline | Imperium | Note |
|-----|-------|-------|:------:|:------:|:-------:|------|
| 1219 | Guna | population | 4 | 5 | 6 | Canon: pop 6 by the Imperium. Standard monotonic growth (Imperium 6 → −1/−2). Applied to Imperium baseline; cascade lab 5 / homo 8 / acc 5 / ru −810. |

## Deferred decisions

| Hex | World | Question | Status |
|-----|-------|----------|--------|
| 1018 | Rosendanio | Canon world but pop 0 at Imperium (canon scar). Dead-by-Imperium ruin (Expanse alive → Decline dies → Imperium 0)? Override with a population? Or always dead? | **Flagged** — left pop 0 in the Expanse apply, untransformed population, pending decision. |
| 1122 | Naqsa | Canon, Imperium TL 5 — below the new TL-7 floor. Preserve as authored low-tech world, or raise to floor 7? | **Preserved at TL 5** pending decision. |
| 0524 | Ochvenio | Canon, Imperium TL 6 — below the TL-7 floor. Preserve or raise? | **Preserved at TL 6** pending decision. |
| 1619 | Xaryio | Canon, Imperium TL 6 — below the TL-7 floor. Preserve or raise? | **Preserved at TL 6** pending decision. |
