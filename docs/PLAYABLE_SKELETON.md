# First playable skeleton

This document describes code that exists now. Broader historical research and
counterfactual designs remain in the other ledgers.

## Scope

The main vertical slice begins in **October 2019**, immediately after Lewica's
return to the Sejm with 49 deputies, and runs continuously through the
**autumn 2027 Sejm and Senate elections**. Monthly leadership turns combine a native card hand, factional
advisors, rival-party AI, public opinion, factional ratification and an
all-party electorate model.

The July 2023 projection is no longer an ending. The campaign proceeds through
list-making, the October parliamentary election and the full constitutional
formation sequence. The President's first nominee is Mateusz Morawiecki, who
can court PSL, Lewica and the radical right before his investiture vote. If he
fails, the Sejm majority chooses and tests its own candidate. Lewica receives
state-budget authority only after entering a successful cabinet.

The title screen still exposes the **October–December 2023 formation route** as
a standalone mechanical test. It resets to a historical formation snapshot;
the continuous campaign instead preserves the party's accumulated resources,
factional dissent, relations and political credibility when it enters the same
chapter.

The active scene flow is:

```text
root
  -> poland_intro
  -> poland_hub
       -> draw from Party, Government, Negotiation or Major Reform
       -> persistent three-card agenda
       -> optional advisor portrait / leadership reshuffle
       -> play one dilemma -> poland_card_finish -> poland_advance
       -> public-opinion cooling and legacy-event bridge
       -> rival-party AI, all-party poll, projection and coalition worksheet
       -> mandatory dated-event queue or monthly briefing
            -> highest-priority event tier
            -> return to queue after every decision
            -> reveal the next tier until no dated event remains
  -> July 2021 merger revolt
  -> August 2021–July 2023 dated chapter
  -> July 2023 election-readiness chart
  -> August–September campaign and October parliamentary election
  -> presidential nominee, confidence votes, ministries and coalition entry
  -> December 2023 transfer-of-power crises and annual budget
  -> 2024 coalition, judiciary, KPO and electoral tests
  -> 2025 presidential election, confidence and party ruptures
  -> January–July 2026 sourced-history scaffold
  -> September–December 2026 labelled scenario horizon
  -> final budget, conditional snap election / prime-minister crisis
  -> January–October 2027 election-year campaign and press cycle
  -> live Sejm and Senate count
  -> game-over epilogue

root
  -> poland_government_formation.setup
  -> 2023 result, Sejm chart, summary and coalition arrangements
  -> presidential Morawiecki nomination
  -> PSL/Lewica courtship and first confidence vote
  -> Sejm candidate, ministry allocation and confidence vote
  -> government-only coalition budget or failed-formation route
```

No node in that flow routes to the inherited German `main`, `post_event`,
cabinet, election, paramilitary or historical event decks.

### Historical and scenario boundary

The campaign deliberately contains two kinds of dated material:

- events through **July 2026** use the sourced chronology in
  `POLITICAL_TIMELINE.md`, although the player's accumulated state and choices
  can produce counterfactual results;
- post-cutoff events are explicitly labelled **Scenario horizon**. The
  September budget draft, October judicial-status bill, November march and
  constructive motion, and December early-election/formation ladder are
  plausible playable continuations. They are not presented as events that have
  already happened.

## Play loop

Every month the player may play **one** strategic dilemma from the engine's
native persistent hand:

1. **Party Affairs** supplies nineteen cards. **Government Affairs** supplies
   one baseline card for each of thirteen portfolios, plus Cabinet Reshuffle,
   Coalition Council and Social Welfare. It appears only for Lewica in a cabinet
   with confidence and offers portfolio cards for offices it controls.
   **Pressure & Negotiate** appears only when Lewica is outside a functioning
   cabinet. TVP appearances, committee scrutiny, PiS fault-line tactics and the
   Party Affairs relationship route build bargaining capital; oversight, crisis
   and presidential deals spend it only after enough pressure exists. **Major
   Reforms** and the **External affairs dossier** complete the five live decks.
   The three persistent reform projects stay in their own deck rather than
   duplicating Government or Negotiation draws.
2. Hold at most three cards. Unplayed cards persist between months and can
   become invalid if their conditions stop being true. **Discard an
   opportunity** removes one held card without playing it: no monthly action,
   timer, resource, budget, polling or faction effect changes, and the card can
   be drawn again later.
3. Play one card to advance the month into public-opinion drift, rival actions,
   polling and the dated router. There is no monthly resource refund. If the
   event desk opens, every pending issue must be resolved before the hand
   returns.
4. Up to three advisors are active. Their interventions share one six-month
   cooldown.
5. A pinned bureau card edits the full three-seat slate. Several seats may
   change before confirmation; a changed slate locks for six months, while
   inspecting an unchanged slate does not. **End month** passes and applies
   neglect pressure.

### Major reform projects

Abortion, equal marriage and labour law are whole-campaign projects rather
than one-off votes. The first card defines the ambitious bill. The four levels
below are possible final settlements, ordered from the greatest retreat to the
original goal; the player does not fill them in sequentially:

| Project | Level 1 | Level 2 | Level 3 | Level 4 |
| --- | --- | --- | --- | --- |
| Abortion | Emergency/clinician decriminalisation | Limited decriminalisation compromise | Twelve-week access | Canadian model |
| Equal marriage | Closest-person agreement | Registered cohabitation | Civil partnership | Marriage and adoption |
| Labour | Token PIP funding | PIP enforcement and reclassification | Contract and labour-law protection | Full Razem package |

Lewica begins by demanding level 4. Coalition and presidential resistance can
force the live proposal down. If any lower level is enacted, the project closes
there rather than returning to unlock the next level. An outright defeat or
withdrawal instead damages trust and preparation, imposes a cooldown, and then
returns the original ambitious bill for another attempt.

