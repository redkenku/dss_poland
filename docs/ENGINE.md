# Engine and modding guide

This document describes the engine as it is actually used by this repository.
The upstream documentation is sparse, so the guide combines the bundled
DendryNexus source with the structure of the inherited game.

## What this project is

The repository has three layers:

1. **DendryNexus** is the compiler and browser runtime installed through npm.
   It is a fork/extension of Dendry with StoryNexus-style hands, decks, and
   cards.
2. **Social Democracy: An Alternate History** is the inherited game and most
   of the present content and simulation.
3. **DSS Poland** is the unfinished total conversion in `source/`.

There is no application server or database. The compiler turns text source into
JSON and packages it with a JavaScript browser runtime. Saves and achievements
are stored in the browser.

```text
source/info.dry
source/scenes/**/*.scene.dry
source/qdisplays/*.qdisplay.dry
             │
             ▼
      DendryNexus compiler
             │
             ├── out/game.json
             └── out/html/
                    ├── index.html
                    ├── core.js   (runtime plus compiled game)
                    ├── game.js   (project UI customisation)
                    ├── game.css
                    └── images, music, and other assets
```

`npm run build` also copies `out/game.json` to `out/html/game.json`. The
ordinary game is embedded in `core.js`, but the in-game mod loader fetches a
standalone JSON file from a supplied URL.

## Running and building

From the repository root:

```sh
npm ci
npm start
```

Then visit <http://127.0.0.1:8000/>. The HTTP server matters: opening
`out/html/index.html` directly with a `file://` URL can make browser fetch,
audio, or mod-loading behaviour inconsistent.

Other useful commands:

```sh
npm run build                 # incremental compile and HTML packaging
npm run build -- --force      # force source recompilation
npm run serve                 # serve the existing output
npm run dendrynexus -- --help
npm run dendrynexus -- id-resolution child parent.section
```

The GitHub workflow performs the same broad operation and publishes
`out/html/` to GitHub Pages.

## Repository map

| Path | Role | Edit directly? |
| --- | --- | --- |
| `source/info.dry` | Game title, author, IFID, and top-level metadata | Yes |
| `source/scenes/root.scene.dry` | Entry menu and initial state | Yes, carefully |
| `source/scenes/poland_hub.scene.dry` | Active Polish hand and pinned system cards | Yes |
| `source/scenes/cards/` | Contextual Party, Government, Negotiation and Foreign cards | Yes |
| `source/scenes/poland_advisors.scene.dry` | Twelve directly rendered Polish adviser cards | Yes |
| `source/scenes/poland_advisor_groups.scene.dry` | Compatibility menus for older saves | Yes, carefully |
| `source/scenes/poland_advance.scene.dry` | Polish monthly update and dated router | Yes |
| `source/scenes/poland_events.scene.dry` | Dated October 2019–July 2021 pivots | Yes |
| `source/scenes/poland_events_2021_2023.scene.dry` | August 2021–July 2023 pivots and crowded-month news desks | Yes |
| `source/scenes/poland_party_ai.scene.dry` | Rival resources, actions, positions and hidden relations | Yes |
| `source/scenes/poland_polling.scene.dry` | All-party blocs, poll sample and national seat indicator | Yes |
| `source/scenes/poland_presidential_election.scene.dry` | Two-turn 2020 presidential contest | Yes |
| `source/scenes/poland_election.scene.dry` | Result, seat-chart, summary and coalition views | Yes |
| `source/scenes/poland_ministries.scene.dry` | Thirteen-office cabinet allocation and reshuffles | Yes |
| `source/scenes/poland_government_formation.scene.dry` | 2023 coalition and confidence sequence | Yes |
| `source/scenes/main.scene.dry` | Dormant inherited hand, useful as reference | Reference |
| `source/scenes/post_event.scene.dry` | Dormant inherited update pass/router | Reference |
| `source/scenes/events/` | Dormant inherited German events | Reference |
| `source/scenes/party_affairs/` | Dormant inherited party cards | Reference |
| `source/scenes/government_affairs/` | Dormant inherited government cards | Reference |
| `source/scenes/advisors/` | Dormant inherited pinned advisers | Reference |
| `source/qdisplays/` | Text labels for ranges of numeric qualities | Yes |
| `out/game.json` | Compiled scene graph | No |
| `out/html/` | Deployable static game and assets | Only UI/assets intentionally |
| `scripts/` | Local build and static-server helpers | Yes |
| `node_modules/dendrynexus/` | Installed compiler/runtime | No |

