# Dated event architecture

## Where the files live

Every dated Polish event lives in [`source/scenes/poland_events/`](../source/scenes/poland_events/),
one file per calendar month, named `poland_events_<year>_<month>.scene.dry`.
An event and all of its consequence sections stay together in the file for the
month the event fires in, so a month is a unit an author can read end to end.

An arc that is gated on a flag rather than on a date gets a themed file instead,
named `poland_events_<year>_<arc>.scene.dry` — the 2025 presidential first round
and runoff, and the 2026 snap election, are the large ones.

Because DendryNexus derives a scene id from the file's basename, a section's
full id is `<file basename>.<section>`, and a reference that crosses into
another month must be written out in full (`poland_events_2026_02.ambassador_rules`).
References inside one file stay relative. Moving a section between files
therefore changes its id: update every caller, then run `npm run manifest`.

[`EVENT_MANIFEST.json`](EVENT_MANIFEST.json) is the generated editorial and
authority index for every Polish source section that is tagged as a dated event
or carries an explicit historical date. The scene files remain authoritative;
run `npm run manifest` after editing them.

Each record contains the factual baseline and date, introduced people and
organisations, required role, legal authority, availability, every direct
choice and immediate mutation, later quality/route callbacks, media reception,
alternate-history dependencies, and the fallback when a named organisation has
split. A manifest fallback subtitle makes older small events searchable, but a
scene classified as `major` must carry its consequence subtitle in the game
source itself.

The validator treats policy as a staged process:

1. `proposal` creates advocacy, scrutiny or policy pressure;
2. `negotiated_concession` records another actor's conditional commitment;
3. `passage` records the competent chamber or legal decision;
4. `implementation` changes delivery or state capacity only under executive or
   portfolio authority;
5. `institutional_decision` records an act belonging to the President, court,
   party electorate or another independent institution.

## Interaction and routing standard

This is the presentation contract for desks, hubs, rollouts and dated events.
New event work must follow it, and older scenes should be moved toward it when
they are edited.

### What the Weimar original establishes

The inherited sources and the current upstream mod use one stable loop:

1. The [retained pre-conversion root](../source/scenes/root.scene.dry.old)
   starts a new page and routes through `post_event` before the hand.
2. [`post_event.scene.dry`](../source/scenes/post_event.scene.dry) compiles the
   eligible `#event` choices, serves another event while one remains, and opens
   `main` only when the event list is empty.
3. [`main.scene.dry`](../source/scenes/main.scene.dry) is the persistent
   `is-hand` scene.
4. A Weimar event starts with `new-page: true`, but its internal reveals and
   consequences normally do not. The clearest reference is the
   [1932 candidate rollout](../source/scenes/events/presidential_election_1932_candidate.scene.dry):
   the event has one page break at entry, then each named candidate appends to
   the same record before the player chooses a line.
5. At a terminal result, the engine supplies a final Continue action back to
   the root. The result therefore remains visible until the player deliberately
   leaves it.

This follows the engine semantics exactly: `new-page` clears all prior story
output, while a `go-to` displays the source scene and immediately continues to
its destination. A destination carrying `new-page` can therefore erase the
context or result before the player has read it.