Before entering government, Lewica can spend cards on talks, referendum
groundwork and coalition expectations. Eligible projects can be drawn from
Pressure & Negotiate as well as their separate deck. In government, they are
also injected into Government Affairs; those accumulated assets become passage
power and can support an authorised national vote.
Party relations, rival-party wings, Left polling and issue support determine
how far partners will move; the appropriate Equality, Health, Labour or Justice
portfolio makes a push easier, while the President remains an independent
signature gate. A referendum can strengthen the abortion or marriage mandate
but cannot let opposition enact a law on its own. Limited rights settlements
are easier to obtain from PiS than the full programme, while PiS solidarists
are comparatively open to labour reform and market-oriented parties resist it.

An attempted bill can therefore trigger a queued **coalition partner opposes
our action** crisis when relations are poor. Lewica may spend organisational
capacity, call in accumulated support, narrow the settlement or retreat; forcing
the matter raises coalition dissent, break risk and the chance of an early
election. A delayed count also rechecks that Lewica still belongs to a
functioning cabinet before it can enact anything.

Coalition partners pursue projects of their own through the monthly rival AI.
KO and Third Way can demand aggressive judicial changes, a TVP takeover or
privatisation and market liberalisation. Under hostile presidential
cohabitation, their judicial demand becomes more desperate and may cross
procedural limits. PiS can instead demand legal cover for Pegasus-style tools,
a softer anticlerical line or condemnation of the PZPR past; an extreme memory
demand can accelerate an SLD-establishment split. Accepting or bargaining over
the public-media demand changes TVP's persistent patron and therefore its tone
on the right-side press rail. Sponsors must actually remain in the cabinet;
completed concessions leave the demand pool, while refusals can return after a
cooldown.

### Foreign affairs

Party Affairs includes four country-level cards: the EU, Hungary, the United
States and Ukraine after Russia's full-scale invasion. Elections and shocks
change who is available abroad and what that relationship can achieve.

- The EU file lets opposition strengthen Poland's democratic case through
  European institutions and party networks. A government can additionally
  negotiate national settlements. The 2024 rightward shift creates a visible
  passage-power penalty for abortion, equal-marriage and labour reforms;
  organising can reduce that headwind, but cannot replace a Polish majority.
- Hungary records Fidesz's 2022 victory and resolves a 2026 election in which
  Fidesz can fall. Polish democratic and Fidesz channels modestly influence
  access and the close counterfactual branch without making Warsaw the author
  of Hungary's result.
- The US file separates White House, congressional, institutional and security
  access. The seeded 2020 and 2024 elections alter which of those routes is
  strongest. PiS benefits from a direct America First relationship; opposition
  can build a democratic case but cannot promise Polish state action.
- Ukraine turns foreign policy into weapons, logistics, refugees, accession
  and reconstruction after February 2022. Opposition can vote, scrutinise and
  organise; a functioning cabinet can spend and deliver.
- Persistently poor combined EU and US access triggers a dated, player-visible
  economic shock. Growth, unemployment and fiscal stress change immediately;
  opposition can expose the damage, while only government can fund relief or
  recover part of the national loss through an agreement.
- Every file routes costs and consequences through actual authority: ordinary
  opposition; confidence-and-supply opposition; junior coalition with or
  without Foreign Affairs; Lewica-led government with or without Foreign
  Affairs; caretaker; or Left President.
- Opposition uses questions, committee motions, shadow doctrine, party
  diplomacy and public pressure. Confidence-and-supply may condition budget or
  confidence votes. Junior partners use coalition bargaining unless they hold
  Foreign Affairs, in which case the minister acts inside the Prime Minister's
  mandate and can be overruled. A Lewica-led cabinet directs a coalition
  portfolio owner or, when it holds Foreign Affairs too, takes full initiative
  and responsibility. Caretakers preserve continuity; a Left President uses
  representation, ratification, appointments and constitutional influence,
  never routine cabinet command.
- Defence, Palace and parliamentary-committee contacts remain separate
  channels. In particular, opposition can scrutinise a requested Washington
  pledge but cannot give one on Poland's behalf.
- The November 2020 and November 2024 US elections use the campaign seed and
  can return different winners. The 2024 Republican candidate changes if Trump
  already won twice. The resulting administration changes alliance
  reliability, rule-of-law pressure, domestic party relations and later
  Ukraine and 2026 diplomatic events.

The twelve-advisor roster is chosen through the advisor-bearing currents in
the six-caucus starting registry. PPS begins as a very small current without a
dedicated bureau personality. Active personalities and portraits are displayed
directly:

| Caucus | Advisors |
| --- | --- |
| Old SLD / barons | Włodzimierz Czarzasty, Dariusz Wieczorek |
| Wiosna / Spring | Robert Biedroń |
| Labour current | Agnieszka Dziemianowicz-Bąk |
| Younger progressive SLD | Anna-Maria Żukowska, Katarzyna Kotula, Krzysztof Gawkowski, Wanda Nowicka |
| Razem | Adrian Zandberg, Magdalena Biejat, Marcelina Zawisza, Paulina Matysiak |
| PPS | No dedicated advisor at scenario start |

The starting bureau is Czarzasty, Biedroń and Zandberg. When Wiosna merges,
Biedroń and Kotula represent the successor progressive current rather than
continuing to modify a dissolved organisation. Advisors belonging to a caucus
that leaves are removed from the shared bureau.

Standard and deliberately harsher starting conditions are available.

## Resources and budget authority

The inherited currencies are now separated by political role.

- `resources` is uncapped party capacity: cash, organisers, staff time,
  relationships and usable organisation. Annual income is membership dues plus
  a subvention derived from seats actually won at the last Sejm election—not
  the live polling projection. Standard 2019 begins with two dues and two
  subvention; hard mode lowers dues by one. Unity can improve dues collection
  by one, while severe weighted dissent removes one. Collection occurs only
  once when the calendar enters a new year.
