# DSS Poland

A work-in-progress modern Poland total conversion of
[Social Democracy: An Alternate History](https://github.com/originn0/dynamic_social_democracy).
It uses the DendryNexus interactive-fiction engine: political events are written
as text scenes, while JavaScript-backed qualities hold the simulation state.

## Quick start

Install [Node.js](https://nodejs.org/) and npm, then run:

```sh
npm ci
npm start
```

Open <http://127.0.0.1:8000/>. Press `Ctrl+C` in the terminal to stop the
server.

`npm start` recompiles changed source, copies the compiled `game.json` needed by
the mod loader, and starts a local static server. To use another port:

```sh
PORT=3000 npm start
```

The current checkout was successfully built with Node 26. The inherited GitHub
Pages workflow still uses Node 16.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm start` | Build and serve the game locally |
| `npm run build` | Compile `source/` into `out/` |
| `npm run build -- --force` | Force a complete recompile |
| `npm run smoke` | Build, replay the original long-form slice, and run extended-system regressions |
| `npm run smoke:phase7` | Build and run the focused persistent PiS/KO organisation fixtures |
| `npm run serve` | Serve the existing build without recompiling |
| `npm run serve -- 3000` | Serve the existing build on port 3000 |
| `npm run dendrynexus -- <command>` | Invoke the bundled engine CLI directly |

The compiler may print an old `padLevels` circular-dependency warning. It is
noisy but did not prevent a successful build. `npm ci` also reports inherited
dependency vulnerabilities; do not apply an automatic audit fix without testing
the old compiler and UI carefully.

## Project status

This is a playable research build of **Polish Red Autumn**. The main campaign
runs continuously from **October 2019 through December 2026**. The title screen
also retains an October 2023 transfer-of-power drill for testing formation
mechanics without replaying the earlier campaign.

- The continuous route carries the evolved Left into the October 2023
  parliamentary election, state-derived result presentation and
  constitutional cabinet sequence. The President nominates Mateusz Morawiecki
  first; after his confidence attempt, a Sejm majority can choose another
  candidate, bargain through a thirteen-office ministry round and test the
  proposed cabinet. KO begins with strong claims on Finance and Foreign Affairs;
  PSL treats Agriculture as a hard coalition claim. The standalone formation
  drill retains the historical seat snapshot.
- Dated events use a mandatory monthly desk. If several crises arrive
  together, the desk shows the most urgent tier, then reveals lower-priority
  files as it is cleared. Resolving one event cannot discard the rest, and the
  next leadership card is unavailable until every pending issue is addressed.
- Four contextual decks feed one persistent three-card agenda: Party Affairs;
  the sixteen-card Government Affairs deck while Lewica holds office in a
  functioning cabinet; Negotiate with Government while Lewica is outside
  cabinet; and Foreign Affairs throughout the campaign. Government Affairs has
  one card for each of thirteen portfolios plus Cabinet Reshuffle, Coalition
  Council and Social Welfare.
  PiS is normally hostile, but a costed crisis proposal—especially one mediated
  by a Trzaskowski presidency—can produce a narrow, public bargain. A pinned
  discard action removes one held opportunity without consuming time or
  changing political state.
- Foreign Affairs adapts the inherited Weimar relationship ladder. Four
  European missions can culminate in a Warsaw compact, while random Brussels,
  Berlin, eastern-flank, Washington and radical-right pressure cards compete
  for the same hand. Seeded 2020 and 2024 US elections have variable winners;
  their administrations alter NATO reliability, Ukraine politics,
  rule-of-law pressure, EU autonomy and the later ambassador crisis.
- Party resources are uncapped organisational capacity and receive one annual
  dues-and-seat-subvention payout. State-budget capacity is a separate,
  government-only currency. Every playable December ends in a budget line or
  vote; governing defeats can trigger coalition rescue, confidence, a new
  prime minister or a constitutionally valid early-election route.
- The Left begins as a coalition of SLD barons, Wiosna, labour figures,
  younger progressives, Razem and a tiny PPS current. Strength and dissent
  affect primaries, coalition commitments, budgets and confidence votes.
  Mergers redistribute live strength; alienated caucuses escalate through
  leaks, deadline demands, public criticism, failed whips, individual
  defections and parliamentary clubs before a separately polled list appears.
  MPs weigh offices, local organisation, personal following, ideology and list
  dependence, so a split never assumes the whole estimated bloc leaves. Low
  unity damages dues and campaign capacity without ending play; elections and
  the final assessment judge any threshold losses. PSL and the centrist
  parties behave as similarly divided coalition partners rather than fixed
  vote blocks.
- Persistent PiS/United Right and KO records separately track rival apparatus,
  component parties, currents, named loyalties and exclusive seat transfers.
  Lewica can bargain, attack, concede policy or recruit individuals, but it
  cannot appoint a rival leader or move an entire current with one choice.
- Nine public-opinion fields separately track support, salience and backlash,
  above seven independent latent attitudes (capitalism, welfare expectation,
  cultural conservatism, order sensitivity, solidarity, institutional trust
  and appetite for change):
  abortion rights, refugee solidarity, border security, vaccination and
  public health, social spending, LGBT equality, secularism, rule-of-law
  repair, and defence. Monthly cooling produces an overall pressure index and
  hottest issue. Important stories multiply reach, audience trust, frame,
  messenger credibility, issue salience and Left credibility, then record
  persuasion, backlash, mobilisation, abstention and ownership separately.
  Lewica's historical decline is a hostile but reversible pressure track over
  viability, reputation, ownership, authority, coalition blur, media access
  and list confidence.
- Eight mutually exclusive voter blocs score every party. Turnout,
  positioning and organisation produce underlying intention, a sampled public
  poll and a national d'Hondt seat indicator. PiS, KO, PSL, Konfederacja and
  Poland 2050 have their own resources, monthly actions, ideological movement,
  internal currents and hidden relations with one another.
- The 2020 and 2025 presidential contests are simulated elections with
  candidate fields, noisy polling, debate movement, partial transfers,
  abstention and support bargaining. Candidate and total-field benchmarks
  drive decaying voter-consideration, turnout and party-organisation feedback;
  results also alter the Palace relationship, veto environment and later
  coalition crises.
- Every dated Polish event is indexed in a generated authority manifest. Run
  `npm run manifest` after event edits and `npm run check-events` to enforce
  event coverage, policy-stage authority and the core constitutional and
  electoral invariants before building.
- The judiciary is a multi-institution crisis rather than one legitimacy
  meter. Events cover the prosecutor command dispute, warrants and pardons,
  KRS design, the Constitutional Tribunal, preventive referrals, European
  judgments, disputed appointments, court backlog and presidential
  cohabitation. Fast shortcuts may deliver an immediate win while worsening
  legal dualism and the next institutional collision.
- KPO has its own milestone, delivery, unlocked-funds, spending, deadline and
  political-credit ledger. The action plan, first payment and Article 7 closure
  do not automatically repair domestic courts. Later reviews can release,
  condition or delay money, while government choices convert ready projects
  into budget capacity and the 2026 Labour Inspection milestone tests paper
  compliance against funded enforcement.
- The 2019 opposition Senate majority and budget-amendment procedure remain
  playable. The Senate may amend a budget but cannot reject it or participate
  in a confidence vote. Opposition budgets now run through a six-stage process:
  read the government draft, choose two year-specific Left priorities, manage
  a visible faction conference, choose a parliamentary tactic, resolve the
  actual roll call and audit enacted delivery the following year. Shadow
  budgets build political ownership rather than public capacity.
- The Polish ledger now covers polls and seats, public opinion, rival AI,
  coalition arithmetic, Left factions, ministries, media, the Palace, Senate,
  judiciary and KPO. The active route does not enter the inherited German
  cabinet, election, paramilitary or historical-event systems.

The chronology has an explicit research boundary. Events through **July 2026**
use the sourced historical scaffolding in the political timeline, while player
choices can already produce counterfactual outcomes. Events after that cutoff
are labelled **scenario horizon** in their titles or text: the 2027 budget
draft, a possible judicial-status bill, the November march and constructive
motion, and the conditional December snap election and prime-minister crisis
are plausible continuations, not claims about recorded history.

Hundreds of original scenes remain in the repository as dormant conversion
reference. Start a **new save** after pulling this version because its IFID and
quality schema differ from the inherited game.

Keep authored narrative and simulation work in `source/`. Treat
`out/game.json`, `out/html/game.json`, and `out/html/core.js` as generated
artifacts. `out/html/index.html`, `out/html/game.js`, and
`out/html/game.css` are maintained interface files and survive normal builds.

## Documentation

- [Engine and modding guide](docs/ENGINE.md)
- [Polish political timeline, 2015–July 2026](docs/POLITICAL_TIMELINE.md)
- [Counterfactual scenario and crisis ledger](docs/SCENARIO_LEDGER.md)
- [Modern Polish political simulation model](docs/POLITICAL_MODEL.md)
- [Media ecosystem and communications minigame](docs/MEDIA_MODEL.md)
- [First playable skeleton and conversion boundary](docs/PLAYABLE_SKELETON.md)
- [Card image sources and licenses](docs/CARD_IMAGE_CREDITS.md)

The engine guide explains the file format, scene graph, state model, cards,
build output, debugging, and a safe conversion order. The political research
separates sourced history, counterfactual event chains and proposed simulation
systems so that none of the design notes are mistaken for implemented code.