The present source contains roughly 500 authored files, including about 375
event files. A broad find-and-replace is therefore risky: migrate systems in
small, buildable slices.

## The source format

### Files, scenes, and sections

A file named `example.scene.dry` defines the scene `example`. Sections starting
with `@` create child scenes:

```dry
title: Coalition talks
new-page: true
on-arrival: talks_started = 1

The party leadership meets behind closed doors.

- @accept: Accept the offer
- @reject: Walk away

@accept
on-arrival: ko_relation + 5; razem_dissent + 10
go-to: root

The agreement passes.

@reject
on-arrival: ko_relation - 10
go-to: root

The delegation leaves without a deal.
```

The complete IDs here are `example`, `example.accept`, and `example.reject`.
Properties come first. A blank line begins the displayed content. Options begin
with `-`; do not put ordinary content after an options block unless a new
`@section` begins.

Whole lines beginning with `#` are comments.

### Scene references

Scene IDs are resolved from local to global:

- `child` used in `parent.section` checks
  `parent.section.child`, `parent.child`, then `child`.
- `.root` is the absolute ID `root`.
- `.` means the current scene.
- `..sibling` moves up one level and selects `sibling`.
- More leading dots move farther up the hierarchy.

The bundled CLI can show the exact candidates:

```sh
npm run dendrynexus -- id-resolution child parent.section.deep
```

### Common scene properties

Property names are written in kebab case. Important properties include:

| Property | Meaning |
| --- | --- |
| `title`, `subtitle` | Player-facing choice/card text |
| `view-if` | Hide the scene unless a condition is true |
| `choose-if` | Show the scene but prevent choosing it unless true |
| `on-arrival` | Mutate state when the scene begins |
| `on-departure` | Mutate state when the player leaves |
| `on-display` | Browser-side work when content is rendered |
| `go-to` | Automatically route to another scene |
| `new-page` | Clear prior story output |
| `max-visits` | Limit how many times a scene can occur |
| `priority`, `order`, `frequency` | Control event/card selection |
| `is-hand` | Make a scene display a hand of cards |
| `is-deck` | Make an option draw a qualifying card |
| `is-card` | Mark a scene as a returning hand card |
| `is-pinned-card` | Keep an action permanently visible in a hand |
| `card-image`, `face-image`, `wide-image`, `banner-image` | Attach art |
| `set-bg`, `set-music`, `audio` | Change presentation/audio |
| `game-over` | End the run |

`go-to` accepts conditional routes in order:

```dry
go-to: coalition_win if seats >= 231; minority if seats >= 200; opposition
```

Options may point to a scene or a tag:

```dry
- @private_meeting: Meet the chair
- #campaign_event
```

A tag option asks the engine to choose an eligible scene carrying that tag.
Eligibility is affected by conditions, visit limits, priority, and frequency.

### Text markup and interpolation

The project commonly uses:

```dry
= A heading

Ordinary paragraph with *emphasis* and **strong emphasis**.

[+ nl_votes +]% support
[+ dissent : dissent +]
[? if in_government: We are in government. : We remain in opposition. ?]

> A quotation
>> Attribution
```

- `[+ quality +]` prints a quality.
- `[+ quality : display +]` prints it through a qdisplay.
- `[? if condition: true text : false text ?]` conditionally displays text.
- `{! ... !}` injects raw output or JavaScript, depending on the property and
  context. Use it only when ordinary Dendry expressions cannot do the job.