- The Party deck includes inherited-style dues, continuous campaigning and
  rally cards. Dues may be raised or lowered. Emergency appeals, including the
  Czarzasty and Wieczorek actions, share a sixteen-month fundraising lock.
- `budget` is uncapped fiscal room for extra state commitments. It is hidden
  and cannot be spent while `left_in_government = 0`. Opposition budget events
  choose a voting line, shadow package or costly issue deal; they never grant
  public spending authority.
- A successful coalition formation sets `left_in_government = 1`. Only then
  does the government receive one normal budget-capacity restoration at the
  beginning of a year. Ready KPO co-financing can add limited room. A failed
  coalition or lost confidence vote removes that authority and hides the
  balance again.

## Implemented events

| Date | Pivot |
| --- | --- |
| November 2019 | Presidential candidate: Biedroń, Zandberg or a staged open primary; first Independence Day response |
| December 2019 | First common opposition position and Senate amendment stage |
| January 2020 | Schetyna hands PO to membership-election winner Budka; media ecosystem investment |
| February 2020 | Candidate-aware early presidential campaign briefing |
| March 2020 | COVID-19 lockdown response |
| April 2020 | Attempted postal presidential election |
| May 2020 | Kidawa-Błońska's collapsed campaign yields to Trzaskowski; social shield priorities |
| June 2020 | Presidential field, two campaign moves, debate, tracking poll and first-round count |
| July 2020 | Dynamic runoff—or first-round confirmation—with endorsement and support trading |
| August 2020 | Hołownia converts his breakthrough into Polska 2050; Trzaskowski certification/oath crisis if he wins |
| September 2020 | Conditional Witek interregnum, disputed Supreme Court invalidity and imposed presidential rerun; SLD–Wiosna/Nowa Lewica architecture |
| October 2020 | Constitutional Tribunal abortion ruling; conditional Palace–Tribunal showdown |
| November 2020 | Women's Strike organisation and programme; pandemic-era Independence Day strategy followed by the riot, apartment fire and police-response reckoning; variable US presidential election |
| December 2020 | Pandemic draft, two Left priorities, visible faction conference, Sejm vote and Senate amendments |
| January 2021 | Vaccination strategy |
| February 2021 | Conditional Trzaskowski judicial-veto war |
| March 2021 | SLD becomes Nowa Lewica |
| April 2021 | Conditional Palace strategy: institutions, social cohabitation or equality compact |
| May 2021 | EU recovery-fund vote |
| June 2021 | Opposition strategic reset, or a conditional abortion/marriage/judicial signature test |
| July 2021 | Budka yields PO to returning founder Tusk; Nowa Lewica merger revolt |
| August 2021 | Gowin and Porozumienie leave the United Right; minority-government arithmetic and COVID anti-restriction recruitment |
| September 2021 | Belarus-border state of emergency |
| October 2021 | News desk: Nowa Lewica congress and the Tribunal's EU-law collision |
| November 2021 | News desk: Sajbor protests, the winter border and the Independence Day March |
| December 2021 | News desk: PPS splinter, Pegasus/Lex TVN and the 2021 budget fracture |
| January 2022 | Polish Deal disruption and the Omicron wave |
| February 2022 | Russia's full-scale invasion of Ukraine |
| March 2022 | Refugee reception and local-service capacity |
| April 2022 | Sanctions, energy and the war economy |
| May 2022 | Mortgages and the one-opposition-list argument |
| June 2022 | Conditional KPO approval, judicial milestones and withheld disbursement |
| July 2022 | Inflation, indexed incomes and Polish Deal repair |
| August 2022 | Oder ecological disaster and state capacity |
| September 2022 | Winter energy prices and household relief |
| October 2022 | Mentzen succeeds Korwin-Mikke inside Konfederacja's libertarian current |
| November 2022 | News desk: the Independence Day March and the Przewodów missile |
| December 2022 | War, energy, refugees and the 2022 budget fracture |
| January 2023 | Another judicial route toward KPO funds |
| February 2023 | News desk: Duda's Tribunal referral, the Wolnościowcy rupture and the Left pact |
| March 2023 | Church accountability, memory and public power |
| April 2023 | PSL and Poland 2050 form Third Way |
| May 2023 | Solidarna Polska becomes Suwerenna Polska; Lex Tusk, 4 June mobilisation and PiS's 800+ welfare counter-offer |
| June 2023 | News desk: the 4 June march and renewed “Not one more” protests |
| July 2023 | Konfederacja's summer surge, competing PiS solidarism and the election-readiness projection |
| August–September 2023 | Three Sejm lists versus a shared Senate Pact, five-current guarantees and the visa scandal |
| October–December 2023 | Parliamentary result, Morawiecki's presidential nomination, investiture, Sejm-led cabinet attempt, ministries, transfer of power, a conditional PSL succession and right realignment after exclusion, or Hołownia's anti-PiS/anti-KO Poland 2050 relaunch when his party is excluded, Braun's menorah attack, public media, Independence Day and the inherited budget |
| January–March 2024 | Competing prosecutor commands, Kamiński/Wąsik warrants and pardons, Republika's advertiser crisis, farmers, Kanał Zero, the KRS action plan and the Sejm's Tribunal resolution; on Hołownia's relaunch route, Zieloni dissolve, guarantee their first three MPs to Poland 2050 and split any larger delegation with Nowoczesna, strengthening both his 2025 presidential campaign and later leadership retention |
| April–May 2024 | Local and abortion votes, first KPO payment, Article 7 closure and the coalition fight over European credit |
| June–July 2024 | IVF delivery, the Belarus-border soldier's death, European elections and PSL's defeat of abortion decriminalisation |
| August–October 2024 | Widow's pension, movement reckoning, flood reconstruction, migration, Razem's possible exit, Tribunal repair and a negotiated Suwerenna Polska vote that can produce absorption, federation, refusal or individual accessions |
| November–December 2024 | Variable US presidential election, Independence Day, KO and Left presidential nominations, Christmas Eve labour reform, KPO co-financing and the first full coalition budget |
| January–March 2025 | Separate Left presidential campaigns, Braun's Konfederacja rupture, religion and health education, asylum suspension, gender-recognition procedure and the spring audit of the movement settlement |
| April–June 2025 | Braun's Oleśnica hospital confrontation, shorter-working-time pilot, presidential election, cabinet confidence and a gameplay-driven Third Way survival test |
| July–September 2025 | Hołownia's PiS talks unless his anti-duopoly relaunch foreclosed them, Braun's separate seven-count indictment, a cabinet reshuffle or post-confidence formation branch, a conditional Nawrocki oath crisis and compulsory inauguration, Russian drone incursion and a Hołownia succession only if the comeback's retention test fails or presidential office forces it |
| October–December 2025 | A six-file KO consolidation convention with persistent component parties and multiple outcomes, KPO review, Marshal rotation, Independence Day, EU marriage recognition, collective bargaining, Left leadership, CJEU–Tribunal collision and the post-presidential budget |
| January–March 2026 | Poland 2050 chooses Hołownia's successor only when the 2025 succession opened; otherwise the comeback leaves him in charge. A surviving Third Way faces a second gameplay-driven test, while a separated Poland 2050 can itself split; a Trump-dependent ambassador–Marshal crisis or alternate Washington review, competing KRS bills, the de-personalised centrist party and six Tribunal vacancies |
| April–July 2026 | KO component representation, Rozwój+ association-building and PiS's individual loyalty ultimatum, PIP/KPO enforcement, Kanał Zero television, partnership legislation and veto, Tribunal competence, Braun procedure, centrist rupture, hate crime, appointments and the final KPO window |
| August–October 2026 | Individual Rozwój+ hearings followed by a conditional club and possible party; **Scenario horizon:** 2027 budget red lines and a possible judicial-status bill at the Palace |
| November–December 2026 | **Scenario horizon:** Independence Day, a conditional constructive no-confidence motion, final budget, and a conditional snap election followed by presidential and Sejm cabinet attempts |
| January–October 2027 | **Scenario horizon:** a ten-month press cycle, opening and closing campaign choices, and the parliamentary election; the live vote is apportioned to 460 Sejm seats and 100 Senate districts before the game-over epilogue |

