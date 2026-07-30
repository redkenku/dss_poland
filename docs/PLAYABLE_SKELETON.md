# First playable skeleton

This document describes code that exists now. Broader historical research and
counterfactual designs remain in the other ledgers.

## Scope

The main vertical slice begins in **October 2019**, immediately after Lewica's
return to the Sejm with 49 deputies, and runs continuously through **December
2026**. Monthly leadership turns combine a native card hand, factional
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
       -> draw from Party Affairs or government-only Government Affairs
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
  -> poland_ending

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

1. **Party Affairs** supplies sixteen cards. **Government Affairs** supplies
   four cards and appears only when Lewica holds a relevant ministry in a
   cabinet with confidence. **Negotiation with Government** appears only when
   Lewica is outside a functioning cabinet and offers crisis cooperation,
   oversight bargains or presidential mediation. These are the only live
   decks.
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

The twelve-advisor roster is chosen through the same five political caucuses
used by the internal-party simulation. Active personalities and portraits are
displayed directly:

| Caucus | Advisors |
| --- | --- |
| Old SLD / barons | Włodzimierz Czarzasty, Dariusz Wieczorek |
| Wiosna / Spring | Robert Biedroń |
| Labour current | Agnieszka Dziemianowicz-Bąk |
| Younger progressive SLD | Anna-Maria Żukowska, Katarzyna Kotula, Krzysztof Gawkowski, Wanda Nowicka |
| Razem | Adrian Zandberg, Magdalena Biejat, Marcelina Zawisza, Paulina Matysiak |

The starting bureau is Czarzasty, Biedroń and Zandberg.

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
| January 2020 | Media ecosystem investment |
| February 2020 | Candidate-aware early presidential campaign briefing |
| March 2020 | COVID-19 lockdown response |
| April 2020 | Attempted postal presidential election |
| May 2020 | Social shield priorities |
| June 2020 | Presidential field, two campaign moves, debate, tracking poll and first-round count |
| July 2020 | Dynamic runoff—or first-round confirmation—with endorsement and support trading |
| August 2020 | Trzaskowski certification/oath crisis if he wins; otherwise post-election briefing |
| September 2020 | SLD–Wiosna/Nowa Lewica architecture |
| October 2020 | Constitutional Tribunal abortion ruling; conditional Palace–Tribunal showdown |
| November 2020 | Women's Strike organisation and programme; pandemic-era Independence Day response |
| December 2020 | Opposition budget line, weighted caucus ratification and Senate amendments |
| January 2021 | Vaccination strategy |
| February 2021 | Conditional Trzaskowski judicial-veto war |
| March 2021 | SLD becomes Nowa Lewica |
| April 2021 | Conditional Palace strategy: institutions, social cohabitation or equality compact |
| May 2021 | EU recovery-fund vote |
| June 2021 | Opposition strategic reset, or a conditional abortion/marriage/judicial signature test |
| July 2021 | Merger revolt |
| August 2021 | Minority-government arithmetic and COVID anti-restriction recruitment |
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
| May 2023 | Lex Tusk, 4 June mobilisation and PiS's 800+ welfare counter-offer |
| June 2023 | News desk: the 4 June march and renewed “Not one more” protests |
| July 2023 | Konfederacja's summer surge, competing PiS solidarism and the election-readiness projection |
| August–September 2023 | Electoral lists, five-current guarantees and the visa scandal |
| October–December 2023 | Parliamentary result, Morawiecki's presidential nomination, investiture, Sejm-led cabinet attempt, ministries, transfer of power, Braun's menorah attack, public media, Independence Day and the inherited budget |
| January–March 2024 | Competing prosecutor commands, Kamiński/Wąsik warrants and pardons, Republika's advertiser crisis, farmers, Kanał Zero, the KRS action plan and the Sejm's Tribunal resolution |
| April–May 2024 | Local and abortion votes, first KPO payment, Article 7 closure and the coalition fight over European credit |
| June–July 2024 | IVF delivery, the Belarus-border soldier's death, European elections and PSL's defeat of abortion decriminalisation |
| August–October 2024 | Widow's pension, the post-abortion-defeat movement reckoning, flood reconstruction, falling refugee solidarity, asylum suspension, Razem's possible exit and presidential referral of Tribunal repair |
| November–December 2024 | Independence Day, KO and Left presidential nominations, Christmas Eve labour reform, KPO co-financing and the first full coalition budget |
| January–March 2025 | Separate Left presidential campaigns, Braun's Konfederacja rupture, religion and health education, asylum suspension, gender-recognition procedure and the spring audit of the movement settlement |
| April–June 2025 | Shorter-working-time pilot, presidential debate, both election rounds, support trading, cabinet confidence and the two-stage Third Way/PSL settlement |
| July–September 2025 | A cabinet reshuffle or post-confidence formation branch, presidential inauguration, Russian drone incursion and Hołownia succession |
| October–December 2025 | KO consolidation, KPO review, Marshal rotation, Independence Day, EU marriage recognition, collective bargaining, Left leadership, CJEU–Tribunal collision and the post-presidential budget |
| January–March 2026 | Poland 2050 succession and split, ambassador–Marshal crisis, competing KRS bills, the de-personalised centrist party and six Tribunal vacancies |
| April–July 2026 | KO's enlarged leadership, PIP/KPO enforcement, Kanał Zero television, partnership legislation and veto, Tribunal competence, Braun procedure, centrist and PiS ruptures, hate crime, appointments and the final KPO window |
| September–October 2026 | **Scenario horizon:** 2027 budget red lines and a possible judicial-status bill at the Palace |
| November–December 2026 | **Scenario horizon:** Independence Day, a conditional constructive no-confidence motion, final budget, and a conditional snap election followed by presidential and Sejm cabinet attempts |

