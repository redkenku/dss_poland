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