The upstream references are the original mod's
[root](https://github.com/originn0/dynamic_social_democracy/blob/main/source/scenes/root.scene.dry),
[post-event router](https://github.com/originn0/dynamic_social_democracy/blob/main/source/scenes/post_event.scene.dry),
[hand](https://github.com/originn0/dynamic_social_democracy/blob/main/source/scenes/main.scene.dry),
and
[candidate event](https://github.com/originn0/dynamic_social_democracy/blob/main/source/scenes/events/presidential_election_1932_candidate.scene.dry).

### Polish contract

| Surface | Purpose | Page rule | Exit rule |
| --- | --- | --- | --- |
| **Leadership table** | Persistent card hand and optional dossiers. | Always opens clean. | One played card advances the month; inspection-only actions return without advancing it. |
| **Event desk** | Counts every pending dated event and exposes only the highest-priority tier. | Opens clean before the first or next event. | Recompile after every result; open the leadership table only at a zero count. |
| **Dated event** | Gives the historical premise, Lewica's live role and a consequential choice. | `new-page: true` at the event entry. | A decision returns to the event desk, never directly to the hand while the event phase is active. |
| **Event-local hub** | Resolves several parts of one event or crowded month in any order. | A revisited hub may clear only if it restates completed and remaining work. | No time advance; leave only when every required flag is complete. |
| **Linear rollout** | Introduces people, counts, arguments or institutional stages in a fixed order. | Append every beat; do not use `new-page` on each Continue button. | End in the real decision, not another generic Continue screen. |
| **Result beat** | Shows what the selected action caused. | Append to the event page and retain its premise. | An explicit button then opens the next desk or the hand on a clean page. |

The central implementation is [`poland_event_queue.scene.dry`](../source/scenes/poland_event_queue.scene.dry).
Its routing scene deliberately has no page break. The result beat belongs to the
event's own choice scene: it appends to the retained premise and ends in an
explicit button back to the queue. The queue then routes straight to the desk or
the leadership table, whose own scene starts the next page. There is no separate
summary screen between the two, so early and late events read the same way.

### Page-break rules

- Use `new-page: true` for a real boundary: entering a new dated event, opening
  the hand or desk, publishing an election count, or moving into a distinct
  constitutional phase.
- Do not use it for a character reveal, an option's immediate consequence, a
  deterministic calculation hop, or a one-button continuation within the same
  argument.
- A routing-only scene should not clear the page. Its visible destination owns
  the boundary.
- Keep scene properties such as `go-to` above the scene's prose. Dendry treats
  a property written in the body as literal player-facing text, not routing.
  When the next scene starts a new page, put an explicit, descriptive choice
  after the aftermath instead of an automatic `go-to` that would erase it.
- A multi-step event may use another page break only when the next scene fully
  re-establishes the date, actors, live state and decision. “Part II” by itself
  is not enough.
- Important choices need authored aftermath prose. The queue headline is the
  common safety net, not a replacement for explaining who gained, lost or now
  owns the consequence.

### Character-introduction rules

On first appearance in a playable event, give the character's full name,
current office or public role, organisation, and the constituency or strategic
stake that makes the person relevant. Keep that introduction visible through
the decision. Portraits are optional; names and roles are not.

If several real candidates are combined into one simulation field, name every
candidate and state explicitly that the grouping is mechanical rather than a
political alliance. Button copy should identify the next person or subject; do
not make the player click through a run of indistinguishable “Continue” links.

The 2020 presidential introduction is the reference Polish rollout. It names
all eleven registered candidates, explains why five small committees share one
model field, and accumulates every major profile above Lewica's electoral-line
choice.

### One queue, with a legacy boundary

The 2019–July 2023 chapters still contain older direct routes and authored
month-local hubs. They are compatibility code, not a second design standard.
From August 2023 onward, and for every new dated event, use `#poland_event` and
the central queue. Do not create another global news desk or route a dated
choice straight to `poland_hub` while `poland_event_phase` is active.

The author check is therefore:

1. open the event on a clean page;
2. verify that internal reveals accumulate;
3. make a decision and read its retained result beat;
4. return to a recompiled desk;
5. confirm that the hand remains locked until the pending count is zero; and
6. run `npm run check-events` and `npm run smoke`.

`npm run check-events` validates manifest coverage and the Phase 0 invariants.
It fails on regression of the primary count, runoff field, coalition-seat
meaning, office compatibility, independent cabinet identity, PiS constructive
motion guard, lobbying uncertainty, foreign-card eligibility, collapse warning
period, KPO opposition authority, or the reshuffle/discard and queue economy.

Major leadership changes are full dated events. Smaller personnel or brand
changes should be grouped in an optional bulletin, but no monthly normalizer may
silently change a party leader. The `poland_leadership_events` scenes establish
the current full-event pattern: outgoing and incoming holder, incoming bloc,
reason for timing, and at least two defensible Lewica responses.

## Cross-event callbacks

A chain is not a sequence of events on the same subject; it is a decision that
is still being read years later. The manifest's `delayedCallbacks` field only
records that a choice wrote something, so it cannot tell whether anything ever
reads it. Cross-file callbacks are therefore asserted directly by
[`chain-callback-check.js`](../scripts/chain-callback-check.js)
(`npm run check:chains`), which drives the later scene from both branches of
the earlier decision and fails when the two produce the same state.

The links it currently protects:

| Earlier decision | Later reader |
| --- | --- |
| January 2023 KPO bill price (`kpo_bill_quality`) | April 2024 payment, then the October 2025 review through `kpo_shortcut_debt` |
| February 2024 KPO dossier route (`kpo_ledger_public`, `kpo_owner`, `kpo_grudge_*`, `kpo_opposition_file`) | the whole 2024–2026 recovery chain: the ledger gates the May 2024 shared scoreboard and prices the December 2024 paper route, the October 2025 reallocation and the July 2026 audit; an unpaid credit raid sets `kpo_finance_hostile` at the December budget table and removes four coalition votes from the April 2026 PIP division list; a standing opposition audit team makes the April 2024 contracts dashboard free to extend |
| September 2025 HoReCa answer (`horeca_response_2025`) | the October 2025 midterm review, where an answer that built a control mechanism scores and one that built a campaign does not |
| 2023–2024 Gaza line (`gaza_stance_score`, `gaza_chain_stage`) | February 2026 ambassador boycott: consistency, reversal, the gated committee inquiry and the procedural broker's route |
| 2024 protest stance (`last_generation_stance`) | April 2027 repeal crackdown, where the escalating-penalty regime the party demanded is used against the Women's Strike |
| April 2024 transport bill (`transport_bill_2024_filed`) | 2026 gmina service floor, which inherits its costing |
| 2023 referendum answer (`pension_defence_credit`) | May 2026 SAFE veto, where it unlocks the social-floor bargain |
| Breaking a host list at the 2023 march (`campaign_march_broke_host_discipline`) | 2023 seat arithmetic: the host cannot whip the deputies, and KO counts them only if it still trusts them |
| November 2024 mayoral term-limit stance (`mayor_term_limit_stance`) | March 2027 Trzaskowski crossing: third-term mayors bring their machines to the party that removed the cap, and bring nothing to the party that kept it |
| August 2027 pre-registration posture (`list_scramble_posture`) and answer to Porozumienie (`gowin_return_2027`) | September 2027 registration day, where the posture moves every marginal merger threshold and a public veto closes the centre routes so the fragment files on the right instead |
| December 2023 answer to KO's hundred konkrety (`konkrety_line`, `konkrety_receipts`, `konkrety_ownership`) | the January fifty-day briefing, the February allowance retreat, the 22 March hundredth-day audit — which counts delivery from live state and selects KO's deflection target from the player's own record — and the April 2024 local-election campaign |
| August 2023 answer to Giertych's list place and January 2024 answer to his chairmanship (`giertych_line`, `giertych_standing`) and the February 2025 reckoning route (`reckoning_route`, `reckoning_delivery`, `prosecutor_general_separated`) | the January 2026 courtroom, which decides how much of the flagship indictment survives and how angry that makes the Prime Minister, and the June 2026 justice-ministry crisis, where the same figures decide whether the Left can save the incumbent, impose Żurek, or is made to choose between a cabinet containing Roman Giertych and a minority government |

The Giertych and reckoning chain has its own check,
[`giertych-crisis-check.js`](../scripts/giertych-crisis-check.js)
(`npm run check:giertych`). The chain runs from the August 2023 list place
(`giertych_standing`, `giertych_line`) through the January 2024 chairmanship of
KO's reckoning team, the July 2024 rights vote he does not attend, and the two
beats in which the reckoning produces notifications and no verdict
(`reckoning_route`, `reckoning_delivery`, `reckoning_pm_pressure`,
`prosecutor_general_separated`), into the June 2026 decision about the Ministry
of Justice. The check proves that the June outcome is decided by state the
player moved rather than by a preference: that the arithmetic printed to the
player is the live chamber (248 cabinet seats, 26 of them ours, 222 without us
against a majority of 231), that a public veto is a lever only while that gap
exists and KO's own wing shares have not moved past it, that each beat shifts
`ko_social_liberal_share` rather than only `ko_cultural_position` — which the
monthly drift model in `poland_party_ai` would otherwise erase — that staying in
a cabinet with him and leaving it are genuinely different states, and that only
the posture which refuses the minority cabinet a floor opens
`ko_konf_partner_line`, and only where Konfederacja's seats actually close the
gap.

The arc is also gated on the people who would actually carry it, and the check
asserts those gates. The list place and the chairmanship require `ko_leader` to
be Donald Tusk or Radosław Sikorski; the June crisis additionally requires the
same two names as `prime_minister`. Beyond the sponsor,
`justice_crisis_appointment_possible` records whether any coalition partner would
sign the motion: PSL in the Council of Ministers is no obstacle, Poland 2050 in
it without PSL closes the appointment entirely — so a maximally right-wing KO
with a strong chairman still cannot get him sworn in, and the Left's red line is
free. The two reckoning beats are deliberately *not* behind that gate, because a
failing reckoning is a government programme rather than his: they run in every
KO-led timeline and name him only where `reckoning_team_active` is set.

The 2027 list chain has its own check,
[`list-registration-check.js`](../scripts/list-registration-check.js)
(`npm run check:lists-2027`): it drives the August scramble and the September
registration from a dozen fixtures and proves that each stranded organisation
has more than one door, that every door is gated (a closed
`psl_konf_partner_line`, a Kaczyński-led PiS, a cancelled CPK, a public veto),
that a party with no committee and no representation is wound up rather than
left as a shell, and that a committee assignment actually reaches the polling
and count model rather than only the aftermath prose.

The local-affairs desk has its own reachability check,
[`local-affairs-check.js`](../scripts/local-affairs-check.js)
(`npm run check:local-affairs`): it drives all six municipal files from every
live role, proves each one is dispatched and opens its own scene, that none
dead-ends at zero resources, and that no substantive choice routes into the
desk's clean page before its result can be read.

When adding to a chain, prefer wiring an existing later event over authoring a
new terminal one, and make at least one branch of the earlier decision change
what is *available* later rather than only what is written in the aftermath.
A record that only produces a sentence is a callback; a record that opens or
closes a route is a chain.

## Prose audit grades

Every dated event carries a source comment in the form
`# prose-audit: Grade C — ...`. The generated manifest collects the grade and
note so the prose backlog can be sorted without moving or renaming live scenes.

- **A:** immersive and structurally complete; copy-edit only.
- **B:** sound scene and aftermath; improve voice, focus or concision.
- **C:** usable material needing a partial prose rewrite.
- **D:** skeletal or database-led; needs a concrete scene and authored results.
- **F:** placeholder prose that should be rewritten from the factual baseline.
- **R:** routing entry only; audit its destination rather than duplicating prose.
