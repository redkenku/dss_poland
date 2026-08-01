# Political simulation model for DSS Poland

Last researched: **29 July 2026**.

Status: **design document with an implemented first layer**. Sections labelled
as playable describe the October 2019–July 2023 campaign and the separate
October–December 2023 formation prototype. The fuller caucus, economy,
institution and district-level election models remain future work.

This document answers six questions:

1. What replaces the inherited Weimar military, police, paramilitary and
   Great-Depression simulation?
2. How should Polish voters and parties behave?
3. How does every year culminate in a budget and coalition-confidence crisis?
4. How should courts, border institutions and protest movements retain their
   own legitimacy and capacity?
5. How do racism, minority safety and radical-right agenda power interact
   without becoming one “extremism” bar?
6. How can the campaign be punishing without becoming arbitrary or unwinnable?

The factual background is in
[POLITICAL_TIMELINE.md](POLITICAL_TIMELINE.md). Candidate event chains are in
[SCENARIO_LEDGER.md](SCENARIO_LEDGER.md). The communications layer is in
[MEDIA_MODEL.md](MEDIA_MODEL.md).

## Design premise

The player is not an omnipotent chairperson of one coherent party. The player
is the strategic centre trying to hold together a **left camp whose members
lend it conditional authority**.

At different dates, that camp includes:

- the SLD legal machine and regional networks;
- an old SLD elite or “baron” tendency;
- younger and more progressive SLD politicians;
- Wiosna's organisation and socially progressive brand;
- Razem's separate party, programme and activists;
- PPS, Unia Pracy, independents and later ex-Razem bridge figures;
- ministers, MPs, MEPs, local councillors, unions and social movements whose
  interests do not perfectly align.

The core challenge is not to maximise a single popularity statistic. It is to
make enough of these actors prefer a common left project to:

- taking a safe place on a KO list;
- preserving a smaller independent party;
- remaining a movement outside government;
- trading programme for office;
- moving toward a culturally conservative, welfare-oriented centre;
- letting a rival fail and rebuilding afterward.

## Playable resource contract

Two inherited-looking numbers now have deliberately different authority:

| Quality | Political meaning | Refresh and access |
| --- | --- | --- |
| `resources` | Party cash, organisers, staff time, relationships and organisational potential. | Generally uncapped. Annual income is collected once when January begins; there is no monthly refund. Severe internal dissent can reduce the collection. |
| `budget` | A government's abstract room to fund commitments beyond the inherited baseline. | Generally uncapped and permitted to become negative. Hidden and unusable unless `left_in_government = 1`; the annual government budget settlement refreshes the usable position. |

Opposition events may propose amendments, publish alternatives, vote against,
abstain or support the government after an issue deal. They may spend party
resources to research and organise that stance. They never spend the state
budget and never acquire governing authority merely by improving relations
with PiS, KO, the President or a Senate majority.

### Authority and state ledgers

Policy uses one causal sequence: **proposal → negotiated concession → passage
→ implementation**. Opposition work can raise pressure, improve scrutiny, win
a conditional concession or supply votes. It cannot directly increase hospital
capacity, household security, KPO delivery or national administrative capacity.
Those ledgers move only when the competent cabinet, ministry, chamber or other
institution acts, including a delayed callback that verifies a prior bargain.

`coalition_seats` has one meaning everywhere: MPs belonging to recognised
parties that hold at least one Council of Ministers portfolio. It excludes
external confidence-and-supply votes, one-off confidence recruits and the last
roll-call yes total. Those remain in the explicit `confidence_*` qualities.

Party congresses select party officers; the Sejm and Senate elect their own
Marshals. Normalisation may vacate an incompatible office, but a full authority
event records the institution that fills it. It may not silently turn an
independent prime minister into a party cabinet or install a new party leader.

## Factions have two layers

Formal origin and political tendency must be separate. This is the cleanest way
to use the user's intended factions without rewriting real biographies.

### Layer 1: organisational ancestry

An actor belongs to or comes from an organisation:

- SLD;
- Wiosna;
- Razem;
- PPS/Unia Pracy;
- trade-union or movement milieu;
- unaffiliated/transfer.

This layer determines membership files, local organisations, money, candidate
places, legal control and personal networks.

### Layer 2: political caucus

An actor can simultaneously participate in a tendency:

- **SLD barons / old elite:** old networks, regional control, ministerial and
  state-company experience, post-communist capitalism, coalition pragmatism and
  greater social conservatism;
- **younger progressive left:** more women-led, parliamentary and media-facing,
  secular, feminist and LGBT+ supportive;
- **Wiosna social progressives:** movement branding, equality, secularism and
  Biedroń-era personal networks;
- **labour and social-state left:** unions, inspection, collective bargaining,
  shorter working time, public services and redistribution;
- **Razem programme left:** party autonomy, housing, health, workplace power,
  internationalist anti-authoritarianism and suspicion of uncosted coalition
  promises;
- **government pragmatists:** value delivery, ministries and coalition access
  over public confrontation;
- **movement purists:** value mobilisation and ideological credibility over
  office.

The user's “old SLD” is therefore the **baron tendency**, with
Dariusz Wieczorek and Rozenek-type figures serving as archetypes: an old elite,
socially cautious and economically accommodationist, with links to the
post-transition establishment. The intended “new SLD” is the younger,
progressive, increasingly women-led tendency associated with
Anna-Maria Żukowska and Katarzyna Kotula-type politics.

That last grouping is deliberately functional rather than genealogical.
Żukowska is SLD-derived; Kotula is historically Wiosna-derived. In this model,
Kotula can have **Wiosna ancestry** and belong to the **younger progressive
caucus**. She is not falsely relabelled as an SLD organisational product.

These examples are archetypes, not a complete or final assignment of living
politicians. A dedicated prosopographical research pass is still required.

### Why overlapping factions matter