The content parser also supports horizontal rules (`---`), explicit line breaks
(`//`), and inline code using backticks.

## State: qualities and JavaScript

All simulation state lives in the qualities object. In engine expressions it is
referenced by name:

```dry
on-arrival: resources - 1; ko_relation + 5; deal_signed = 1
view-if: resources >= 1 and not deal_signed
```

For loops, arrays, DOM work, and complex calculations, the inherited game uses
raw JavaScript:

```dry
on-arrival: {!
Q.time += 1;
for (var faction of Q.factions) {
    Q[faction + '_dissent'] = Math.max(0, Q[faction + '_dissent'] - 1);
}
!}
```

Inside this code:

- `Q` is the current qualities object.
- `this` is normally the running engine.
- `this.game.scenes` is the compiled scene map.
- `this.state` is the complete current run state.
- In the browser console, the same qualities are available as
  `dendryUI.dendryEngine.state.qualities`.

Prefer the simple expression language for straightforward changes. Raw
JavaScript is powerful but bypasses many compiler checks. A misspelled or
obsolete property can become `undefined`, produce `NaN`, or fail only at
runtime.

### Qualities are a schema even without a schema file

This game initializes most qualities in `root.start`, then assumes they exist
throughout thousands of lines of event logic. Treat that initialization block
as a data schema:

- Give every active party, faction, timer, relation, and flag an explicit
  initial value.
- Keep arrays such as `Q.parties`, `Q.classes`, and `Q.factions` aligned with
  every loop that consumes them.
- When renaming a quality, search the entire source tree.
- Remove an old quality only after its last reader has been converted.

Useful searches:

```sh
rg -n "Q\\.spd|spd_" source
rg -n "192[89]|193[0-5]|Reichstag|Prussia|Hindenburg" source
rg -o "Q\\.[A-Za-z_][A-Za-z0-9_]*" source/scenes |
  sed 's/.*Q\\.//' | sort -u
```

## Hands, decks, and cards

The main player interface is a StoryNexus-like hand.

```dry
title: Next month
is-hand: true
max-cards: 3

- @party
- @government
- #advisor

@party
title: Party affairs
is-deck: true

- #party_affairs
```

Every option on a hand must resolve to an `is-deck: true` or
`is-pinned-card: true` scene; ordinary choices are omitted. `max-cards` is
required. Choosing the `party` deck makes the engine select an eligible
`is-card: true` scene tagged `party_affairs`, then stores it in
`this.state.currentHands[handSceneId]`. Unplayed cards survive scene changes and
save/load. Cards whose `view-if` becomes false are removed the next time the
hand is displayed.

Put hard safety conditions on the card's `view-if`: the browser plays a held
card directly and does not re-check its parent option's `choose-if`. The same is
true of pinned cards. Individual choices inside the played card may still use
`choose-if`, provided at least one resolution is available.

Every drawable card should retain at least one legal non-navigation resolution
at zero resources. A card is removed from the hand before its scene opens; if
all of its outcomes are resource-gated, the engine's empty-choice fallback can
send the player to `root`. A costly card may instead use a resource condition
in its own `view-if`, but a free politically painful outcome is usually safer
for a persistent agenda.

The inherited game sometimes pushes a card back into
`this.state.currentHands[...]` itself. Preserve the exact hand ID when
converting that pattern. A fresh campaign must also clear `currentHands`,
`lastDrawnCard`, and `lastPlayedCard`, because these live outside the qualities
object.

Polish Red Autumn implements a genuinely neutral discard before card play.
The pinned `poland_discard_card` menu splices the selected object directly from
`currentHands["poland_hub"]`; it never calls `playCard`, enters the discarded
scene or blacklists its ID. Consequently it does not consume the monthly
action, start the card cooldown, alter resources or update `lastPlayedCard`.
Temporary menu labels are reset before returning to the hub. The discarded
card remains eligible for a later random draw.

The inherited high-level loop is:

```text
root/start initialises Q
        │
        ▼
post_event recalculates simulation state
        │
        ├── eligible #event scenes ──► event result ──┐
        │                                             │
        └── no event                                  │
        │                                             │
        ▼                                             │
main hand: party/government/adviser actions ◄─────────┘
        │
        └── advance time ──► post_event
```

This is the system that must be converted, not just the opening scene.

The active Polish hand has four contextual live decks:

- **Party Affairs** is always available and draws one of sixteen party cards.
- **Government Affairs** requires government participation, Sejm confidence,
  no caretaker cabinet and at least one relevant Lewica-held ministry whose
  policy opportunity is currently useful and off cooldown. Its sixteen cards
  comprise one file for each of thirteen portfolios plus Cabinet Reshuffle,
  Coalition Council and Social Welfare. Portfolio cards repeat the same
  ownership and cabinet-safety conditions.
- **Negotiation with Government** appears only while Lewica is outside a
  functioning cabinet. Its crisis compact, oversight bargain and
  presidential-mediation cards publish their score, threshold and likely
  effect before the player chooses.
- **Foreign Affairs** remains available in and out of government. A
  higher-frequency staged European campaign builds distinct institutional,
  social, eastern and bilateral relationships; five lower-frequency pressure
  cards recur on independent cooldowns. The 2020 and 2024 US election scenes
  set the administration used by later Washington and security cards.

The cabinet round always displays Labour, Equality, Housing, Health, Digital
Affairs, Science, Interior, Finance, Development and Technology, Justice,
Foreign Affairs, Agriculture and Defence. A visible office may still be
unavailable: KO normally protects Finance and Foreign Affairs, while PSL treats
Agriculture as a hard coalition claim. This preserves the bargaining information
even when taking a senior portfolio would require a harsher agreement or a
different coalition. Cabinet Reshuffle later reopens the same roster rather than
silently replacing minister state.

Party opportunities also carry contextual `view-if` gates. Media-build cards
wait for the media-system event, the presidential channel requires real Palace
access, Senate negotiations respect their cooldown, opposition coordination
requires a right-led cabinet, and problem-solving cards disappear when their
tracked problem is already settled. Broad campaigning and rally cards remain
available to prevent an empty Party deck.

Earlier experimental media, parliamentary and social deck scene IDs remain as
compatibility redirects. They are not additional decks. All live decks share
the same persistent three-card hand.

## QDisplays

A qdisplay maps a number to player-facing text. For example,
`source/qdisplays/dissent.qdisplay.dry` contains ranges such as:

```dry
(..4.999) <span style="color: #66BB6A;">very low</span>
(4.999..14.999) <span style="color: #81C784;">low</span>
(14.999..30.999) <span style="color: #FFD54F;">medium</span>
```

Use it with `[+ dissent : dissent +]`. The first `dissent` is the quality and
the second is the qdisplay name.

## Debugging

### Compiler errors

Run a forced build:

```sh
npm run build -- --force
```

Compiler errors normally identify a file, property, unresolved scene ID, or
invalid expression. The generated JSON should never be hand-fixed; correct the
source and rebuild.

### Runtime errors

Open browser developer tools while playing:

```js
const Q = dendryUI.dendryEngine.state.qualities;
Q.year;
Q.factions;
dendryUI.dendryEngine.state.sceneId;
```

Check the console after every converted turn. Some engine callbacks catch and
log exceptions rather than stopping on a visible error page, so the UI may
continue after part of a state update failed.

Useful warning signs:

- `ReferenceError`: a raw-JavaScript name is missing.
- `Cannot read properties of undefined`: a scene, array, DOM node, or quality
  was assumed to exist.
- `NaN` in the status UI: arithmetic used an uninitialised or non-numeric
  quality.
- A blank deck: no tagged scene passed its conditions.
- A card that disappears forever: its return-to-hand logic still targets the
  wrong hand ID.