Leadership and party-drama scenes use a common five-part structure: the
outgoing and incoming authority, the internal bloc behind the change, the
cause, the resulting threat or opening for Lewica, and two or more responses
Lewica can credibly carry out. Rival parties choose their own leaders and
mergers; the player chooses how to cooperate, compete, investigate or bargain
afterward. The tracked chain covers Schetyna–Budka–Tusk, the 2020 KO candidate
replacement, Hołownia's rise and succession, Gowin's exit, the
Korwin–Mentzen handover, both ends of Third Way, Solidarna/Suwerenna Polska,
KO consolidation and the PiS–Rozwój Plus rupture.

### Persistent rival organisations

PiS/United Right and KO actors now share one `rival_group_records` schema.
Every record keeps legal status, leader and broker, estimated chamber strength,
exclusive transferred seats, organisation, local base, offices, media reach,
cohesion, relation, programme, red lines, outside option, defection readiness
and grievance memory. Internal-current MP estimates may overlap; only
`exclusive_seats` changes parliamentary arithmetic after a recorded person or
club actually leaves.

The opening ledger contains the Kaczyński apparatus, Porozumienie,
Solidarna/Suwerenna Polska, Morawiecki's camp, welfare-conservative, security
and culture-war PiS currents, Rozwój+, PO, Nowoczesna, Inicjatywa Polska, the
Greens, a consolidated KO vehicle and a possible KO splinter. The Greens stay
an allied separate party in every 2025 convention result.

Lewica's recurring **Rival Organisations** card can build an alliance channel,
make a public attack, offer a bounded social-policy concession or recruit one
individual. It cannot change another record's leader or transfer a whole
current. The August 2021 Porozumienie event creates six exclusive seats and
named loyalties. Rozwój+ proceeds from association to ultimatum, bounded
hearings, named departures, a fifteen-MP club test and only then a party test.

A crowded-month desk is a mandatory same-turn queue. It counts every pending
dated event, displays only the highest-priority tier, and recompiles the list
after each return. Once that tier is exhausted, the next tier appears. The
leadership table reopens only when the complete count reaches zero, so resolving
one crisis cannot silently mark its neighbours complete. These event decisions
do not grant or consume another leadership-card play. After a decision, its
consequence headline is appended to the event instead of replacing it; an
explicit return button then opens a clean desk or leadership table.

## Open primary

The open-primary choice no longer appoints Agnieszka Dziemianowicz-Bąk by
default. It creates three decisions:

1. founding-party delegates, members plus movements, or registered supporters
   define the electorate;
2. founder guarantees, two-current endorsements, or supporter petitions define
   ballot access;
3. television, county hustings, or issue forums define the campaign.

Earlier cards unlock the broad franchise, petitions, crossover entrants,
women-led candidates, union candidates and media-ready campaigns. Candidate
weights combine the relevant faction's strength and dissent with preparation
and arena. The engine's seeded random stream then draws from the eligible
weighted field. Biedroń and Zandberg provide a safe core field; Dziemianowicz-
Bąk, Żukowska, Kotula and Biejat require political preparation or organisational
weight.

## Presidential election

The 2020 contest is an election rather than a single Left score check:

- June samples the full candidate field, gives the player exactly two campaign
  operations, then opens a three-stop debate-night hub. Its refugee/religion,
  rights/health and economy/closing blocks can be resolved in any order without
  advancing the month. A linear candidate presentation keeps every profile on
  one page, names all eleven ballot candidates (with the five smallest
  committees clearly identified as a mechanical aggregate), and moves from
  Duda through the rival field to the Left nominee and directly into the
  electoral-line decision.
- The debate verdict is stored once. Adrian Zandberg has a higher floor and
  ceiling; any nominee can break through, disappear in the eleven-candidate
  field or concede the dominant clip to Duda, Hołownia or Bosak. Only the
  verdict changes the last tracking poll before the first-round count.
- Raw first-round totals determine the top two. Duda–Trzaskowski is likely, but
  not hard-coded; a common KO–Left ticket and very strong alternative
  candidates can change the runoff.
- Poll noise and the larger election-day shock are drawn once and stored, so
  reopening a screen or saving and loading cannot reroll the race.
- If nobody wins outright, July asks the Left to endorse or release its voters,
  then permits exactly two support trades. Hołownia, PSL, KO, movements, Bosak
  voters and turnout operations provide partial transfers rather than obedient
  party blocs.
- Duda is the narrow historical favourite on an unexceptional campaign line.
  Razem voters are specifically less compliant with a free transfer to
  Trzaskowski; a written accord and movement mobilisation can recover part of
  the stranded vote, and election-day slack still permits an upset.
- The runoff tracks retained votes, abstention, new turnout, valid votes and a
  separately saved result shock. The winner changes the President and later
  party relations. A Trzaskowski victory first creates a president-elect:
  `president_name` changes only after the oath.

### War of the Powers

A Trzaskowski victory replaces the generic August, October, February, April and
June routes with a five-stage cohabitation chain:

1. PiS challenges certification and delays the National Assembly. A legal
   front, civic mobilisation or private transition bargain is measured against
   obstruction pressure. A failed defence can still force the oath, or let
   Witek claim temporary powers while a disputed Supreme Court panel supplies
   the invalidity judgment constitutionally required for a repeat election.
   The Marshal's interregnum always ends at an oath after that ballot.
2. The abortion judgment tests whether Lewica coordinates a restoration bill
   with the Palace, protects movement autonomy or asks for the old compromise.
3. The judicial war records vetoes and lets the player choose a common veto
   list, European escalation or a selective pandemic bargain.
4. The Palace chooses between an institutional presidency, social
   cohabitation and written no-veto pledges on abortion and marriage equality.
5. After the recovery-fund fracture, June can test one promised signature in
   the Sejm. A pledge does not guarantee 231 votes: United Right fragmentation,
   government dissent and opposition relations decide whether the bill reaches
   Trzaskowski and is signed.

The route separately tracks cohabitation pressure, United Right fragmentation
and right-wing backlash. The last measure feeds cultural and institutional
salience, PiS/Konfederacja momentum and the July election-readiness chart.

## Judiciary and KPO

### Judicial crisis

The post-2023 judiciary route models several institutions that can disagree
with one another:

- prosecutor-command legitimacy and independence;
- KRS selection, appointment legitimacy and disputed judicial cohorts;
- Supreme Court and ordinary-court recognition, vacancies and backlog;
- Constitutional Tribunal composition, domestic recognition and the legal
  effects of contested judgments;
- compliance with CJEU and ECHR judgments;
- the President's appointment power, pardon claims, referrals, veto wall and
  willingness to negotiate.

The 2024 sequence covers the Barski command dispute, warrants at the Palace,
the government's four-part action plan, KRS design, the Sejm's Tribunal
resolution, Article 7 closure and the preventive referral of Tribunal reform.
The 2025 CJEU collision asks what happens to disputed acts and individual
cases. In 2026 rival KRS bills, six Tribunal vacancies and presidential
appointment delay test whether a new statute has actually restored one legal
order.

Government and opposition receive different choices, but neither receives a
magic “fix courts” button. A broad invalidation or administrative shortcut can
raise the immediate repair mandate while worsening procedural restraint, legal
dualism, vacancies or backlog. Individual review is slower and may overwhelm
the courts. European normalisation improves external standing without
automatically deciding every domestic office or judgment.

### KPO and recovery-fund capacity

KPO is tracked through milestone progress, real delivery, unlocked funding
blocks, committed blocks, deadline pressure, shortcut debt and public political
credit. Its dated chain includes:

1. the February 2024 payment dossier;
2. the first payment and its allocation;
3. the Article 7 credit fight;
4. KPO co-financing at the 2024 budget;
5. the 2025 midterm review and possible correction or delay;
6. the recovery-fund bridge into the 2026 budget;
7. the Labour Inspection milestone and the choice between funded enforcement
   and paper compliance;
8. the final 2026 completion window.

Judicial legitimacy and procedural choices can improve or damage payment
readiness, but the tracks are not identical. Money may arrive while domestic
institutions remain contested; a later tranche can still be conditioned or
delayed. A governing Left can commit ready KPO projects and convert
co-financing into state-budget capacity. An opposition Left can audit,
condition votes and claim political credit, but it never receives authority to
spend the state funds. Each decision ends on a compact ledger whose prose
changes for clear gains, marginal gains, invisible results and political
losses.

## Senate

The 2019 chamber begins with PiS on 48 seats and a nominal opposition pact on
52. Cohesion and relations reduce that to a 51-vote working majority. Lewica's
two senators are pivotal only when the non-Left opposition cannot reach 51
without them.

The Senate docket distinguishes the procedures:

- an ordinary bill may be accepted, amended or rejected before returning to
  the Sejm;
- a budget may be amended within its shorter timetable but cannot be rejected;
- a deadlocked docket always has a no-cost minority-note fallback;
- cohesion, amendment credit and Left leverage persist into the two annual
  budget stages.