One-dimensional faction membership produces implausible blocs. The two-layer
model permits:

- SLD regional machinery supporting a younger progressive leader in exchange
  for list guarantees;
- a Wiosna politician siding with the old guard to keep a ministry;
- Razem's labour wing cooperating with an SLD labour minister while its party
  leadership remains outside cabinet;
- a baron backing abortion reform but opposing economic confrontation with KO;
- young progressives splitting over whether visibility or material delivery
  matters more.

## Every party is a coalition of mini-parties

A party should have a public line, but that line is the result of internal
bargaining. It is not the preference of a single unitary AI.

### Common caucus record

Every important caucus needs:

| Field | Meaning |
| --- | --- |
| **leader and broker** | Public leader plus the person who actually counts votes and negotiates. |
| **MPs/senators/MEPs** | Parliamentary strength by chamber. |
| **local base** | Mayors, councillors, regional branches and candidate supply. |
| **organisation** | Members, staff, money, legal assets and campaign capacity. |
| **offices** | Ministries, Marshal/deputy offices, committee chairs and state appointments. |
| **media reach** | Friendly outlets, personal followings and digital networks. |
| **policy priorities** | Ranked goals rather than one ideology number. |
| **red lines** | Choices that generate revolt even when compensated. |
| **electoral outside option** | Expected result alone, on another list or in a splinter. |
| **cohesion** | Ability of the caucus broker to deliver its own members. |
| **defection readiness** | Preparations for a new club, party or list. |
| **grievance memory** | Unpaid promises, humiliations and unequal sacrifices. |

### Party aggregation

When a party decides a budget, coalition or major bill:

1. each caucus evaluates policy, offices, electorate, rivals and grievance;
2. brokers negotiate an internal package;
3. the formal leader proposes a party line;
4. caucuses accept, demand a free vote, abstain, rebel or prepare to split;
5. individual MPs comply according to list dependence, personal brand,
   ideological intensity and the credibility of punishment;
6. only then does inter-party coalition negotiation begin.

A party can therefore promise twenty votes and deliver seventeen. A leader who
repeatedly promises votes they cannot deliver loses both coalition trust and
internal authority.

### Escalation is a ladder, not a cliff

The playable faction record now carries this disagreement through seven
persistent stages: private grumbling and leaks; a specific demand with a
deadline; public criticism or a threatened free vote; rebellion, a leadership
challenge or refusal to whip; individual defections; a parliamentary circle or
club; and only then an organised party and electoral-list split. A settlement
can answer the deadline early. Unanswered grievances remain in memory and make
later escalation easier.

MP movement is deliberately smaller than a caucus strength estimate. At the
defection and list stages, each caucus applies office-holding, local
organisation, personal following, ideological intensity, dependence on the
common list and broker cohesion. Some MPs can defect before the organisation;
others can keep ministries, constituency links or nominations and remain with
the coordinating centre after their old caucus launches a party. A faction
therefore cannot automatically deliver every MP attributed to it.

Low unity no longer ends the campaign. It withholds dues, consumes media,
local and organiser capacity, produces contradictory appearances, failed
whips, adviser resignations and individual defections, and can eventually
create clubs and competing lists. The player continues as the strategic
coordinating centre or rump. National election calculations apply each list's
threshold separately, and the December 2026 assessment scores lists, wasted
sub-threshold votes and family seats.

### Initial caucus map

This is an illustrative research map, not a fixed roster.

| Party/camp | Mini-parties worth modelling |
| --- | --- |
| **Nowa Lewica/Lewica** | SLD barons and regional apparatus; younger progressive left; Wiosna network; labour/social-state wing; government pragmatists; ex-Razem bridge; small-party allies. |
| **Razem** | parliamentary programme wing; movement/activist wing; union and workplace organisers; pro-cooperation pragmatists; anti-cabinet independents. |
| **KO** | Tusk leadership apparatus; Trzaskowski municipal/progressive current; Sikorski Atlanticist/security current; Nowacka/former iPl progressives; former Nowoczesna economic liberals; local-government barons; allied Greens outside the consolidated party. |
| **PSL** | Kosiniak-Kamysz managerial leadership; parliamentary conservatives around Zgorzelski-type politics; agrarian/local barons; policy pragmatists around Pasławska-type negotiation; younger survival strategists. |
| **Poland 2050/successors** | Hołownia personalists; Pełczyńska-Nałęcz state-capacity/programme current; Hennig-Kloska green-centre current; MPs whose first priority is electoral shelter. |
| **PiS and successors** | Kaczyński apparatus; Szydło welfare-conservatives; Morawiecki developmental/technocratic current; Czarnek culture warriors; Błaszczak security/apparatus group; former Sovereign Poland/Jaki current; presidential/Nawrocki network. |
| **Konfederacja/KKP** | Mentzen/New Hope economic libertarians; Bosak/National Movement nationalists; parliamentary normalisers; anti-system digital activists; Braun/KKP clerical-nationalist radicals; residual Korwin loyalists. |

The faction map should change. A ministry can create a new caucus; an election
loss can dissolve one; a charismatic candidate can convert followers into an
organisation only after spending time and resources.

The playable implementation keeps this map as live state rather than flavour
text. A caucus has active and coalition-membership flags, current strength,
dissent, MPs, an independent-party identity and a relationship with the parent
Left. Mergers transfer its full organisational strength to successors.
Departures transfer mandates immediately, remove its advisors and stop it
voting in internal ratification. The independent organisation then receives a
poll share, must clear its own Sejm threshold and participates in the same
460-seat allocation as the established parties. Equivalent electoral records
are used for the Poland 2050, PiS and Konfederacja successor chains.

### Persistent PiS/United Right and KO organisations