Use a fresh browser save after changing initialization. Old saves retain the old
quality set and can hide or create migration bugs.

## Current conversion audit

As of 30 July 2026:

| Area | State |
| --- | --- |
| Installation and compilation | Working |
| Local HTTP launch | Working through `npm start` |
| Opening date and Polish caucus qualities | Converted |
| Status display and interface labels | Converted for the active slice |
| Native contextual hand and time advancement | Converted; Party, ministry-bound Government and opposition Negotiation decks share one three-card hand with state-neutral held-card discard |
| Factional advisor bureau and reshuffling | Converted; twelve advisors in five political caucuses, three active cards and a full-slate editor |
| Dense party/institution/economy/voter ledger | Converted, including Senate, ideologies and voter blocs |
| Dated events | Continuous October 2019–July 2023 campaign; 45 monthly leadership turns |
| Presidential election | Two turns; dynamic first-round top two, saved poll/result slack and two runoff support trades |
| Annual budget votes | 2019/2020 opposition and Senate stages; five-caucus 2021/2022 fracture votes; government-only budget prototype |
| Party resources | Uncapped; annual dues plus actual-seat subvention, no monthly refill, shared emergency-fundraising lock |
| Polling | All-party voter-bloc model, rival AI, sampled headlines and national d'Hondt indicator |
| Election and government formation | Separate October–December 2023 historical-result prototype with coalition arrangements, confidence, ministries and budget |
| Endings | Four scored outcomes plus early fracture/collapse |
| Crowded-month routing | Same-turn news desks in late 2021, November 2022, February 2023 and June 2023 |
| Beyond July 2023 and district-level elections | Research/design only |

The active route is intentionally isolated. `root` sends a started game to
`poland_hub`; Polish actions return there; `poland_advance` selects the next
dated event; crowded months require the player to close each item on their
news desk without consuming another monthly action; and the July 2023
radical-right event reaches the election-readiness projection and
`poland_ending`. It does not call the inherited `main`, `post_event`,
paramilitary systems or German endings.

Those inherited files are still compiled and remain useful as examples, but
they are unreachable from the Polish campaign. This is an architectural
boundary, not a claim that the whole repository has already been converted.
See `PLAYABLE_SKELETON.md` for the implemented state contract.

## Recommended conversion order

1. **Extend the isolated router rather than reconnecting legacy scenes.** Add
   later Polish chapters behind explicit year/month flags.
2. **Keep one quality inventory.** Update the active state contract whenever a
   new party, faction, institution, resource or timer is introduced.
3. **Extend coalition-government state.** The 2023 prototype now establishes
   investiture, confidence, ministry allocation and a first budget settlement;
   later chapters still need delivery clocks and recurring PSL/Third Way exit
   threats.
4. **Replace the full election/seat model.** The current voter-bloc poll and
   national d'Hondt indicator are not a district forecast. Add Polish district
   allocation, committee/coalition thresholds and a separate Senate election
   model before treating projections as election results.
5. **Build faction gameplay.** Separate formal organisations from design
   factions: SLD legacy networks, Wiosna, Razem, labour/social-policy figures,
   and coalition pragmatists should not all be represented by the same type of
   variable.
6. **Continue after July 2023.** Preserve the monthly router boundary while
   adding the parliamentary election, coalition delivery and later crises as
   independently testable chapters.
7. **Connect the playable islands.** Turn the fixed 2023 result/formation
   prototype into the outcome of a campaign, then add the Third Way rupture,
   Razem split and 2025 presidential election.
8. **Replace presentation last.** Polish art, music, achievements, and endings
   are easier to validate once the state loop is stable.

At each step: force-build, start a new save, play through at least one complete
turn, inspect the console, and search for obsolete German variables in the
converted files.

For the implemented October 2019–July 2023 slice, `npm run smoke` performs a
deterministic 45-turn headless playthrough, verifies every dated route and
same-turn news desk in order, checks active numeric qualities for non-finite
values and fails if the campaign enters a legacy scene.