The August 2023 campaign adds the historically distinct choice between three
Sejm lists and a coordinated Senate Pact. Election night then runs 100 seeded
single-member district contests: every active committee fields at most one
candidate in a district, the largest district vote wins, and there is no
national threshold or proportional top-up. Running three democratic Senate
slates separately therefore splits votes which a pact would combine.

From the 2024 budget onward, a governing Left cannot skip the elected Senate.
An unfriendly majority may return corrections. The cabinet may incorporate
them, negotiate a narrower package, or ask the Sejm to reject them by absolute
majority. Failure leaves the corrections in force and records a coalition
deadlock; the Senate still supplies no cabinet-confidence votes.

This follows Constitution Article 121 for ordinary bills and Articles 223–225
for budgets. The Senate is not included in cabinet-confidence arithmetic.
([ordinary legislation](https://libr.sejm.gov.pl/tek01/txt/kpol/eng/ek5.html);
[budget procedure](https://libr.sejm.gov.pl/tek01/txt/kpol/eng/ek11.html))

## Public opinion and panic

Public mood is not a single left–right approval score. Nine issue fields each
hold three 0–100 values:

| Field | What support means |
| --- | --- |
| Abortion rights | Support for liberalisation and access |
| Refugee and asylum solidarity | Support for protection and lawful access |
| Eastern-border security | Support for a firm, capable border state |
| Vaccination and public health | Trust in collective health measures |
| Social spending and public services | Support for taxation, benefits and provision |
| LGBT equality | Support for equal legal status |
| Secular state and religion in schools | Support for institutional secularisation |
| Rule-of-law repair | Support for repairing courts and constitutional bodies |
| Defence and allied security | Support for defence capacity and alliances |

`support` describes the underlying constituency for a proposition. `salience`
describes how strongly it is driving the current agenda. `backlash` describes
the organised hostile reaction that can punish an otherwise popular move.
Support is persistent; salience cools gently between shocks. The monthly model
also derives an overall public-pressure index, a qualitative consensus or panic
climate and the hottest issue.

Existing event qualities feed this layer through a change bridge. A border
death, protest wave, vaccination failure, welfare delivery or equality fight
therefore changes the relevant public field without every older event needing
to be rewritten. Selected cards—including rallies, programme conventions,
public-service guarantees, health policy, equality bills and PSL bargains—read
the current support, salience and backlash before applying their effects.

Their stored reception ranges from a strong reversal through backlash,
contested politics and favourable reception to a breakthrough. The response
scales political gains and losses, changes future opinion, and selects
different result prose. A popular policy with very low salience may pass
quietly; a popular but highly mobilised issue may create both a larger gain and
a larger counter-movement. The opinion ledger displays all 27 component values,
the pressure index, hottest field and latest tested action. It is distinct from
party polling: one measures issue climate, the other aggregates electoral
choice.

## Polling and voter groups

The coloured percentages are no longer independent counters. Eight mutually
exclusive blocs sum to the electorate:

1. the urban middle class;
2. professionals and academics;
3. public-service families;
4. industrial and logistics voters;
5. provincial welfare voters;
6. rural localists;
7. older welfare households;
8. young adults and students.

Each bloc has an electorate share, likely turnout, economic and cultural
preferences, and a score for every active party. Organisation, issue
credibility, party positioning and bloc-specific affinity let all parties
compete for every segment.

Every monthly update:

1. converts authored poll shocks into decaying party momentum;
2. recalculates bloc turnout and party consideration;
3. aggregates an underlying national vote intention;
4. takes a modest seeded sample for the public headline poll;
5. produces a national d'Hondt seat indicator for coalition planning.

PiS, KO, PSL, Konfederacja and, after its emergence, Poland 2050 hold separate
organisational pools, receive annual income and choose background actions.
They reposition on hidden economic, cultural and overall left–right axes as
issue salience, Lewica's choices and competition from Konfederacja change.

### Rival ideology and internal caucuses

The monthly AI compares the underlying support of Lewica and Konfederacja.
This produces a hidden party-system pendulum with political memory:

- sustained Left strength and labour credibility pull rivals toward social
  spending, public services and a more liberal rights offer;
- a Konfederacja surge, far-right issue ownership and COVID anti-system
  recruitment pull the democratic camp toward market, order and culturally
  cautious positions;
- inertia limits the movement in one month, while major dated events can
  deliver a larger shock.

Rival parties are not unitary actors. Their active internal balances are:

| Party | Competing currents |
| --- | --- |
| PiS | social solidarists and market hardliners |
| KO | social liberals and classical liberals |
| PSL | agrarian pragmatists, conservatives and coalition managers |
| Konfederacja | Braunists, Mentzenite/Korwinist market radicals and nationalists |
| Poland 2050 | state-capacity reformers, Christian democrats and Hołownia personalists |

The leading current changes action selection and issue positioning. It also
feeds separate hidden acceptance scores for social policy, rights, order and
security, market policy, and coalition cooperation. These are live response
hooks for proposal scenes rather than automatic vote results. Event authors
can therefore let PiS cooperate on a social amendment and reject a rights bill,
or let PSL welcome local money while still preparing a right-wing coalition
threat, without deriving both answers from one relationship number.

The hidden rival-to-rival relation matrix receives explicit shocks from
cooperation and attacks, then a small passive drift from ideological distance
and coalition openness. The interface exposes coalition compatibility rather
than the matrix. It also withholds the raw axis, caucus and acceptance numbers.
The rival ledger instead names the national climate, each party's dominant
current and whether it is drifting, followed by the public action through which
the player can infer the change.

The indicator applies list thresholds but is deliberately labelled as a
national approximation. Actual current Sejm mandates remain fixed chamber
state, and a future full election system still needs district allocation,
committee/coalition registration and local candidate effects.

## Active quality groups

The playable code starts with six caucuses:

- `barons`: old SLD organisational elites, socially cautious and economically
  accommodationist;
- `spring`: the Wiosna organisation and leadership network;
- `labor`: trade-union and public-service social democrats;
- `progressives`: the younger, more women-led secular and equality current;
- `razem`: Razem as a cooperating but legally autonomous party current;
- `pps`: a tiny, low-influence socialist current.

Each has `*_strength`, `*_dissent`, active/in-Left membership flags, a live
display name, an independent-party name, an electoral outside option, grievance
memory and an escalation stage. The MP record also separates offices, local
organisation, personal following, ideological intensity, list dependence and
broker cohesion.
`factions` contains only caucuses that still belong to the Left. Strength is
normalised across that live roster, so merged and departed organisations cast
no hidden internal vote. Weighted dissent creates persistent unity pressure,
and a caucus with at least 12 strength and 60 dissent becomes an active veto
player. Escalation advances at most one stage per month: private leaks; a
demand and deadline; public criticism or a free-vote threat; refusal to whip;
individual defections; a parliamentary club; and an organised competing list.
The caucus-specific deadline crisis offers a bespoke settlement, a free-vote
concession or rejection. Sustained pressure determines what follows.

Two additional tendencies can organise. Repeated welfare-conservative and
sovereignty choices transfer real weight into **Lewica Patriotyczna**, a
seventh Social-Patriot organisation with referrals, a leadership slate,
monthly actions, crisis events and threshold-aware electoral AI. Independent
Lewica Patriotyczna runs alone when it clears 5%; otherwise it seeks PiS list
places rather than joining Razem. Capitalist and
lower-tax choices build a cross-cutting Market Left affinity. Moving far
enough right also adds persistent dissent and grievance to Wiosna, labour,
progressives, Razem and PPS, which can carry those existing caucuses through
the normal breakaway ladder.

Structural events use the same machinery. Lewica Patriotyczna can remain in
the common party, supply its leadership or leave through the full staged split
and polling route. The Wiosna merger removes `spring`
and transfers its complete live strength between the labour and younger
progressive successors. Razem can sit inside the Left, leave with its MPs or
later return through an explicit pact. PPS can leave or use its own reunion
route, but never attaches to a Razem list. Barons, labour and progressive
currents can also form their own named parties. MPs move individually before
and during a split, so officeholders and list-dependent deputies can remain in
the coordinating-centre caucus. The departed organisation no longer appears
in internal ratification, advisor counts or the main Left caucus display.

Other active state clusters include:

- unity, polling, seats, resources and public trust;
- relations with KO, PSL, Poland 2050, PiS and the president;
- hidden rival ideology, internal caucus shares, issue acceptance,
  party-system pressure and passive pairwise relations;
- nine public-opinion support, salience and backlash triplets, plus public
  pressure, hottest issue and last card reception;
- labour, progressive, feminist, media, local and movement capacity;
- prosecutor, KRS, Supreme Court, Tribunal, European-compliance, vacancy,
  backlog, legal-dualism and presidential-judiciary state;
- KPO milestones, delivery, unlocked and committed blocks, delayed funds,
  deadline pressure, shortcut debt and political credit;
- health, household security, fiscal stress and government delivery;
- police/military trust, border confidence, minority safety and far-right
  agenda power;
- explicit completion flags for every dated event and annual budget.

Military and police qualities describe public confidence and professional
capacity. They are not coup or partisan-loyalty meters.

## Annual budget rule

Every complete playable year ends in the shared budget dossier. Party resources
never become state money. The serializable state is `budget_game`; completed
texts and execution results are appended to `budget_history`, while event
routing retains only year, fiscal year, completion/pass flags, exact vote,
posture, result, deficit and implementation status.

The board has nine allocation lines and four tiers. One point is 0.25% GDP:
Cut releases one, Maintain preserves the inherited baseline, Fund costs one and
creates a one-capacity commitment, and Flagship costs two of each. Statutory
floors cannot be cut. The live rail shows author, room, deficit/debt and the
exact deterministic Sejm tally.

A governing Left selects and edits a proposal authored by a live cabinet
party, chooses one financing card, and meets visible party/current red lines or
stamps a disclosed deal. A first defeat allows one revision with at least two
changed decisions. Senate acceptance, a one-resource compromise and a
231-vote override are resolved on the same compact file.

An opposition Left chooses:

1. **Vote no; this is their budget** — free and immediate, with no amendment
   or programme credit and no arbitrary rebels.
2. **Bargain** — spend visible leverage on up to two affordable allocation
   amendments, then support, abstain or reject.
3. **Shadow budget** — spend one resource to edit a Left-authored alternative;
   it earns ownership but never changes state spending.
4. **Coalition wedge** — spend one resource against one actually unmet
   governing-party red line, with the affected delegation shown before use.

Enactment changes debt, revenue and deficit. January execution separately
changes services and political credit. Government capacity is 1–4 and is
assigned to funded/flagship commitments; an opposition player instead audits
the cabinet's deterministic assignment. Both phases are guarded against
duplicate effects.
## Election presentation, ministries and confidence

The presentation layer adapted from the inherited election flow is now active
in Polish scenes. July 2023 displays a projected Sejm semicircle, coalition
worksheet and readiness assessment, then returns to the campaign. August adds
a list-negotiation sequence covering an independent Lewica list, an autonomous
Left coalition, a Razem-hosted list, KO, a broad democratic committee, Third
Way or one of its parties, and PiS. Relations, ideological distance, internal
ratification and the offered terms determine each answer. An 8% coalition
committee preserves each party's subsidy claim and autonomy; a 5% party list
gives the host nominations and money, making autonomous partners hesitant.
Minor breakaways decide individually whether to join Razem or a Left
coalition. SLD and PPS remain separate. In October
the continuous route apportions 460 certified seats from the campaign's stored
projection, carries the negotiated committee and its 5% or 8% threshold into
the count, divides shared-list seats back among their component parties, and
presents a result table, Sejm chart and viable coalition arrangements.
Departed Left caucuses contest under their own names and thresholds unless
they accepted a negotiated shared list; Unia Centrum, Rozwój and Korona
likewise receive separate votes and seats when the Poland 2050, PiS or
Konfederacja split chains create them.
The standalone formation drill instead uses the historical 2023 snapshot.

If Lewica joins a cabinet, its coalition mandate becomes ministry leverage.
The player sees a full thirteen-office round: Labour, Equality, Housing, Health,
Digital Affairs, Science, Interior, Finance, Development and Technology,
Justice, Foreign Affairs, Agriculture and Defence. Every portfolio has a
corresponding Government Affairs card. KO normally blocks Finance and Foreign
Affairs or demands a harsh renegotiation; PSL treats Agriculture as a hard
coalition claim. These blocked offices remain visible so that the player sees
the whole cabinet bargain. Confidence-and-supply leaves every ministry with the
coalition instead.

Cabinet Reshuffle reopens the live roster after formation. Coalition Council
adapts the inherited coalition-management pattern to four-party bargaining, and
Social Welfare provides a cross-cabinet delivery file that is not tied to one
minister. Together with the thirteen portfolio cards, these restore the
government-play breadth of the inherited cabinet without importing its German
institutions.

The 2023 formation sequence uses three distinct constitutional thresholds:

- the President's first nominee and the Sejm's second-attempt candidate require
  an absolute majority of votes with at least half of all deputies present;
- the President's third attempt uses a majority of votes cast with the same
  quorum;
- a constructive vote of no confidence always needs at least 231 deputies and
  must name the replacement prime minister.

The historical baseline gives Morawiecki 190 votes and routes his failure into
the Sejm attempt. A democratic coalition then chooses its candidate rather than
receiving Tusk automatically: candidate availability, partner relations,
internal dissent and the pact determine which names can be delivered. The
continuous result can change that arithmetic, so PiS courtship and caucus
defections are real alternate paths rather than flavour. The Senate never
contributes confidence votes.

The 2025 presidential election reuses the all-party polling state rather than
appointing the historical winner. A debate can move the last poll; the first
round selects finalists; the inter-round market trades only partial support;
and the runoff result changes the August inauguration, veto environment and
post-election confidence crisis. If Nawrocki defeats a functioning non-PiS
government while Hołownia remains Sejm Marshal, an alleged approach to delay
the National Assembly becomes playable. The Marshal can reject it, audit named
precincts without moving the oath, or briefly claim acting powers. A successful
delay creates severe domestic and foreign-policy damage but cannot reverse the
certified result: the next event always installs the elected President.

The post-cutoff 2026 crisis uses the same constitutional distinctions:

- a constructive no-confidence motion must name Morawiecki, Czarnek, Szydło
  or another replacement and find 231 votes; failure does not dissolve the
  Sejm;
- a failed final budget can be rescued, produce a replacement-cabinet vote, or
  create a request for an early election;
- an election occurs only through two-thirds self-dissolution, the
  presidential budget-deadline power, or exhaustion of all three cabinet
  attempts;
- the alternative election normalises the current all-party seat projection
  to 460 mandates. The Palace tries Morawiecki, Czarnek or Szydło first and may
  offer a welfare pact to split Lewica. If that nominee fails, the Sejm may
  test Tusk, Trzaskowski, Nowacka, Sikorski or the Left's presidential figure.

The implementation is grounded in Constitution Articles 154–160 and the
official 11–12 December 2023 Sejm roll calls.
([constitutional procedure](https://libr.sejm.gov.pl/tek01/txt/kpol/eng/ek7.html);
[Morawiecki vote](https://www.sejm.gov.pl/sejm10.nsf/agent.xsp?NrGlosowania=102&NrKadencji=10&NrPosiedzenia=1&symbol=glosowania);
[Tusk vote](https://www.sejm.gov.pl/sejm10.nsf/agent.xsp?NrGlosowania=103&NrKadencji=10&NrPosiedzenia=1&symbol=glosowania))

Skipping a monthly leadership action creates neglect pressure, while hard mode
adds structural dissent and trust decay. Most recurring deck cards have a
short or annual cooldown; advisor interventions share their own six-month
cooldown; leadership reshuffles require six months. These limits prevent one
meeting, personality or media format from becoming an infinitely repeatable
source of unity or attention.

Low unity and sustained sub-threshold intention reduce dues and campaign
capacity, produce contradictory media lines, failed whips, adviser
resignations and individual defections, and can eventually create
parliamentary clubs and competing lists. The player remains the strategic
coordinating centre or rump until an election: failing to return the
player-controlled list to the Sejm ends the run. Elections apply the legal
threshold to each Left list; surviving campaigns still score competing lists,
wasted votes and the seats won by the wider electoral family.

## Conversion boundary and next work

The old German scenes remain as dormant reference code. Replacing every old
identifier mechanically would make the compiled repository look converted
without producing valid Polish institutions. New Polish chapters should remain
on the isolated router while inherited systems are replaced one at a time.

The continuous national campaign, 2023 transfer, annual budgets, 2025
presidential contest and conditional 2026 crisis are now connected. Important
limits remain:

- Sejm elections use a national d'Hondt-style indicator and 460-seat
  apportionment rather than 41 district contests, candidate lists and district
  remainders;
- only selected cards directly calculate issue reception, while the monthly
  bridge carries older event changes into the public-opinion layer;
- many ledger ideas remain branches rather than authored scenes, especially
  deeper local-government, ambassador, media-ownership and alternative-party
  leadership chains;
- chronology after July 2026 is intentionally a labelled scenario horizon,
  not an attempt to fabricate future research.

The detailed unimplemented and counterfactual inventory remains in
`SCENARIO_LEDGER.md`.