The playable rival-party layer now uses a common record array rather than
reducing every dispute to parent-party cohesion. It contains Kaczyński's
apparatus; Porozumienie; Solidarna/Suwerenna Polska; Morawiecki's developmental
camp and Rozwój+; welfare-conservative, security and culture-war PiS currents;
and PO, Nowoczesna, Inicjatywa Polska, the Greens, a possible consolidated KO
party and a possible KO splinter. Current-affinity MP estimates can overlap;
the separate `exclusive_seats` field is the only one that transfers mandates.

Porozumienie's 2021 exit therefore creates an independent six-MP organisation
and a named person ledger in which some former members remain PiS-aligned.
Suwerenna Polska's 2024 talks accumulate support and dissent before its own
decision produces a merger, federation, refusal or individual accessions.
Rozwój+ has distinct association, ultimatum, disciplinary-hearing, named-
loyalty, individual-departure, club and party stages. Forty claimed supporters
and forty-four cases are never treated as forty transferred MPs.

KO's 2025 convention negotiates leadership representation, programme, local
structures and list places, assets and debts, component dissolution and the
treatment of dissenters. Full historical consolidation, federation, partial
merger, surviving components, individual recruitment and progressive or
classical-liberal splinters all preserve the relevant records. The Greens do
not dissolve merely because the other components reach an agreement.

## The annual budget is the season finale

Every political year should end with the state budget or, before the Left
governs, with the Left's vote on the government's budget and its own shadow
settlement. The budget binds all policy promises to one finite distribution of
money and blame.