A crowded-month desk is a mandatory same-turn queue. It counts every pending
dated event, displays only the highest-priority tier, and recompiles the list
after each return. Once that tier is exhausted, the next tier appears. The
leadership table reopens only when the complete count reaches zero, so resolving
one crisis cannot silently mark its neighbours complete. These event decisions
do not grant or consume another leadership-card play.

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
  advancing the month. A linear candidate presentation moves from Duda through
  the rival field to the Left nominee and directly into the electoral-line
  decision.
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
   obstruction pressure. A failed defence can still force the oath, or concede
   a repeat election and leave the Sejm Marshal as acting president.
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

1. metropolitan liberals;
2. liberal professionals;
3. public-service families;
4. industrial and logistics voters;
5. provincial welfare voters;
6. rural localists;
7. older welfare households;
8. anti-establishment youth.

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

The playable code uses five caucuses:

- `barons`: old SLD organisational elites, socially cautious and economically
  accommodationist;
- `spring`: the Wiosna organisation and leadership network;
- `labor`: trade-union and public-service social democrats;
- `progressives`: the younger, more women-led secular and equality current;
- `razem`: Razem as a cooperating but legally autonomous party current.

Each has `*_strength` and `*_dissent`. Strength is normalised to a 100-point
factional makeup. Weighted dissent creates persistent unity pressure, and a
caucus with at least 12 strength and 60 dissent becomes an active veto player.
Those values gate congress, programme, primary, Senate, formation and budget
choices as well as weighting annual ratification.

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

Every complete playable year ends with a fiscal test. Party resources never
become state money: budget capacity is visible and spendable only while Lewica
governs, receives one normal restoration at the beginning of the year, and can
gain limited extra room from KPO co-financing.

The 2019–2022 opposition votes test whether the alliance can state one fiscal
position:

1. The normal line is a social-shield, local-survival or equality-and-care
   alternative. A selective PiS bargain requires an earlier government or
   Palace channel.
2. Unity, dissent, unfunded promises and prior breaches create a common-support
   floor, after which each mini-caucus applies its own modifier.
3. At least 55% weighted backing is required and no more than one caucus may
   fall below its 35% red line. Narrow results name rebels; failure damages
   unity, trust and polling.
4. In 2019 and 2020 the common line enters the Senate amendment stage. A
   case-by-case PiS deal never counts as ratification of a common opposition
   budget.

From December 2023 through December 2026, a governing Left chooses among a
funded social protocol, a rural-social compact, a fiscal minimum or a direct
coalition dare. The package sets internal backing and possible caucus vetoes.
The chamber count then combines:

- actual coalition and Left seats;
- internal Left rebels;
- KO, PSL and centrist relations;
- general coalition dissent and earlier party ruptures;
- the package's partner bonus or penalty;
- a stored small roll-call shock.

A carried budget returns to the monthly event desk because other December
crises may still be pending. A defeat opens an emergency council. The player
can buy PSL back with a written rural guarantee, rebuild around a Left red
line, offer another democratic prime minister, or accept an early election.
The first three choices receive a rescue confidence roll. Failure removes
Lewica's spending authority, creates a caretaker and activates the later
constitutional election route.

If Lewica is in opposition in 2023–2026, the state budget is assumed to be
carried by its governing majority unless that government has already
collapsed. The player may vote no with a complete shadow budget, bargain for
specific amendments or lend a politically costly favour. None grants budget
capacity.

## Election presentation, ministries and confidence

The presentation layer adapted from the inherited election flow is now active
in Polish scenes. July 2023 displays a projected Sejm semicircle, coalition
worksheet and readiness assessment, then returns to the campaign. In October
the continuous route apportions 460 certified seats from the campaign's stored
projection, divides Left, PSL and Poland 2050 mandates among their internal
caucuses, and presents a result table, Sejm chart and viable coalition
arrangements. The standalone formation drill instead uses the historical 2023
snapshot.

If Lewica joins a cabinet, its coalition mandate becomes ministry leverage.
The player allocates that leverage among Labour, Equality, Housing, Health,
Digital Affairs and Science; held portfolios unlock the full-spending choice
on the corresponding Government Affairs cards. Confidence-and-supply leaves
every ministry with the coalition instead.

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
post-election confidence crisis.

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

The campaign fractures at unity 12 or below. It collapses electorally only
after underlying Lewica intention remains below 5% for two consecutive monthly
updates; a single noisy headline poll cannot end the game.

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
- the 2023 Senate composition is certified from its historical result rather
  than generated by a 100-district simulator;
- only selected cards directly calculate issue reception, while the monthly
  bridge carries older event changes into the public-opinion layer;
- many ledger ideas remain branches rather than authored scenes, especially
  deeper local-government, ambassador, media-ownership and alternative-party
  leadership chains;
- chronology after July 2026 is intentionally a labelled scenario horizon,
  not an attempt to fabricate future research.

The detailed unimplemented and counterfactual inventory remains in
`SCENARIO_LEDGER.md`.
