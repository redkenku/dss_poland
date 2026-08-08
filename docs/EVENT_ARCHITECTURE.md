# Dated event architecture

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