This is a political confidence test, but documentation must preserve the legal
distinction: in Poland a rejected budget is **not automatically the same thing
as losing a formal confidence vote**. The government has the exclusive right to
introduce the budget; it ordinarily submits the next year's draft at least
three months before the fiscal year. If four months pass after submission
without the budget reaching the president, the president may shorten the
Sejm's term within fourteen days. The president signs a budget within seven
days and cannot use the ordinary legislative veto, although constitutional
review remains possible.
([Constitution, Articles 221–225](https://libr.sejm.gov.pl/tek01/txt/kpol/eng/ek11.html))

Politically, however, a coalition that cannot pass its core allocation has
shown that it may no longer govern. The prime minister can request a confidence
vote; opponents can attempt a **constructive** vote of no confidence naming a
replacement; a coalition party can leave cabinet but tolerate the budget; or
the government can limp on from its submitted draft while negotiations
continue.
([Constitution, Articles 157–162](https://trybunal.gov.pl/en/about-the-tribunal/legal-basis/the-constitution-of-the-republic-of-poland))

### Annual budget calendar

| Phase | Approximate window | Conflict |
| --- | --- | --- |
| **1. Promises become bids** | January–May | Ministries and caucuses translate manifestos into costed demands. Underfunded delivery creates grievance before formal talks. |
| **2. Fiscal envelope** | June–July | Finance ministry, EU rules, defence commitments, debt service and macro forecast set the ceiling. Parties contest whether the ceiling is real or political. |
| **3. Internal-left settlement** | July–August | SLD barons, progressives, Wiosna, labour wing and Razem decide priorities, minimum wins and acceptable sacrifices. Failure here means the Left reaches coalition talks divided. |
| **4. Coalition summit** | August–September | KO, PSL, Poland 2050/successors and Left trade tax, spending, ministries, local funds and non-budget bills. |
| **5. Government draft** | By late September ordinarily | Council of Ministers must adopt one text. A minister can resign; a party can attach a protocol; a caucus can announce it was betrayed. |
| **6. Sejm committees** | October–November | MPs introduce amendments, opposition courts rebels and sectoral lobbies mobilise. The Marshal and committee chairs control time and admissibility. |
| **7. Final Sejm vote** | November–December | Support, abstention or revolt determines whether the coalition still exists in practice. |
| **8. Senate and president** | December–January | Senate amendments return; president signs quickly or refers constitutional questions. |
| **9. Execution and accounts** | Following year | Supplementary budget, frozen appropriations, procurement failure and eventual discharge show whether the bargain was real. |

The calendar may shift in an election or emergency year, but every playable
year needs a recognisable closing budget chain.

### Two coalitions must pass the budget

The Left negotiates twice:

1. **internal coalition:** formal organisations and tendencies agree what the
   Left will demand and whether its negotiator has authority to compromise;
2. **government coalition:** the Left bargains that mandate with KO, PSL and
   other partners.

This produces hard choices. A negotiator can win money by quietly dropping an
abortion timetable, preserve a social bill by accepting less housing money, or
claim a large ministry allocation that the finance minister later freezes.
Every deal has an internal ratification stage.

### Budget ledgers

The annual budget should track **allocations and political ownership**, not only
a pool of abstract points:

- health and hospital debt;
- housing and local government;
- education, teachers and religion/health curriculum implementation;
- family benefits, pensions and disability support;
- labour inspectorate and active labour policy;
- agriculture and rural transport;
- defence, refugees and Ukraine;
- energy relief, coal transition and climate adaptation;
- justice, public media and institutional reform;
- EU co-financing and KPO milestones;
- taxes by source, deficit, debt and inflation exposure.

Each line has:

- amount/ambition;
- responsible minister and party;
- caucus claiming credit;
- minimum implementation capacity;
- groups that gain and pay;
- presidential/court exposure;
- promise made in the previous budget.

### Budget crisis outcomes

| Outcome | Meaning |
| --- | --- |
| **Disciplined passage** | All party and caucus red lines were pre-negotiated. Stable but expensive; suppressed dissent may return at candidate selection. |
| **Passage with rebels** | Budget survives through abstention, opposition votes or a narrow margin. Rebel caucuses gain identity; leader authority falls. |
| **Issue exchange** | Another party supplies votes for a named policy. The bill passes, but coalition trust and opposition identity change. |
| **Protocol budget** | A coalition partner votes yes only after publishing deadlines and extra guarantees. Missing them launches a timed exit chain. |
| **Ministerial resignation** | Party stays, minister leaves, portfolio is redistributed. This creates a leadership and credit struggle. |
| **Confidence and supply** | One party exits cabinet but supports the budget. Government survives as a minority and renegotiates every major bill. |
| **Budget defeated, talks continue** | Political humiliation without automatic legal dissolution. Prime minister seeks a new vote or confidence test. |
| **Constructive replacement** | At least 231 deputies agree on a named new prime minister. Arithmetic and personnel must both be real. |
| **Four-month deadline** | President gains the option—not the obligation—to shorten the term. Presidential strategy becomes decisive. |
| **Early election** | Parties must choose lists under threshold pressure; unresolved caucuses become splinters. |

### Opposition years

Before December 2023, the budget still closes the year:

- vote against as a united democratic opposition;
- abstain after winning a Left amendment;
- support pandemic/war/emergency spending;
- strike an issue deal with PiS;
- present a funded left alternative;
- let Razem, SLD and Wiosna vote differently;
- use the vote to attempt a United Right rupture.

The cost is identity. Supporting a useful allocation can rescue the government;
blanket opposition can sacrifice beneficiaries; an uncosted shadow budget can
please activists and destroy future credibility.

## This is not Weimar

The inherited game supplies excellent event-chain structure, but several
subsystems cannot be renamed and reused.

### Replacement table

| Inherited concept | Do not map it to | Modern Polish replacement |
| --- | --- | --- |
| Reichswehr loyalty/militancy | A Polish army coup meter | civilian control, command coherence, readiness, procurement integrity, NATO interoperability and president–government coordination |
| Prussian/interior police loyalty | “Police support for the Left/right” | professionalism, legal clarity, crowd-control restraint, investigative independence, leadership politicisation, capacity and public trust |
| SA/RFB/Reichsbanner force size | Party militias | protest mobilisation, stewarding/security, digital harassment, extremist-cell risk, veterans/hooligan links and targeted political violence |
| NSDAP rise | Konfederacja automatically seizing power | divided radical-right electoral growth, agenda capture, coalition normalisation, online reach and possible institutional backsliding after entering office |
| class vote pools | fixed workers/rural/Catholic blocs | overlapping social attributes, party consideration sets, issue salience, turnout and negative partisanship |
| Great Depression | mechanically rising mass unemployment | household cost squeeze, housing, public-service failure, inflation/interest rates, sectoral layoffs, energy shocks, fiscal constraint and EU/trade exposure |
| presidential cabinets | president choosing routine governments at will | parliamentary investiture, constructive no confidence, veto cohabitation and narrow constitutionally defined presidential powers |
| civil-war endgame | normal polarisation endpoint | constitutional crisis, mass protest, institutional noncompliance and rare targeted violence; wider violence requires multiple extraordinary failures |

### Armed forces

The Constitution requires the Polish Armed Forces to remain politically neutral
and under civilian, democratic control. In peacetime, the president exercises
supreme command through the defence minister; mobilisation and wartime command
also require constitutionally specified cooperation.
([Constitution, Articles 26 and 134–136](https://trybunal.gov.pl/en/about-the-tribunal/legal-basis/the-constitution-of-the-republic-of-poland);
[Ministry of National Defence responsibilities](https://www.gov.pl/web/national-defence/tasks))

The military model should therefore track:

- operational readiness and reserve mobilisation;
- officer confidence in civilian decision-making;
- president–government command coordination;
- procurement corruption and delivery;
- NATO/US interoperability;
- territorial defence and regular-force integration;
- personnel retention and public willingness to serve;
- legality and clarity of orders during emergency.

Low confidence means leaks, resignations, slow execution and inter-institutional
conflict—not automatic partisan rebellion. Use of troops in domestic crisis
requires a lawful emergency and exhaustion of civilian resources. A coup or
army-backed government is an **exceptional failure state** requiring sustained
constitutional destruction, external war and command fracture; it is not a
routine late-game branch.

### Police and security services

Police officers may not be members of political parties; the prohibition is
intended to protect impartial service.
([Sejm/MSWiA response citing Article 63 of the Police Act](https://www.sejm.gov.pl/Sejm10.nsf/InterpelacjaTresc.xsp?key=D6NHT4&view=2))

Track:

- professional independence;
- leadership politicisation and appointment churn;
- capacity and morale;
- legal clarity of instructions;
- crowd-control training and proportionality;
- investigative credibility;
- prosecutor–police cooperation;
- minority trust and far-right infiltration risk;
- public confidence after each high-profile operation.

The relevant dangers are selective enforcement, surveillance abuse, refusal by
leaders to accept lawful supervision, excessive protest policing, leaks and
poorly prepared arrests. “Police loyalty 65%” is not credible. A Braun
detention, for example, should resolve from warrant quality, immunity, planning,
supporter mobilisation and proportionality.

### Court authority is relational

Do not model the judicial crisis with a bar that fills when PiS appointees leave
office. A court has different levels of recognised authority among:

- other judges and judicial self-government;
- the government and civil service;
- the president;
- governing and opposition parties;
- ECtHR, CJEU and EU institutions;
- lawyers, firms and ordinary court users;
- different voter groups.

The underlying record must identify institutions and appointment cohorts:
Constitutional Tribunal seats and panels; KRS members; Supreme Court chambers;
ordinary judges appointed through different KRS configurations; and prosecutors
whose chain of authority is disputed. A ruling can therefore be operative in
one administrative system, rejected by another institution and vulnerable in
European litigation.

Core state:

- `tribunal_composition_legality`;
- `tribunal_domestic_recognition`;
- `judicial_appointment_security` by cohort, not globally;
- `supreme_court_chamber_recognition`;
- `krs_independence` and `krs_democratic_accountability`;
- `prosecution_independence` and `prosecution_command_clarity`;
- `european_judgment_compliance`;
- `government_procedural_restraint`;
- `court_backlog`, vacancies and user trust;
- `president_judiciary_cooperation`.

Speed, legal certainty and accountability pull in different directions. A
blanket invalidation removes contested personnel quickly and destabilises large
numbers of judgments. Individual review protects rights and consumes years of
capacity. Waiting for terms to expire avoids a purge and leaves an impaired
Tribunal in place. A negotiated transition may be durable and politically
intolerable to the coalition that promised a settlement.

The public usually encounters this system through delayed divorces, commercial
cases, labour disputes, election certification or a flagship law—not through
constitutional doctrine. If repair makes daily justice slower without an
honest capacity plan, “rule of law” becomes an elite brand and the right gains a
credible service-delivery attack.

### Border institutions and the military overlap, but do not merge

At the Belarusian border, track the Border Guard, Armed Forces, police,
prosecutors, local government and humanitarian organisations as separate
actors. They have different legal mandates and public reputations. A soldier's
death can raise confidence in service and demand for force while a badly
handled investigation lowers confidence in commanders or prosecutors.

Required state:

- border crossing pressure and degree of Belarusian organisation;
- detection, processing, reception and court-review capacity;
- unit readiness, fatigue, equipment and command clarity;
- officer protection and accountability;
- public confidence in each uniformed service;
- press, lawyer, medical and humanitarian access;
- lawfulness and documentation of pushbacks/use of force;
- asylum-access support, security concern and refugee empathy by voter segment;
- local housing, school and health capacity;
- disinformation penetration.

An effective policy can reduce crossings and still increase long-term racism.
A rights-compliant policy can fail if it leaves exhausted officers with
unusable instructions. The most capable outcome is not “open” or “closed”: it
combines a controlled frontier, rapid registration/security screening,
humanitarian rescue, reviewable decisions, officer protection and enough local
capacity that every arrival is not framed as competition for a scarce flat or
doctor.

### Racism is behaviour and institutional harm, not flavour text

Track prejudice by target and behaviour rather than using one public “racism”
number:

- social distance and negative stereotypes;
- acceptance of dehumanising elite rhetoric;
- discriminatory treatment in work, housing, schools and services;
- harassment and threat volume;
- organised extremist mobilisation;
- reported and estimated unreported hate crime;
- victim confidence in police and prosecutors;
- cross-group solidarity and anti-racist mobilisation.

Attitudes towards Ukrainians, Muslims, Black Poles, Roma, Jews and people
crossing the Belarusian border can move differently. A voter may support
Ukraine's defence, oppose refugee benefits and reject street violence; another
may adopt a common conspiracy frame across every minority. Parties change
social permission: when mainstream leaders repeat a radical-right frame, they
can gain a short security bonus while lowering the threshold for harassment.

Hate has material consequences—victims withdraw from public life, candidates
become harder to recruit, workers leave towns, children miss school, police
information worsens and foreign relations suffer. Effective policy combines
credible border/service administration, equal-law enforcement, victim support
and trusted local messengers. A moral speech without delivery should not erase
those effects.

### Protest movements are allies with their own mandate

Women's marches, the Women's Strike, unions, LGBT+ campaigns, tenants and other
movements are organisations rather than temporary party modifiers. Each needs:

- active organisers and geographical reach;
- volunteer energy and exhaustion;
- legal, medical, communications and security capacity;
- tactical repertoire, from service provision to strike and disruption;
- public breadth and radical flank;
- trust in each caucus and party;
- autonomy from party leadership;
- repression memory and current legal exposure;
- ability to recruit candidates without becoming a party department.

Parties can offer money, lawyers, rooms, amplification, legislation and physical
protection. In return they may receive trusted messengers, organisers and a
candidate pipeline—but never automatic obedience. An attempted takeover raises
short-term mobilisation control and destroys the independent credibility that
made the movement valuable.

The Black Monday outcome illustrates the distinction: a mobilisation can
defeat a proposal. The 2020–2021 protests illustrate a different outcome:
massive capacity, cultural change and recruitment can coexist with immediate
legal defeat. Model street victory, policy victory, organisational survival and
electoral conversion separately.

### The radical right is an ecosystem, not the NSDAP

Konfederacja and KKP can become extremely dangerous without reproducing an
interwar totalitarian party. Their main routes to influence are:

- winning elections and setting the campaign agenda;
- normalisation as a PiS or centre-right coalition partner;
- dividing mainstream parties on migration, Ukraine, LGBT+ rights and the EU;
- building digital personalities and alternative media;
- exploiting distrust created by COVID, inflation and state scandals;
- street protest and harassment;
- placing personnel in ministries, public media, education, prosecutors or
  state firms after entering government;
- attacking checks and balances through ordinary legislation and appointments.

Konfederacja itself is a federation. Mentzen's New Hope, Bosak's National
Movement and Braun's KKP did not have identical economics, foreign policy,
religious politics or coalition aims; Braun's current separated around the 2025
presidential election. The simulation should let the camps compete,
normalise, split and reunite.

Replace a single “NSDAP support” track with:

- Konfederacja electoral consideration;
- KKP electoral consideration;
- right-wing agenda dominance;
- anti-system trust;
- coalition acceptability;
- extremist organisation and violence risk;
- democratic-norm commitment;
- online reach and scandal resilience.

The dangerous outcome is often that other parties adopt the radical right's
issues while it remains outside cabinet.

## Voters are segmented, intentional and capable of abstaining

Age, gender, education, occupation and place should shape party choice without
becoming separate populations that add up more than once. Research on the 2023
exit poll examines their independent effects, while later presidential exit
polling shows large but incomplete transfers from Mentzen and Braun to Nawrocki
and from Hołownia, Biejat and Zandberg to Trzaskowski.
([SWPS study of the 2023 Ipsos exit poll](https://share.swps.edu.pl/handle/swps/2225);
[PAP on 2025 runoff transfers](https://www.pap.pl/aktualnosci/wybory-2025-na-kogo-glosowali-wyborcy-przegranych-w-i-turze))

### Voter record

A simulated voter cohort or segment has:

- economic position: employee/self-employed/farmer/pensioner/student,
  income security, union status and public/private sector;
- place: metropolitan core/suburb, large town, small town, rural region and
  east/west/north/south context;
- age/life stage: student, young renter, parent, mortgage holder, mid-career,
  pensioner;
- education and media environment;
- gender and household/care responsibilities;
- religiosity and Church attachment, not just nominal Catholic identity;
- issue priorities and threat perceptions;
- party consideration set;
- positive attachment and negative partisanship;
- credibility judgments by issue;
- turnout propensity;
- first choice, acceptable transfer choices and parties never considered.

Do not calculate support by saying “30% of workers belong to party X.” Calculate
whether a segment considers a party, believes it on the currently salient
issue, rejects its coalition partners, and turns out.

### Intentions move in stages

1. **Awareness:** does the voter hear a party?
2. **Consideration:** would they ever vote for it?
3. **Preference:** is it currently first choice?
4. **Certainty:** how easily can campaign events change that?
5. **Turnout:** will they vote in this election type?
6. **Transfer:** whom will they support in a runoff?

This makes non-voting a major opponent. A disappointed progressive need not
become conservative; they can stay home. A Konfederacja-curious young voter can
also consider Razem on housing and anti-establishment credibility. A rural
woman can prefer PSL on local representation and the Left on abortion. The
player wins by changing issue ownership and credibility, not by moving a class
slider.

### Playable voter-bloc approximation

The implemented layer uses eight mutually exclusive, Poland-wide blocs:
metropolitan liberals, liberal professionals, public-service families,
industrial and logistics voters, provincial welfare voters, rural localists,
older welfare households and anti-establishment youth. Their authored sizes
sum to 100.

Every active party has a baseline score and a mutable affinity inside every
bloc. Bloc turnout, economic and cultural fit, organisation, issue credibility,
national conditions and decaying momentum determine support. These eight
shares are the only voter-group result shown to the player. Older worker,
public-sector, age, gender and place meters survive only as save-compatible
inputs for authored events; the poll translates their changes into these eight
blocs instead of presenting a second “support group” bouquet.

The model publishes:

- underlying vote intention by party;
- a modest seeded sample as the visible headline poll;
- an approximate margin of error;
- actual current Sejm mandates, which remain fixed;
- a separate national d'Hondt seat indicator using list thresholds.

That last output is for coalition planning, not a claim to reproduce 41
districts. A full election layer still needs district magnitude, local
candidates, registered committee versus coalition thresholds and tactical
voting for the Sejm. The Senate is modeled separately: the 2023 campaign can
coordinate one democratic candidate per district or run competing slates, and
the election awards each of 100 single-member seats to its district plurality.

### Playable rival-party layer

PiS, KO, PSL, Konfederacja and Poland 2050 each have their own organisational
pool, annual income and monthly action policy. Poland 2050 activates after
Hołownia's presidential campaign. Rival actions buy organisation, target
blocs, attack competitors or improve coalition channels.

The parties move on hidden economic, cultural and overall left–right
coordinates. A second hidden value is the **party-system pendulum**: the
relative agenda pull of a credible Left and an insurgent Konfederacja. It uses
underlying vote intention rather than the noisy published poll. Labour
credibility and a Left lead pull it left; Konfederacja support, radical-right
agenda ownership and COVID anti-system mobilisation pull it right. The
pendulum has inertia, so one poll or one viral clip cannot make every party
teleport across the spectrum.

The annual Independence Day choice also leaves memory. Radical-right street
capacity adds to Konfederacja's agenda pull, while a sustained civic-patriotic
counter-tradition subtracts from it. Counter-mobilisation, legal monitoring,
prohibition, neglect and civic commemoration produce different shifts among
Braunists, market radicals and nationalists. The ledger describes who holds
the street advantage without exposing either raw score.

This creates competitive adaptation in both directions. A strong Left makes
social spending, public services and rights harder for the democratic parties
to ignore. If Konfederacja overtakes it—especially after lockdown and
anti-vaccine mobilisation—the democratic camp becomes more receptive to
market, order and culturally cautious arguments. PiS must decide whether to
defend its welfare ownership or imitate the economic Darwinism on its flank.
The result is bounded repositioning, not a scripted national march in one
direction.

### The historical Lewica pressure track

The 2019 return is a threshold-clearing alliance success, not a permanent
12-percent floor. The model uses the historical results as hostile benchmarks:
12.56 percent in 2019, Robert Biedroń's 2.22 percent in 2020, 8.61 percent in
2023, and the separate 4.23 and 4.86 percent results of Magdalena Biejat and
Adrian Zandberg in 2025. They calibrate pressure; they do not script a collapse.

Seven live qualities carry that pressure: `electoral_viability`,
`winner_reputation`, `issue_ownership`, `leadership_authority`,
`coalition_blur`, `media_access` and `list_confidence`. Coalition blur is the
only adverse-direction quality. The others improve through organisation,
delivery, leadership legitimacy, media investment and credible policy
differentiation.

One-off and continuing pressures cover the weak pandemic presidential
campaign, KO's candidate reset and Hołownia's insurgency; the recovery-fund
bargain's split between policy delivery and rescuing PiS; merger conflict and
Czarzasty's methods; Tusk's centralisation of the anti-PiS electorate; war and
inflation; common-list pressure; junior-coalition responsibility without full
credit; failed abortion reform; weak media infrastructure; the Razem rupture;
and repeated losing results. Low viability produces three explicit exits from
Lewica consideration: tactical movement to KO, some movement to Poland 2050,
and abstention. It does not make those voters culturally conservative.

The same weakness does make rival parties more willing to adopt right-wing
frames because progressive issue ownership and media access have fallen. A
player can resist the historical track by building local organisation,
credible media access, delivered material policy and a differentiated common
list; no date or benchmark applies an unavoidable polling result.

Every rival party is also an internal coalition:

| Party | Hidden playable balance |
| --- | --- |
| **PiS** | A social-solidarist machine competes with market hardliners. The first answers the Left with transfers and state capacity; the second answers Konfederacja with fiscal discipline, deregulation and sharper competition. |
| **KO** | Social liberals compete with classical liberals. The balance changes whether KO contests equality and public-service voters or creates economic and cultural distance from the Left. |
| **PSL** | Agrarian pragmatists, conservative deputies and coalition managers value different combinations of local delivery, a right-wing outside option and keeping a governing bargain alive. A friendly relationship therefore does not remove PSL's threat to leave. |
| **Konfederacja** | Braunists, Mentzenite/Korwinist market radicals and nationalists divide the federation. COVID grievance strengthens its anti-system and market channels; border, order and Independence March politics can strengthen the nationalists; provocation can put the Braunists in command. |
| **Poland 2050** | State-capacity reformers, a Christian-democratic current and Hołownia personalists compete over institutional reform, cultural caution and electoral shelter. |

The balances do not merely alter flavour text. They weight each party's
background actions and produce separate acceptance of five kinds of offer:
social policy, rights, order and security, market policy, and coalition
cooperation. These values are hidden response hooks for proposal and vote
scenes. They allow a social amendment to attract PiS without making it
receptive to abortion reform, or a courts package to attract KO without
settling a dispute with its classical liberals over taxation. Existing event
scenes with hard-coded party votes must opt into those hooks; calculating an
acceptance score does not silently rewrite an authored result.

A hidden pairwise relation matrix records rival cooperation and attacks.
Relations also drift passively by small amounts as ideological distance,
coalition openness and internal dominance change. Explicit bargains, betrayals
and attacks remain much larger shocks, so passive convergence cannot erase
political memory in a few months. Polling converts the matrix, ideological
distance and the player's own relations into visible compatibility scores for
four coalition families.

The underlying coordinates, caucus shares, acceptance scores and pairwise
relations are deliberately not printed. The ledger reports the national
climate, each party's dominant current and qualitative direction of drift,
alongside its public action and coalition compatibility. This gives the player
evidence about change without exposing the arithmetic needed to optimise every
vote.

The 2020 presidential layer uses the same party, trust, organisation and
turnout state. June stores separate opening-poll, tracking-poll and
election-day shocks before two campaign moves; raw results select the two
finalists. July stores new polling and result slack, permits exactly two support
trades and calculates partial transfers, abstention and new turnout. Saving or
reopening a result screen does not reroll those shocks.

Both presidential counts now publish the same performance ladder: below 2.5%
is a shattering disaster; 2.5–4% a severe defeat; 4–5.5% disappointing or
ambiguous; 5.5–7.5% a broadly satisfying defence of the base; 7.5–10% strong;
10% or more a breakthrough; and reaching the runoff or winning a party-system
transformation. The verdict is shown against the final campaign expectation
and the historical result. It creates an electorate feedback record rather
than a flat poll penalty: the following monthly poll separately recalculates
Left consideration and participation, then reduces that effect over six to
twelve months. A later failure can lengthen and intensify a still-active
negative cycle.

The 2025 count has two ledgers. One judges the player-backed candidate and one
judges the complete Left field against Biejat and Zandberg's historical 9.09%.
Biejat finishing behind Zandberg is therefore a New Left leadership defeat
even when their combined field is strong. A common nomination is modelled as
a newly assembled electorate: an open primary can confer legitimacy, while a
late leadership withdrawal can demobilise voters. It never receives the two
historical candidacies' arithmetic sum automatically.

### Issue salience

Each election should temporarily weight:

- household prices and wages;
- housing;
- health and public services;
- abortion/equality/church;
- migration/security;
- Ukraine/war;
- corruption/rule of law;
- rural/farm policy;
- climate/energy;
- party leadership and desire for alternation.

Events alter salience and credibility separately. A flood raises climate and
competence salience; it helps the Left only if the Left has invested in
adaptation and responds well.

## A modern Polish economy, not a Depression script

The economy should be difficult through distribution and fiscal trade-offs, not
an automatic unemployment collapse. As of the 2026 forecast, Poland combines
strong growth and unemployment around 3% with elevated inflation risk, a large
deficit, growing debt, high defence spending and heavy dependence on EU-funded
investment. It is deeply integrated into the EU single market and manufacturing
value chains.
([European Commission forecast](https://economy-finance.ec.europa.eu/economic-surveillance-eu-member-states/country-pages-including-country-reports/poland/economic-forecast-poland_en);
[European Commission country report](https://economy-finance.ec.europa.eu/economic-surveillance-eu-member-states/country-pages-including-country-reports/country-report-poland_en?prefLang=pl))

### Core economic state

- real wage and disposable-income growth by broad household type;
- food, energy and housing costs;
- rents, mortgage rates, construction and public-housing stock;
- employment quality, vacancies, migration and demographic labour shortage;
- public-service capacity and waiting time;
- union coverage and bargaining power;
- small-firm liquidity and investment;
- farm income and input costs;
- industrial orders/export demand, especially Germany/EU exposure;
- energy mix, import dependence and transition investment;
- inflation and National Bank credibility;
- fiscal balance, debt service and EU excessive-deficit pressure;
- defence commitments and domestic procurement share;
- KPO/cohesion absorption and milestone compliance.

### Economic causality

Policies must have implementation lags and distribution:

- a minimum-wage rise helps low earners, pressures some firms, raises tax
  receipts and is not identical to inflation;
- public housing takes years unless land, local government and construction
  capacity were prepared;
- defence spending can create Polish industrial jobs or mostly finance imports;
- energy caps protect households now but create fiscal costs and postpone
  investment signals;
- farm import controls protect some producers while raising prices or damaging
  Ukraine/EU relations;
- fiscal consolidation can use taxes, lower investment, restrained public wages
  or benefit cuts, with different caucus and voter effects.

The finance ministry forecast is uncertain rather than secretly correct. Give
the player ranges, expert disagreement and later audits.

## Difficulty: hostile structure, fair causality

The intended campaign should feel almost unfair because the Left's structural
position is genuinely bad:

- it begins as an alliance assembled to cross the threshold;
- SLD controls machinery but lacks renewal;
- Wiosna and Razem supply distinct credibility they can withdraw;
- Biedroń's 2020 result can destroy momentum;
- Tusk's return squeezes smaller opposition parties;
- cooperation with PiS can deliver policy and poison opposition trust;
- government is available only as KO's smallest partner;
- PSL can veto social reform;
- Razem can credibly remain outside;
- president, courts and media create separate veto points;
- Konfederacja and KKP grow by exploiting crises;
- every election type rewards different coalitions;
- annual budgets force incompatible promises into one settlement.

### Hard does not mean random punishment

The player should usually understand **why** a loss occurred:

- a faction had organisation and an outside option;
- a promise was omitted from two budgets;
- a partner's polling made an exit credible;
- the player lacked votes for a veto override;
- a law was rushed with poor procedure;
- a crisis exposed neglected capacity;
- an electorate stayed home after repeated retreats.

Hidden information is appropriate for private intentions, but the game must
show observable warning signs: association building, rebel meetings, hostile
speeches, leaked amendments, whip failures and polling shifts.

### Scarcity rules

- Only a few major priorities can receive money and leadership attention each
  year.
- Concessions settle the current vote but create expectations in the next
  budget.
- Offices increase delivery capacity and government burden.
- Public confrontation improves distinction and reduces coalition trust.
- Quiet negotiation protects trust and can demobilise supporters.
- A common list saves threshold risk and sacrifices candidate autonomy.
- A separate list preserves identity and may erase the party from parliament.
- Investigations consume institutional capacity and can fail if rushed.

### Recovery must be possible

A skilled player can build compounding assets:

- transparent internal rules reduce the damage of losing a faction vote;
- local organisation converts protest waves into lasting support;
- honest costings improve budget credibility;
- union and movement relationships supply mobilisation without party capture;
- rural material policy reduces dependence on culture-war concessions to PSL;
- competent ministries create visible delivery;
- legal preparation lets accountability survive court scrutiny;
- respectful Razem autonomy makes later reunification possible;
- good crisis communication prevents far-right monopoly on distrust;
- candidate primaries distribute prestige more safely than appointments.

## Victory ladder

Winning should not require producing a frictionless single party. The ideal
outcome is a durable democratic left ecosystem able to cooperate without
compulsory absorption.

| Tier | End-state |
| --- | --- |
| **Survival** | At least one credible left list clears the threshold; the broader camp retains organisation and does not collapse into KO. |
| **Relevance** | The united or coordinated Left holds 10%+, wins visible labour/public-service policy and remains necessary to government formation. |
| **Breakthrough** | Left organisations coordinate lists and budgets, reach roughly mid-teens support, gain strong local roots and set coalition policy rather than only filling offices. |
| **Major victory** | The Left leads or co-leads government, can pass a funded social programme, survives a hostile president/PSL bargaining and contains the radical right without adopting its programme. |
| **Transformative victory** | A democratic, plural left coalition becomes a major pole; a Left or allied president removes the veto blockade; labour, housing, care, reproductive and equality reforms are institutionally durable; losing factions remain inside constitutional politics. |

The transformative path should be rare. It requires excellent internal
ratification, several successful budgets, organisation outside Warsaw, a rural
offer, credible defence/Ukraine policy, movement trust and good candidate
selection. It should never require silencing every faction.

## A possible golden path

This is not the only winning route, but it demonstrates that the hard scenario
can be beaten causally:

1. create fair 2019 list rules and preserve Razem autonomy;
2. use COVID to establish worker, tenant and public-health credibility while
   opposing electoral abuse;
3. respond to Biedroń's weak result with renewal rather than a purge;
4. make the 2021 recovery-fund bargain transparent and enforceable;
5. merge SLD/Wiosna without letting barons monopolise structures;
6. build a material rural programme before the grain/farmer crises;
7. enter 2023 coalition talks with a costed health–housing–labour package and a
   ratification rule Razem can accept;
8. let Razem retain an outside-support role without treating it as betrayal;
9. win annual budgets through delivery milestones, not only ministries;
10. use labour achievements and progressive administrative workarounds while
    openly documenting PSL/presidential vetoes;
11. choose a 2025 candidate through a legitimate joint process;
12. turn presidential performance into a 2027 unity agreement rather than a
    leadership annexation;
13. exploit right-wing and centrist splits without becoming dependent on their
    most anti-democratic factions.

The player will still lose some bills, offices and elections. Major victory
comes from making each loss strengthen organisation or clarify responsibility
instead of triggering another left split.

## Implementation questions for later

- Should caucuses be individual records, qualities generated from a data table,
  or small scene-backed objects?
- Should the eight implemented voter blocs split by region, or should regional
  variation wait for the district-election layer?
- Which variables are visible, estimated or hidden?
- Does every budget line use currency, ambition levels or both?
- How are ministerial implementation capacity and party credit separated?
- What exact constitutional events fire on budget delay versus political
  defeat?
- How can list allocation represent districts and local organisations without
  simulating all 41 Sejm constituencies?
- Which victory tiers apply at each possible start date?
- How should a shorter early campaign beginning before COVID differ from a 2023
  government start?

These questions should be answered before the playable model expands beyond
its present national approximation.
