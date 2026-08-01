# DSS Poland scenario ledger

Last researched: **29 July 2026**.

Status: **research and design ideas only**. Nothing in this document is an
implemented event, a settled canon or a forecast. Historical events are marked
as anchors; every alternative branch is counterfactual.

The factual chronology is in
[POLITICAL_TIMELINE.md](POLITICAL_TIMELINE.md). This ledger turns that research
into plausible political chains for a game centred on SLD/Nowa Lewica and the
broader Polish left.

The proposed party-caucus, voter, economy, military/police and annual-budget
systems are in [POLITICAL_MODEL.md](POLITICAL_MODEL.md).
The separate [media model](MEDIA_MODEL.md) covers reach, trust, public-media
governance, Republika, creator-led politics and the long-term cost of building
a Left communications ecosystem.

## What to borrow from the inherited mod

The strongest alternate events in the existing project do not behave like
isolated coin flips:

- `dnvp_split` makes a leadership ruling the **pretext**, not the cause, of a
  rupture. Factional organisation already exists; the fight determines who
  keeps the party bureaucracy, local branches and voters.
- `bruning_second_cabinet_dynamic` lets accumulated pressure force a cabinet
  renegotiation. Continuing toleration, extracting concessions and causing an
  early election are all possible, but dissent follows each choice.
- `goerdeler_cabinet_2_alt` recognises that a coalition can be arithmetically
  possible and still fail because its leaders cannot agree on guarantees,
  personnel or policy.
- `death_of_hindenburg_president` builds a presidential field out of prior
  party transformations, candidate eligibility, endorsements and relations.
- `deport_hitler` makes legal action depend on investigation, control of police
  and courts, and the target movement's strength. Enforcement can succeed,
  fail, produce a martyr or provoke organised resistance.
- `civil_war` resolves an extreme crisis through assets accumulated earlier:
  relations with labour and rivals, militancy, police, military and foreign
  support.
- `shuffle_leadership` treats personnel changes as factional redistribution,
  not cosmetic flavour.

The Poland adaptation should follow the same principles:

1. **A rupture needs prior organisation.** Bad relations alone should not
   create forty deputies, local offices or a new ballot structure overnight.
2. **Institutions are assets.** The Marshal can schedule proceedings; the
   president can veto; a minister can issue guidance; courts and prosecutors
   can confer or destroy legitimacy.
3. **Coalition arithmetic is necessary but insufficient.** Personal hostility,
   programme guarantees, ministerial portfolios and fear of the threshold can
   prevent an otherwise possible cabinet.
4. **Public choices create private follow-ups.** A compromise can preserve the
   cabinet while generating a leadership challenge three months later.
5. **Legal action is a chain.** Evidence, immunity, summons, detention, charge,
   trial, appeal and sentence are separate stages.
6. **Extreme outcomes must be earned.** A formal Left–PiS cabinet, the
   destruction of KO or violent unrest should require several failed safeguards,
   not one dramatic option.

The files above are examples to consult when scenes are eventually written;
this document does not change them.

## Plausibility labels

| Label | Meaning |
| --- | --- |
| **H — historical** | It happened before the research cutoff. It can still have alternate causes, player responses or consequences. |
| **N — near counterfactual** | A live choice, narrow result, announced threat or documented institutional possibility existed. |
| **P — plausible divergence** | It did not nearly happen on that date, but named actors, institutions and incentives support it. |
| **E — exceptional** | Constitutionally or arithmetically possible only after several earlier divergences; use as a late chain, not routine content. |

The label measures the initial fork, not how successful a resulting government
or party would be.

## State needed before events are scripted

### The left

- `left_unity`: willingness of Nowa Lewica, Razem, PPS, Unia Pracy and
  independents to cooperate.
- `old_guard_strength`: organisational control, local structures and loyalty to
  Czarzasty/SLD networks.
- `new_left_strength`: younger Nowa Lewica officeholders and activists seeking
  generational renewal.
- `spring_strength`: Biedroń/Wiosna-derived, strongly social-progressive
  politicians and networks.
- `razem_strength`: activists, parliamentary autonomy, polling and credibility
  on public services and labour.
- `labour_credibility`: union relations, strike support and delivery of
  workplace reform.
- `progressive_credibility`: abortion, LGBT+, secularism and representation.
- `government_delivery`: visible policies delivered versus responsibility for
  coalition failures.

These are not a single ideological scale. The old guard can support generous
social spending while remaining cautious on church and LGBT+ policy; Razem can
be socially progressive but prioritise class and public services; Wiosna
networks can be highly progressive but more willing to compromise economically
inside a KO-led cabinet.

### Coalition and institutions

- separate trust values with **KO, PSL, Poland 2050, Unia Centrum, Razem, PiS,
  Morawiecki's camp, Konfederacja and KKP**;
- cabinet majority, bill-by-bill majority and veto-override majority;
- PSL exit readiness and PSL belief that a right-wing alternative is available;
- coalition-agreement compliance and number of unresolved breaches;
- presidential relations, Marshal relations and court/prosecutor legitimacy;
- media pluralism, civil-service capacity and public confidence in elections;
- party money, local structures, membership and candidate supply;
- rural anger, union mobilisation, feminist mobilisation, LGBT+ mobilisation,
  church mobilisation and anti-system mobilisation.

### External pressure

- war risk, support for Ukraine and refugee fatigue;
- trust in the United States, EU and Germany;
- EU-funds compliance and rule-of-law credibility;
- inflation, unemployment, housing cost and health-service capacity;
- energy security, coal-region anxiety, farm income and climate damage;
- disinformation penetration and confidence in crisis communications.

### Presidency and courts

- presidential relationship **by issue family**, plus consultation, legacy
  ambition, Palace authorship demand and sponsoring-party distance;
- Tribunal composition, domestic recognition and status of contested seats;
- KRS appointment path and judicial security by cohort;
- Supreme Court chamber recognition, prosecutor command clarity and court
  backlog;
- compliance with ECtHR/CJEU judgments and government procedural restraint;
- judiciary–government, judiciary–president and ordinary court-user trust.

### Border, prejudice and movements

- crossing pressure, hostile-state involvement and border-processing capacity;
- readiness, morale, legal clarity and public confidence separately for Armed
  Forces, Border Guard and police;
- support for asylum access, use of force and refugee reception by voter group;
- local service capacity, refugee empathy and disinformation penetration;
- prejudice, discrimination, harassment, hate crime, victim reporting trust
  and extremist organisation by targeted group;
- feminist/other movement organisers, geographical reach, expertise, autonomy,
  exhaustion, repression memory and trust in each left caucus.

### Media

- reach and trust by voter segment;
- attention power, political access and relationship by programme/outlet;
- newsroom talent, format capacity, finances and distribution resilience;
- legal exposure, editorial independence and public-media appointment security;
- Left party communications capacity, independent-ecosystem depth and
  movement/creator autonomy.

These fields are specified in the
[political model](POLITICAL_MODEL.md#court-authority-is-relational) and
[media model](MEDIA_MODEL.md#reach-is-not-support). Event scenes should mutate
only the dimensions their choice plausibly affects.

## The recurring annual budget chain

Every playable year ends with a budget vote. This is mandatory campaign
structure, not a random event. The detailed calendar and constitutional
guardrails are in [POLITICAL_MODEL.md](POLITICAL_MODEL.md#the-annual-budget-is-the-season-finale).

The vote tests two coalitions. First, the mini-parties inside the Left must
ratify priorities and acceptable concessions. Second, the governing coalition
must find 231 votes for one allocation. In opposition years, the same chain
tests whether the Left votes together, supports emergency spending or trades
votes with PiS.

| ID | Label | Principal year-end conflict | Plausible ruptures and rewards |
| --- | --- | --- | --- |
| **BUD-2019 — Return to parliament** | **H/P** | The new 49-member left delegation votes on a PiS budget while SLD, Wiosna and Razem write their first common fiscal alternative. | Common shadow budget establishes unity; separate amendments expose that the electoral alliance has no shared governing programme. |
| **BUD-2020 — Pandemic settlement** | **H/P** | Hospitals, wage support, small firms, local government and election costs compete amid emergency rules. | Supporting relief can rescue PiS; rejecting it can abandon beneficiaries. A Left amendment package can split Gowin/Solidarna Polska or split the Left over civil liberties and spending. |
| **BUD-2021 — Minority government and Polish Deal** | **H/P** | After Gowin leaves, PiS needs discipline or outside votes while the new tax system, border security, health and EU recovery money collide. | A second Left–PiS issue bargain may deliver policy and rupture opposition trust; refusal can deepen the government crisis. Merger rebels can withhold votes. |
| **BUD-2022 — War, energy and refugees** | **H/P** | Defence, Ukrainian refugees, energy shields and inflation relief crowd out housing, health and wages. | National-security consensus can hide distributional conflict. Razem/Nowa Lewica unity depends on funding solidarity without normalising austerity or anti-refugee politics. |
| **BUD-2023 — The transfer of power** | **H/N** | The outgoing PiS draft meets a new KO–Third Way–Left majority. Teacher pay, public media, IVF, local government and inherited deficit become the first coalition allocation. | Amend the inherited budget rapidly, write a new settlement or use an interim compromise. Razem can support investiture but reject fiscal assumptions; ministries can exist without funded promises. |
| **BUD-2024 — First full coalition test** | **H/P** | The government must reconcile defence, EU/KPO investment, flood reconstruction, rural concessions, health, housing and Left social promises after PSL defeats the abortion bill. | PSL converts its social-policy veto into rural/budget leverage; the Left can retaliate, publish a delivery protocol or trade policy for money. Razem's departure becomes more or less likely according to the settlement. |
| **BUD-2025 — After presidential defeat** | **H/P** | A hostile incoming president, weak Third Way parties, Marshal rotation, shorter-time pilot, school reform and high defence costs force a coalition reset. | Hołownia/PSL can condition support on offices; the Left can make Czarzasty's rotation and labour implementation budget terms. Nawrocki cannot use an ordinary budget veto, but can exploit delay and constitutional review. |
| **BUD-2026 — Pre-election survival** | **P** | Growing debt/deficit pressure, EU milestones, military spending, PIP enforcement, partnership veto and fragmented centre/right make the 2027 budget the last full governing offer before the election. | KO may demand restraint, PSL rural protection, Left funded delivery and centrist remnants electoral shelter. A protocol budget can hold until 2027; defeat can launch a constructive no-confidence attempt or early-election deadline. |

Each budget has four later checks:

1. Was the appropriation actually released?
2. Did the responsible ministry have capacity to spend it?
3. Which party and caucus received credit?
4. Did a concession quietly violate a non-budget promise?

Passing the vote suppresses immediate crisis; it does not erase the grievance.

## PSL and Third Way: the permanent coalition-management game

PSL should be neither an always-loyal centrist accessory nor a randomly
treacherous party. Its leverage comes from four rational sources:

1. **Arithmetic.** The October 15 coalition has no Sejm majority without PSL.
2. **Identity.** It must show conservative and rural voters that KO and the Left
   have not absorbed it.
3. **Survival.** A party near the electoral threshold has reason to make every
   dispute visible, seek a safer list or consider another bloc.
4. **Alternatives.** PiS and parts of Konfederacja compete for the same voters;
   even an unattractive negotiation can strengthen PSL's hand inside the
   existing government.

This already has factual anchors. In July 2024, **24 PSL deputies** helped
defeat the Left's abortion-decriminalisation bill. PSL leaders stressed that
the coalition had no majority without them and that “PSL is not and will not be
anyone's vassal.” At the same time, PSL remained in government and later
negotiated a partnership compromise with the Left. A threat therefore need not
mean an exit.
([PAP on the abortion vote](https://www.pap.pl/aktualnosci/wladyslaw-kosiniak-kamysz-znow-zaglosuje-przeciw-projektowi-lewicy-ws-aborcji);
[PAP on PSL's autonomy](https://www.pap.pl/aktualnosci/zgorzelski-w-umowie-koalicyjnej-nie-bylo-projektow-zwiazanych-z-aborcja);
[PAP on coalition stability](https://www.pap.pl/aktualnosci/kosiniak-kamysz-psl-jest-stabilne-sprawdzone-i-wiarygodne))

### The threat ladder

| Level | PSL action | What makes it credible | Possible resolution |
| --- | --- | --- | --- |
| **0. Private warning** | Kosiniak-Kamysz asks a coalition council to remove or narrow a proposal. | Good relations and a dispute PSL does not need to publicise. | Sequencing concession, conscience vote or rural spending. |
| **1. Public distinction** | “Not in the coalition agreement”; PSL deputies announce dissent. | Identity pressure or weak polling. | Free vote, referendum promise or symbolic dissent. |
| **2. Legislative veto** | PSL defeats or delays a government bill without leaving cabinet. | The opposition supplies the votes against it. | Revised bill, administrative workaround or reciprocal veto by the Left. |
| **3. Portfolio ultimatum** | A minister, deputy premiership, Marshal office or policy package becomes the price of continued support. | Reshuffle, scandal or presidential defeat. | Cabinet redistribution with delayed resentment. |
| **4. Confidence threat** | PSL links a demand to the budget, confidence vote or constructive no confidence. | A plausible alternative premier and 231 votes are being assembled. | Coalition reset, minority government or cabinet fall. |
| **5. Exit from cabinet** | Ministers resign but the club may still tolerate the government. | PSL needs distance but fears an election. | Confidence-and-supply, technical ministers or a countdown to election. |
| **6. New majority or election** | PSL backs a different premier or votes to dissolve the Sejm. | Right-wing guarantees, safe list places and protection from being swallowed. | Centre-right cabinet, caretaker government or early election. |

The AI should bluff sometimes, but not arbitrarily. A threat is more likely to
be genuine when PSL polling is above the threshold, PiS/Konfederacja relations
are usable, a conservative issue is salient, a safe electoral agreement exists,
and PSL has already received concessions without reputational recovery. It is
more likely to be leverage when PSL is below the threshold, its ministers
control valued patronage, or a right-wing partner would absorb its electorate.

### PSL/Third Way chains

| ID | Label | Trigger and branches | Delayed consequences |
| --- | --- | --- | --- |
| **PSL-01 — The reluctant kingmaker** | **N** | After any hung parliament, PSL can demand defence/agriculture, a deputy premiership, a conservative social-policy protocol and local-government funds. KO/Left can accept, seek Poland 2050 instead, or attempt a minority cabinet. | Accepting stabilises arithmetic but creates veto points; refusing may send PSL to PiS or an election. |
| **PSL-02 — Not in the agreement** | **H/N** | An abortion, marriage, religious-schooling or trans bill is declared outside the coalition contract. Offer a conscience vote, referendum, narrower bill, or make cabinet membership conditional on support. | Repeated surrender damages progressive credibility; repeated coercion raises PSL exit readiness. |
| **PSL-03 — The rural blockade** | **H/N** | Grain imports, Green Deal rules, Mercosur, animal welfare or farm prices generate protests. Back controls and compensation; split small farmers from agribusiness; defend the EU bargain; or let PSL own the response. | Can restore PSL rural primacy, create an AgroUnia-style competitor, weaken Ukraine solidarity or radicalise protests toward Konfederacja. |
| **PSL-04 — Conservative values package** | **P** | PSL offers stability in exchange for freezing abortion liberalisation, protecting religion classes and ruling out marriage equality. | The old guard may accept; Wiosna/Razem may revolt; KO progressives can defect on individual bills. |
| **PSL-05 — Referendum government** | **N** | PSL proposes referendum(s) on abortion or partnership law as an escape from coalition deadlock. | A referendum can settle nothing if turnout fails; the campaign may split every party and empower the Church. |
| **PSL-06 — The budget hostage** | **P** | Rural compensation, local-government finance or defence procurement is attached to the budget vote. | Concession invites repeated threats; refusal can produce a minority cabinet without immediately causing an election. |
| **PSL-07 — Exit without overthrow** | **P** | PSL ministers resign but promise not to vote PiS into office. | A KO–Left minority government negotiates every bill; PSL regains identity while carrying responsibility for instability. |
| **PSL-08 — The centre-right bridge** | **P/E** | A post-Kaczyński PiS or Morawiecki camp offers premiership rotation, agrarian autonomy and a no-retaliation pact. PSL can switch, expose the talks, or use them to extract a coalition reset. | A right cabinet may be numerically viable yet fail over abortion, EU policy, personnel or Konfederacja participation. |
| **PSL-09 — PiS without Kaczyński** | **P** | PSL says it will cooperate with the right only after Kaczyński/Ziobro/Czarnek are excluded. | Encourages a Morawiecki, Szydło or technocratic leadership fight inside PiS; PSL may be blamed for choosing the opposition's leader. |
| **PSL-10 — Rebuild Third Way** | **P** | Poor PSL and Poland 2050 polling revives a common-list offer. | The brand can return as a survival cartel, but leadership, thresholds and the failed 2025 experience reduce trust. |
| **PSL-11 — Third Way ends early** | **P** | Candidate selection, abortion or list places rupture PSL–Poland 2050 before 2023. | One or both may fall below the threshold, radically changing the 2023 majority. KO gains candidates; PiS gains rural space. |
| **PSL-12 — A Third Way party** | **P** | Hołownia and Kosiniak-Kamysz attempt a permanent merger instead of an electoral alliance. | Local PSL structures resist subordination; urban Poland 2050 liberals resist conservative discipline; a failed congress produces two splinters rather than two parties. |
| **PSL-13 — Succession in the green party** | **P** | A bad election or coalition humiliation challenges Kosiniak-Kamysz. Zgorzelski offers sharper conservative leverage, Pasławska negotiated pragmatism, or an old local baron a return to agrarian transactionalism. | Successor identity determines whether threats seek policy, office, a right realignment or electoral reunification with centrists. |
| **PSL-14 — The peasant-left bargain** | **P** | The Left offers farm debt relief, public transport, rural healthcare, stronger producer bargaining and anti-monopoly enforcement instead of culture-war concessions. | Can build a material coalition across the rural/urban divide, but threatens agribusiness and does not eliminate conservative disagreement. |

## Presidency chains

The presidency should be built dynamically from candidate availability,
endorsements, first-round transfers and the condition of each party. The actual
2020 and 2025 runoffs were narrow enough that alternatives need no invented
catastrophe.

### Courting the president

A hostile or adjacent president is not another coalition caucus. The player
should court the office **bill by bill**. Before sending a proposal, assemble a
presidential dossier:

- ideological compatibility with the president's public commitments;
- whether the Palace was consulted before the government announced the bill;
- presidential authorship, amendment credit or institutional prerogative;
- legal quality and risk of Constitutional Tribunal referral;
- public salience, movement pressure and affected voter groups;
- relationship to defence, the US, Ukraine and presidential appointments;
- legacy value at the president's current stage of office;
- cost of defying the president's sponsoring party or independent political
  network;
- concessions available without destroying the Left's internal mandate.

The available approaches are early private consultation, a joint expert group,
accepting a presidential amendment, inviting the president to submit a parallel
bill, narrowing the measure, obtaining external validators, building a public
veto-cost campaign, or sending the maximal bill and forcing a clear rejection.
Each affects policy content, credit and precedent. Too many quiet concessions
make the president a de facto coalition partner; too many theatrical defeats
teach the Palace that vetoes are free.

Resolve the end stage as one of: signature; signature with a hostile statement;
presidential bill replacing the government's version; preventive referral to
the Tribunal; signature followed by constitutional review; veto; or negotiated
withdrawal. A budget uses its separate constitutional procedure and must not
reuse the ordinary-veto branch.
([constitutional presidential procedures](https://www.president.pl/archives/andrzej-duda/president/competences/the-president-on-the-adopted-laws))

| ID | Label | Entry conditions and immediate fork | Follow-ups |
| --- | --- | --- | --- |
| **PRE-01 — Trzaskowski wins in 2020** | **N** | Shift less than two percentage points through turnout, pandemic competence or cleaner opposition transfers. | Earlier cohabitation blocks PiS laws, changes the 2021 media crisis and recovery-fund bargain, and makes Trzaskowski unavailable as KO leader unless he resigns. |
| **PRE-02 — Trzaskowski wins in 2025** | **N** | A similarly narrow runoff reverses. | Tusk can legislate more freely, but PSL still blocks bills before the veto stage. Success creates a rivalry over who embodies KO and who receives credit for reform. |
| **PRE-03 — Biedroń recovers the 2020 campaign** | **P** | A clear secular/social campaign, strong digital organisation during lockdown and united activists prevent collapse. | Even without winning, a double-digit result changes the endorsement price and the SLD–Wiosna merger balance. A runoff place requires a much larger breakdown of KO/Hołownia. |
| **PRE-04 — One left candidate in 2025** | **P** | Nowa Lewica accepts Zandberg, Razem accepts Biejat, or an open primary selects a compromise. | Unity may add votes or merely conceal strategic conflict. The candidate's result determines entry into cabinet, list leadership and control of the “economic left” brand. |
| **PRE-05 — A left candidate reaches the runoff** | **P/E** | KO campaign failure plus consolidated left support and a strong debate performance displace Trzaskowski. | KO endorsement comes with demands. Refusal produces three-bloc politics; acceptance may make a future Left president dependent on Tusk. |
| **PRE-06 — A left president** | **E** | The left reaches and wins a runoff through exceptional mobilisation and broad democratic transfers. | The president can sponsor labour/equality bills and veto austerity, but cannot command the Sejm. Conflict with a KO prime minister over budget, NATO, appointments and credit is likely. |
| **PRE-07 — President Biejat** | **P/E** | Biejat unites government progressives, performs as a pragmatic social democrat and receives KO transfers. | Strong on housing, care and equality; vulnerable to claims she is a Czarzasty/KO proxy or has abandoned Razem. |
| **PRE-08 — President Zandberg** | **P/E** | Zandberg converts debate visibility into a runoff and forces KO to support him. | Greater independence from the cabinet; possible vetoes of liberal economic policy; pressure for Razem to decide whether it is a governing party. |
| **PRE-09 — Disputed result, lawful resolution** | **N** | Counting errors and protests produce demands to delay swearing-in. The Marshal follows the constitutional calendar while courts review specific precincts. | Preserves legitimacy but angers coalition militants; the Marshal gains a statesman reputation and opposition goodwill. |
| **PRE-10 — The Marshal delays the oath** | **P/E** | Hołownia or another Marshal accepts an argument that the result cannot yet be certified. | Court confrontation, mass protest, possible removal attempt and coalition rupture. It must not automatically reverse the result. |
| **PRE-11 — The president builds a movement** | **P** | Nawrocki, Trzaskowski or a Left president uses vetoes, tours and appointments to build an independent parliamentary vehicle. | Cannibalises the sponsoring party and turns presidential succession into a party-system rupture. |
| **PRE-12 — The 2017 Duda revolt** | **H/N** | Judicial protests, rivalry with Ziobro and concern for presidential powers produce vetoes of the Supreme Court and KRS laws. | Duda offers his own bills; PiS attacks or contains the Palace; opposition must decide whether to take a partial victory or reject presidential capture of the reform. |
| **PRE-13 — Lex TVN legacy veto** | **H/N** | A media-ownership bill threatens relations with the US and Duda's constitutional reputation. | Veto opens a narrow presidential–opposition channel without changing his alignment on abortion or courts. PiS hardliners accuse the Palace of surrender. |
| **PRE-14 — Let the Palace author the win** | **P** | The government accepts a Duda/Nawrocki bill or amendment on veterans, defence, disability, family benefits or worker protection. | Policy passes and the president takes credit. Left factions judge whether delivery outweighs loss of ownership. |
| **PRE-15 — Welfare bridge to Duda** | **P** | A costed pension, disability or worker measure matches the president's social-conservative record and has visible beneficiaries. | Signature can split PiS opposition discipline. Adding equality or Church reform to the package destroys the bridge but may preserve the Left's mandate. |
| **PRE-16 — Duda protects his judicial architecture** | **H/N** | The post-2023 government asks him to undo institutions he helped create. | Referral or veto is more likely than compromise; early consultation can only narrow the dispute. Waiting for the next president may waste a parliamentary term. |
| **PRE-17 — Presidential foreign-policy channel** | **P** | Defence, Ukraine or US relations require a joint line despite domestic conflict. | A successful council or foreign visit builds working trust that can spill into one domestic bill; public exclusion of the president produces rival diplomacy. |
| **PRE-18 — Lame-duck independence** | **P** | Near the end of Duda's second and final term, legacy and post-office options outweigh candidate discipline. | Unexpected signatures or vetoes become possible, but the Palace may also entrench appointments before departure. Court the legacy, not an imaginary third-term electorate. |
| **PRE-19 — Duda after the Palace** | **P** | He rejects ordinary party work but builds a foundation, international role, programme or media platform. | Can mediate the PiS succession, support a candidate, remain above it, or become a commentator without possessing a parliamentary machine. |
| **PRE-20 — Duda challenges Kaczyński's successor** | **P** | PiS fragmentation creates demand for an electorally proven conservative not controlled by one caucus. | Szydło/Morawiecki may seek his blessing; party barons resist a Palace network with weak local organisation. |
| **PRE-21 — PiS disciplines an independent president** | **P** | Repeated vetoes or appointments frustrate the party. | Withhold legislative support, attack advisers, build the next candidate early, or accept autonomy to preserve right unity. Escalation can create a presidential splinter. |
| **PRE-22 — One signature, no détente** | **P** | The president signs a Left labour bill after vetoing equality or court reform. | Prevents a global “relations improved” bonus. Voters and factions update by issue; the next dossier starts from changed credit but unchanged ideological distance. |

## KO: rupture and succession after Tusk

The October–November 2025 merger of PO, Nowoczesna and Inicjatywa Polska makes
KO a single legal party with internal environments. In April 2026 Nowacka and
Sikorski joined the enlarged vice-chair group while Kierwiński remained general
secretary. Trzaskowski had already beaten Sikorski 74.75–25.25 in the 2024
presidential primary. These facts make all four proposed successors legible,
but not equally likely.
([PAP on consolidation](https://www.pap.pl/en/news/tusks-leadership-civic-coalition-seems-unquestionable-say-members);
[PAP on the 2026 leadership](https://www.pap.pl/aktualnosci/rada-krajowa-ko-wybrala-15-wiceprzewodniczacych-sekretarza-generalnego-i-skarbnika);
[PAP on the primary](https://www.pap.pl/en/news/polands-main-ruling-party-picks-trzaskowski-presidential-candidate))

| ID | Label | Entry conditions and political offer | Main risk / downstream branch |
| --- | --- | --- | --- |
| **KO-01 — Tusk never returns** | **P** | In 2021 PO continues under Budka or chooses Trzaskowski; the opposition remains less centralised. | Hołownia and the Left keep more space, but coordination in 2023 is weaker and PiS may retain power. |
| **KO-02 — Trzaskowski succession** | **P** | Available only when he is not president. Mayors, younger liberals and social progressives rally after Tusk retires or loses confidence. | Strong electoral profile but weaker control of parliamentary machinery; Sikorski and apparatus candidates demand guarantees. |
| **KO-03 — Sikorski succession** | **P** | Security crisis, war or presidential defeat makes foreign-policy experience decisive; deputy-premier status supplies an institutional base. | Strong Atlanticist and executive image, but a quarter of the 2024 primary vote shows limited internal reach. Relations with PSL may improve on security and worsen on style. |
| **KO-04 — Nowacka succession** | **P** | A progressive revolt after repeated abortion/equality failures joins former iPl members, women and education activists. | Can outflank the Left on social issues while remaining economically broad; conservative KO members and PSL may threaten exit. |
| **KO-05 — Kierwiński succession** | **P** | A sudden vacancy favours the general secretary who controls organisation, membership and list preparation. | Effective caretaker/apparatus leader with limited independent mass appeal; may prompt Trzaskowski or Sikorski to force an early contest. |
| **KO-06 — Budka or Siemoniak caretaker** | **P** | Tusk resigns during government crisis and the party prioritises continuity over ideological change. | Postpones rather than resolves succession; coalition partners exploit the weak mandate. |
| **KO-07 — The economic-liberal revolt** | **P** | Business, finance-ministry and former Nowoczesna circles resist labour costs, housing intervention or taxes. | A liberal splinter can cooperate with Poland 2050/Unia Centrum, depriving KO–Left of a majority. |
| **KO-08 — The progressive revolt** | **P** | Nowacka's circle, Greens and local activists reject another abortion or partnership retreat. | Join the Left, form a progressive list or stay to challenge Tusk. A premature split risks the threshold and helps PiS. |
| **KO-09 — Greens leave the coalition** | **P** | Nuclear, motorway, Oder, flood adaptation or farm concessions make continued KO association untenable. | Small parliamentary effect, larger credibility effect; the Left can recruit them or compete for the same urban electorate. |
| **KO-10 — Tusk loses confidence** | **P** | Presidential defeat, scandal and a failed budget cause KO deputies to fear 2027. | Resignation, internal leadership election, alternate coalition premier or early election. Coalition partners should be able to back Tusk personally or a successor separately. |
| **KO-11 — Prime minister Trzaskowski** | **P** | If not president, he replaces Tusk through coalition renegotiation rather than election. | Warsaw succession becomes its own scandal; parliamentary partners demand a new agreement and ministries. |
| **KO-12 — Prime minister Sikorski** | **P** | External security crisis gives him a cross-party mandate. | Defence/foreign policy dominates; economic and social delivery may be delegated to coalition partners, giving the Left unusual leverage. |
| **KO-13 — KO formally ruptures** | **P/E** | Leadership contest plus programme and list disputes produce two clubs. | Both claim Tusk's legacy and name; local authorities and party property become more valuable than the initial opinion-poll transfer. |

## PiS and the struggle to inherit Kaczyński

As of the cutoff, this is not wholly hypothetical. Kaczyński was re-elected in
June 2025 but acknowledged his age. The July 2026 ultimatum over political
associations produced a rupture with Morawiecki's Rozwój Plus; Morawiecki said
his group contained forty MPs, one senator and three MEPs. PiS also contains
different bases around former prime minister Beata Szydło, Czarnek, the party
apparatus, former Sovereign Poland figures and President Nawrocki.
([PAP on Kaczyński's re-election](https://www.pap.pl/en/news/kaczynski-re-elected-law-and-justice-leader-yet-another-term);
[PAP on Rozwój Plus](https://www.pap.pl/en/news/rebel-faction-leader-said-he-fought-pis-unity-until-very-end))

| ID | Label | Leadership offer | Likely alignment and risk |
| --- | --- | --- | --- |
| **PIS-01 — Managed succession congress** | **P** | Kaczyński schedules a contest and acts as arbiter. | Most orderly outcome, but a chosen successor lacks his authority and excluded camps may leave after lists are allocated. |
| **PIS-02 — Beata Szydło** | **P** | Return to social transfers, Catholic-conservative authenticity and small-town campaigning. | Can recover voters from KKP and reassure PSL, but clashes with Morawiecki technocrats and figures involved in replacing her in 2017. |
| **PIS-03 — Mateusz Morawiecki** | **N/H after the split** | Modernising national conservatism, business competence, EU negotiating experience and an attempt to reach Konfederacja voters. | Burdened by the Polish Deal, COVID and elite image; hostility from Sovereign Poland/Czarnek camps. May lead Rozwój Plus outside PiS rather than inherit it. |
| **PIS-04 — Przemysław Czarnek** | **P** | Militant culture war, Church ties, education conservatism and sharp parliamentary opposition. | Strong mobilisation and KKP containment; narrows access to PSL/centre and intensifies church–state, LGBT+ and school conflicts. |
| **PIS-05 — Mariusz Błaszczak** | **P** | Apparatus continuity, defence credentials and minimal ideological departure from Kaczyński. | Can keep the machine together but may lack a separate public mandate; Szydło/Morawiecki camps demand influence. |
| **PIS-06 — Brudziński/Sasin apparatus compact** | **P** | Regional structures and party management choose a collective leadership or caretaker. | Preserves lists and money, but visibly transactional leadership leaves space for Nawrocki, Konfederacja and a charismatic rival. |
| **PIS-07 — Patryk Jaki / Sovereign Poland capture** | **P** | Ziobro's weakened camp rallies around a younger, combative successor and demands harder rule-of-law confrontation. | Makes a PSL deal difficult and competes directly with Braun/Czarnek; potential for a separate party if blocked. |
| **PIS-08 — President Nawrocki's people** | **P** | Presidential approval, vetoes and appointments create an independent faction that presents itself as above old grudges. | PiS becomes dependent on a president it does not control; he can broker unity, sponsor a successor or found a competing movement. |
| **PIS-09 — Szydło–Czarnek compact** | **P** | Szydło supplies social legitimacy, Czarnek culture-war mobilisation. | Powerful conservative opposition, but a dual leadership reproduces the veto problems of other mergers. |
| **PIS-10 — Morawiecki reconciles** | **N** | Kaczyński reverses the 2026 exclusions in exchange for dissolving associations and guaranteed list rules. | Short-term unity; delayed leadership war becomes worse because neither side believes the truce. |
| **PIS-11 — Rozwój Plus becomes a party** | **N** | The 2026 rupture hardens into a parliamentary club and national list. | It can compete, ally with PSL/centre, or bargain for a joint right list; local structures and financing determine whether forty MPs translate into voters. |
| **PIS-12 — Three-way PiS rupture** | **P** | Morawiecki leaves while Szydło/Czarnek and the apparatus also contest succession. | Konfederacja can become the largest right party; PSL becomes a coalition bridge; KO may face several possible no-confidence coalitions. |
| **PIS-13 — Right reunification list** | **P** | Fear of wasted votes produces a list spanning PiS, Rozwój Plus and Konfederacja, but excluding or including KKP is a separate decision. | Candidate allocation and prime-minister choice can destroy the list before voting. Inclusion of Braun carries international and coalition costs. |
| **PIS-14 — Post-PiS social conservatives** | **P/E** | Szydło and parts of PSL build a welfare-conservative, less confrontational party. | Creates a real competitor for older and rural Left voters; opens issue deals on benefits while freezing equality reform. |

## Konfederacja, KKP and the radical-right market

Braun's January 2025 presidential challenge and exclusion from Konfederacja are
historical. So are the distinct legal files now connected by the playable
chain: the December 2023 menorah attack; the April 2025 Oleśnica hospital
confrontation; the July 2025 seven-count indictment for earlier alleged acts;
and the separate Oleśnica investigation. On 14 July 2026 prosecutors asked the
European Parliament for consent to detain and forcibly bring him to questioning
in the latter case after five missed appearances. That is not the same as an
order for pre-trial imprisonment, and the separate files must not be collapsed
into one catch-all prosecution.
([PAP on the split](https://www.pap.pl/aktualnosci/grzegorz-braun-zostanie-usuniety-z-konfederacji-bosak-za-bledy-polityczne-ponosi-sie);
[PAP on Oleśnica](https://www.pap.pl/en/news/far-right-presidential-runner-faces-prosecution-over-attack-doctor);
[National Prosecutor's Office on the indictment](https://www.gov.pl/web/po-warszawa/akt-oskarzenia-przeciwko-grzegorzowi-braunowi);
[PAP on the detention request](https://www.pap.pl/aktualnosci/rzeczniczka-pg-jest-wniosek-do-pe-o-zgode-na-zatrzymanie-europosla-grzegorza-brauna-1))

| ID | Label | Trigger and branches | Follow-ups |
| --- | --- | --- | --- |
| **FAR-01 — Mentzen versus Bosak** | **P** | A dispute over economic libertarianism, nationalism, Ukraine, candidate control or entering government breaks the New Hope–National Movement compact. | Each side claims the Konfederacja name and voters; party registration, money and MPs decide the winner. |
| **FAR-02 — Braun stays inside** | **P** | Konfederacja accepts his presidential run or prevents it with concessions. | The federation keeps votes but cannot normalise its image; every later provocation becomes a leadership-confidence event. |
| **FAR-03 — The Braun rupture** | **H** | Mentzen's candidacy and party discipline expel Braun's current. | KKP can radicalise freely; Konfederacja gains coalition respectability but creates a competitor that can outbid it. |
| **FAR-04 — Braun appears voluntarily** | **N** | Facing loss of immunity/detention, Braun attends questioning and turns it into a media spectacle. | Legal process continues without arrest imagery; supporters may lose urgency while opponents lose the martyr frame. |
| **FAR-05 — Braun is forcibly detained** | **N** | EP consent, continued nonappearance and a valid order permit police action. | Peaceful detention, supporters obstructing police, or procedural failure. Institutional preparation determines violence and legitimacy. |
| **FAR-06 — Braun flees or seeks protection abroad** | **P** | He refuses Polish jurisdiction after immunity is lifted. | Leadership vacuum in KKP, international embarrassment and a remote martyr campaign; asylum is not guaranteed. |
| **FAR-07 — Conviction** | **P** | Trial and appeals end in disqualification, imprisonment or another enforceable sentence. | KKP chooses a successor, fragments or becomes a prisoner-movement. Severity and procedural legitimacy determine backlash. |
| **FAR-08 — Acquittal/procedural collapse** | **P** | Weak evidence, immunity errors or unlawful procedure defeats charges. | Braun claims total vindication and prosecutors/government lose legitimacy well beyond his electorate. |
| **FAR-09 — KKP succession** | **P** | Braun is removed, incapacitated or loses control. | A clerical-nationalist successor preserves the niche; a parliamentary pragmatist seeks reunion; rival claimants split the list. |
| **FAR-10 — Anti-lockdown harvest** | **H/P** | Restrictions, vaccine mandates or health passes let Konfederacja bind small-business anger to anti-system politics. | Patient health messaging and compensation reduce the harvest; coercion without trust enlarges it for years. |
| **FAR-11 — Respectability bargain** | **P** | Bosak/Mentzen offer confidence to PiS or PSL while excluding Braun and moderating Russia/Ukraine rhetoric. | Entry into government can split activists, expose inexperience and hand KKP the anti-system brand. |
| **FAR-12 — Radical-right plurality** | **P** | Konfederacja, KKP and a harder PiS all remain viable. | Competition pushes rhetoric rightward even without coalition; tactical voting and threshold fear create late list negotiations. |

## Poland 2050 and the Marshal crisis

Third Way ended historically in June 2025. Hołownia's side then lost its
founder's leadership, split in February 2026 and removed his name in March.
The most reusable counterfactual is the rotation agreement: Hołownia was to
resign on 13 November 2025 and Czarzasty was elected on 18 November. Before
that, Hołownia sought a coalition renegotiation, met PiS leaders and alleged
that people had urged him to delay Nawrocki's oath.

| ID | Label | Trigger and branches | Follow-ups |
| --- | --- | --- | --- |
| **TD-01 — Hołownia keeps the chair** | **N/P** | He refuses or conditions resignation on a deputy premiership, reforms or a revised coalition agreement. | Coalition can concede, move to dismiss him, or fail to assemble votes for Czarzasty. The Left's highest promised office is at stake. |
| **TD-02 — Czarzasty lacks 231** | **P** | PSL/Poland 2050 defect and the opposition votes together against him. | New candidate, temporary vacancy, Hołownia caretaker controversy or cabinet confidence vote. |
| **TD-03 — Opposition Marshal** | **P/E** | A cross-party revolt elects a PSL, PiS or compromise candidate. | Government retains cabinet but loses agenda control; budget and investigative commissions become existential negotiations. |
| **TD-04 — Rotation succeeds** | **H** | Hołownia resigns and Czarzasty wins. | Poland 2050 must receive another institutional asset or accept decline; the Left gains visibility and responsibility for Sejm procedure. |
| **TD-05 — The night meeting** | **N** | Hołownia's talks with Kaczyński are dialogue, bluff, or construction of a new majority. Player can expose, investigate or negotiate. | Overreaction can make a bluff real; ignoring genuine arithmetic can lose the government. |
| **TD-06 — Founder returns** | **P** | Poland 2050 fragmentation causes activists to recall Hołownia. | Restores visibility but confirms personalism; Pełczyńska-Nałęcz and Hennig-Kloska currents may unite against him. |
| **TD-07 — Pełczyńska-Nałęcz holds the party** | **H/P** | Policy delivery and a clean internal contest prevent the February 2026 split. | A programmatic centre survives but still faces threshold and list-choice pressure. |
| **TD-08 — Hennig-Kloska wins** | **N/P** | Reverse the narrow leadership result or build Unia Centrum earlier. | More climate/centrist orientation; rival Poland 2050 club forms around Pełczyńska-Nałęcz. |
| **TD-09 — Poland 2050 dissolves into KO** | **P** | Polling below threshold and ministerial careers make absorption rational. | KO gains MPs and technocrats; PSL claims Third Way's independent legacy; defectors form a purist remnant. |
| **TD-10 — A common centre list** | **P** | PSL, Poland 2050, Unia Centrum and liberal KO defectors assemble an electoral cartel. | Can clear the threshold and become kingmaker, or collapse over leadership and social policy before registration. |

## The left's internal game

### Governing versus imposing conditions

| ID | Label | Trigger and branches | Delayed consequences |
| --- | --- | --- | --- |
| **LFT-01 — The 2019 bargain** | **H/N** | SLD offers legal machinery, Wiosna a candidate/brand and Razem activists/credibility. Allocate lists proportionally, by polling or through local primaries. | The allocation becomes the baseline for every later merger and grievance. |
| **LFT-02 — Different 2020 candidate** | **P** | Open primary selects Zandberg, Biedroń, Dziemianowicz-Bąk or a non-party figure. | Result redistributes prestige among SLD, Wiosna and Razem and changes who can demand merger leadership. |
| **LFT-03 — Recovery-fund refusal** | **N** | Lewica refuses the 2021 PiS deal unless the whole opposition agrees. | KO trust improves; policy concessions and national relevance disappear; government may find other votes or enter deeper crisis. |
| **LFT-04 — Harder recovery bargain** | **N** | Demand enforceable housing/health/local-government milestones and monitoring. | Success boosts delivery; failure exposes whether PiS only needed votes. Internal dissent depends on transparency. |
| **LFT-05 — The merger coup** | **N** | Suspensions and faction rules cause SLD dissidents, Wiosna or regional branches to reject the 2021 congress. | Competing legal claims, PPS club growth and lost local machinery; eventual unity requires an amnesty or leadership change. |
| **LFT-06 — Razem imposes itself in 2023** | **N/P** | Razem conditions a common list and future government support on health/housing spending, labour law and no austerity. | Nowa Lewica can concede, risk separate lists or ask KO to isolate Razem. Concessions must survive coalition talks to retain trust. |
| **LFT-07 — Razem enters cabinet** | **N** | A funded social package and suitable ministry persuade Razem to join Tusk's government. | More direct delivery and collective responsibility; internal split may occur between governing and movement wings sooner. |
| **LFT-08 — Razem confidence and supply** | **H** | Razem stays outside but supports investiture and selected budgets. | Every budget is a milestone check. Failure pushes Razem out of the club; success makes Nowa Lewica fear being outflanked. |
| **LFT-09 — Razem withdraws confidence** | **P** | Health, housing or labour red lines are missed. | Government seeks PSL/right votes, renegotiates, or falls. Razem must show it can cause a crisis without being blamed for a PiS return. |
| **LFT-10 — The 2024 split is prevented** | **N** | Joint opposition protocol lets Biejat's cooperative wing stay while Razem retains autonomy. | Larger but ambiguous party; presidential candidate selection becomes the next rupture point. |
| **LFT-11 — Biejat's bridge succeeds** | **P** | A strong 2025 campaign reunites ex-Razem progressives, Wiosna and younger Nowa Lewica figures. | Creates a succession threat to the old guard and a competitor to KO progressives. |
| **LFT-12 — Zandberg claims the left** | **N/P** | His superior 2025 result triggers demand for common-list leadership and programme primacy. | Nowa Lewica can accept, hold a primary or use offices/structures to resist. A failed negotiation risks mutual threshold losses. |
| **LFT-13 — Old guard defensive turn** | **P** | Weak polls and PSL pressure lead Czarzasty/SLD networks to emphasise pensions, state competence and culturally cautious language. | May recover older voters and coalition stability while bleeding urban activists to Razem/KO. |
| **LFT-14 — Progressive revolt** | **P** | Abortion, partnership, religion and trans retreats cause Wiosna-derived and younger members to challenge leadership. | New leader, environmental faction, defection to KO/Greens or a separate progressive list. |
| **LFT-15 — Labour wing takes command** | **P** | Widow's pension, PIP reform, collective bargaining and shorter-time pilot make the labour ministry the party's centre of success. | Dziemianowicz-Bąk or another labour figure can bridge old social democrats and Razem, but must choose how hard to confront KO/PSL. |
| **LFT-16 — The Marshal succession** | **P** | Czarzasty's state office, age, scandal or retirement opens a party contest. | Gawkowski offers government continuity; Dziemianowicz-Bąk labour renewal; Biedroń/Wiosna social progressivism; Biejat reconciliation; an apparatus candidate preserves old control. |
| **LFT-17 — One left list in 2027** | **P** | Polls near the threshold force Nowa Lewica and Razem to negotiate leadership, programme, veto rules and places. | Unity bonus is not automatic. Visible coercion creates abstention; transparent primary can create legitimacy but upset local structures. |
| **LFT-18 — Two left lists** | **P** | Both believe the other is declining. | Either can clear the threshold and prove a strategy, both can fail, or a late withdrawal can create lasting resentment. |
| **LFT-19 — A broader social bloc** | **P** | Unions, Greens, feminist movements, housing organisers and rural cooperatives join a left convention. | Deepens social roots but limits leadership control and makes candidate selection contentious. |
| **LFT-20 — Issue deal with PiS** | **H/P** | Pensions, labour enforcement, housing or EU money creates a policy majority with PiS or a successor faction. | Deliverable policy versus KO trust and activist dissent. A formal coalition must not follow automatically. |
| **LFT-21 — Formal Left–PiS government** | **E** | Only after KO rupture, extraordinary security/economic crisis, compatible election arithmetic and written social/constitutional guarantees. | Massive left dissent, likely splinter and legitimacy crisis; government may fall as soon as the emergency ends. |

## Social-policy and culture-war chains

### COVID-19

| ID | Label | Decision points | Follow-ups |
| --- | --- | --- | --- |
| **ISS-COV-01 — The first lockdown** | **H/N** | Support restrictions with worker guarantees; demand legal state-of-disaster procedure; oppose excess powers; propose local targeting. | Health credibility, business survival, civil-liberties trust and election timing all change separately. |
| **ISS-COV-02 — The postal election** | **H/N** | Boycott, compete, negotiate postponement or support Gowin's rebellion. | Determines opposition unity, candidate visibility, constitutional legitimacy and whether the United Right breaks in May 2020. |
| **ISS-COV-03 — The social shield** | **P** | Wage replacement, sick pay, rent suspension, hospital funding, self-employed aid and corporate conditions compete for limited capacity. | Later inequality, debt, evictions and labour credibility should reflect the mix. |
| **ISS-COV-04 — Vaccination strategy** | **H/P** | Persuasion, local clinics, health-worker mandate, general mandate, certificates or no mandate. | Coverage and deaths versus anti-system mobilisation, health-worker retention and trust. |
| **ISS-COV-05 — Procurement scandal** | **P** | Masks, ventilators, tests or vaccine contracts reveal incompetence or corruption. Investigate across party lines or exploit immediately. | A clean investigation can force resignation; partisan overreach can bury evidence in polarisation. |
| **ISS-COV-06 — Long aftermath** | **P** | Address excess deaths, long COVID, learning loss, mental health and medical backlog or declare the crisis over. | Neglected costs surface during later elections and undermine every health promise. |

### Abortion and reproductive rights

Treat the Black Protests, Women's Strike and annual women's marches as an
autonomous movement system, not a reserve army that the Left can summon at
will. Track movement capacity, public breadth, radicalism, repression memory,
trust in each party, medical/legal expertise and organiser exhaustion
separately. A huge demonstration can defeat a bill without producing a durable
party realignment; a smaller legal-aid network can save access after the
streets empty.

The 2016 Black Monday helped force PiS to abandon a near-total-ban bill, while
the 2020 Tribunal decision produced a much larger and broader wave against a
restriction that nevertheless entered into force. Those are different kinds
of success and failure.
([Amnesty on the 2016 reversal](https://www.amnesty.org/en/latest/press-release/2016/10/poland-women-force-historic-u-turn-on-proposed-abortion-ban/);
[Human Rights Watch on threats to activists after 2020](https://www.hrw.org/news/2021/03/31/poland-escalating-threats-women-activists))

| ID | Label | Decision points | Follow-ups |
| --- | --- | --- | --- |
| **ISS-ABR-01 — Tribunal ruling prevented** | **P** | Duda/PiS delays the referral, tribunal moderates, or political pressure changes timing. | United Right avoids immediate protests but internal hardliners revolt; abortion remains a 2023 election issue without the same lived baseline. |
| **ISS-ABR-02 — Strike becomes movement** | **H/P** | The Left provides legal aid, organisers and programme while respecting movement autonomy—or attempts to capture it. | Durable feminist infrastructure, party recruitment, or activist distrust. |
| **ISS-ABR-03 — Clinical guidance** | **H/P** | Health ministry/prosecutor clarifies life-and-health exceptions, funds training and protects doctors before statutory reform. | Can reduce harm under hostile law; conservatives call it abortion by regulation and seek court review. |
| **ISS-ABR-04 — Four bills, one strategy** | **H/N** | Committee all bills, choose decriminalisation first, restore the old compromise, legislate to twelve weeks, or call a referendum. | Coalition sequence determines which defeat consumes momentum. |
| **ISS-ABR-05 — PSL veto** | **H/N** | Accept a free vote, trade another policy, shame PSL publicly, or tie the bill to coalition survival. | Progressive anger, PSL identity recovery, possible old-guard/Razem dispute over staying in cabinet. |
| **ISS-ABR-06 — Presidential workaround** | **H/P** | Guidance, pharmacist prescriptions, public provision and prosecutor policy substitute for a vetoed statute. | Practical access improves unevenly; the next president can reverse administrative measures quickly. |
| **ISS-ABR-07 — Referendum** | **P** | Wording, turnout threshold, date and whether the result binds parliament become separate fights. | Can legitimate reform, fail through boycott or intensify polarisation without producing a law. |
| **ISS-ABR-08 — Black Monday** | **H/N** | Support a women's strike with legal aid, workplace protection and local organisers; front it with party leaders; or wait for public opinion to move. | The ban is defeated, but attempted party ownership reduces movement trust. Quiet logistical support builds organisers who return in 2018 and 2020. |
| **ISS-ABR-09 — Black Friday remobilisation** | **H/N** | A renewed restriction in 2018 tests whether the 2016 network can mobilise outside the original moment. | A successful national response raises feminist capacity; weak party attendance begins a lasting charge that parliamentary allies appear only at election time. |
| **ISS-ABR-10 — The ruling is published** | **H/N** | In late 2020, demand immediate repeal, use institutional delay to build medical protections, or negotiate an unworkable “compromise.” | Delay exhausts some activists but permits organisation; publication after the streets recede creates rage, repression and a practical-access emergency. |
| **ISS-ABR-11 — The strike enters churches** | **H/N** | Defend disruptive protest as a response to Church power, condemn it, or distinguish peaceful presence from property damage and harassment. | Radical energy and conservative backlash rise separately. The old guard, Wiosna-derived progressives and Razem can take different public lines. |
| **ISS-ABR-12 — Legal defence network** | **H/P** | Fund lawyers and security for organisers arrested, sued or threatened while keeping the network independent. | Builds durable capacity and minority trust; directing case strategy from party headquarters creates capture allegations and exposes party finances. |
| **ISS-ABR-13 — “Not One More”** | **H/P** | A preventable death in pregnancy turns clinical ambiguity into a national moral crisis. Centre the family and doctors, announce regulation, or immediately force the maximal bill. | Credible guidance can save lives but look insufficient; an opportunistic party performance can alienate the bereaved and movement while a delayed response loses salience. |
| **ISS-ABR-14 — March fatigue** | **P** | Repeated demonstrations bring diminishing turnout. Rotate organisers, invest in local care/legal work, escalate disruption, or accuse citizens of apathy. | Movement infrastructure either survives the low-attention period or burns out before the parliamentary vote. |
| **ISS-ABR-15 — Manifa as a broad coalition** | **H/P** | Annual women's marches combine abortion, pay, care, violence, LGBT+ rights and housing. Embrace the full platform, send a delegation, or compete over demands. | Breadth sustains a movement between crises but creates internal disputes over class, party flags, trans inclusion and foreign policy. |
| **ISS-ABR-16 — Activist becomes candidate** | **P** | Offer a winnable place, an independent endorsement, or a policy role without membership. | Candidate supply and movement credibility rise if autonomy is respected; parachuting or disciplining the recruit can split the local march network. |
| **ISS-ABR-17 — Movement ultimatum** | **P** | Feminist organisations demand that the Left leave a cabinet which repeatedly loses abortion votes. | Exit may restore progressive credibility and sacrifice clinical guidance, budgets and other reforms; staying requires a dated, enforceable coalition concession rather than another promise. |
| **ISS-ABR-18 — Inclusion dispute** | **P** | A women's march faces a dispute over trans-inclusive language, sex-based protections or speaker selection. | Facilitation and concrete shared demands can preserve a broad coalition. Cynical exploitation by a faction turns representation into an enduring movement rupture. |

### Religion and schools

| ID | Label | Decision points | Follow-ups |
| --- | --- | --- | --- |
| **ISS-REL-01 — One religion lesson** | **H/N** | Implement nationally, let local schools decide, compensate catechists, or postpone after Church challenge. | Budget savings, teacher conflict, episcopal mobilisation and court review. |
| **ISS-REL-02 — First or last period** | **H/P** | Enforce scheduling strictly or accept practical exemptions. | A technical rule becomes the measure of whether secularisation is real. |
| **ISS-REL-03 — Health education** | **H/N** | Mandatory subject, opt-out, content compromise or abandonment. | Participation, teacher supply and misinformation determine whether formal victory changes knowledge. |
| **ISS-REL-04 — Sex education panic** | **P** | Fabricated or real curriculum material goes viral. Respond with transparency, counter-mobilisation, disciplinary action or retreat. | Can topple an education minister and strengthen Braun/Czarnek/Church networks. |
| **ISS-REL-05 — Church finance** | **P** | Replace the Church Fund with a tax designation, maintain it, or link reform to abuse accountability. | Bishops divide between negotiation and confrontation; PSL/old guard become pivotal. |
| **ISS-REL-06 — Concordat confrontation** | **E** | A strongly secular government seeks structural renegotiation. | Long international/legal process, huge mobilisation and internal-left disagreement over priorities. |

### LGBT+, marriage and trans representation

| ID | Label | Decision points | Follow-ups |
| --- | --- | --- | --- |
| **ISS-LGBT-01 — Closest-person compromise** | **H/N** | Accept PSL's narrow agreement, insist on civil partnerships, or hold the bill until the presidency changes. | Partial rights and activist disappointment; passage can still end in veto. |
| **ISS-LGBT-02 — Partnership after veto** | **N/P** | Narrow again, mobilise for override, litigate under EU law, or make it a presidential-election pledge. | Tests whether incrementalism accumulates or exhausts supporters. |
| **ISS-LGBT-03 — Marriage equality** | **P** | Introduce directly after a friendly presidency or build from partnership/CJEU recognition. | Constitutional challenge, PSL free vote and Church campaign; KO progressives may outbid the Left. |
| **ISS-LGBT-04 — CJEU recognition conflict** | **H/P** | Administration recognises foreign EU marriages promptly, minimally or not at all. | Compliance litigation, sovereignty backlash and unequal rights between mobile and non-mobile couples. |
| **ISS-LGBT-05 — Gender-recognition procedure** | **H/N** | Codify the Supreme Court route, create a modern administrative act, or leave reform to courts. | Parliament can stabilise rights or reopen the 2015 veto fight. |
| **ISS-LGBT-06 — Trans candidate** | **P** | Place an openly trans person in a winnable district or senior public role; invest in security and substantive policy. | Genuine representation, media harassment, internal caution and a test of whether party support survives a manufactured scandal. |
| **ISS-LGBT-07 — Constitutional counterattack** | **P** | President, prosecutors or conservative MPs send gender-recognition or marriage rules to the Constitutional Tribunal. | Legal dualism and EU litigation; administrative uncertainty becomes the immediate harm. |
| **ISS-LGBT-08 — Hate-speech law** | **P** | Expand protection to sexual orientation/gender identity, narrow it for speech concerns, or abandon after presidential/court challenge. | Conflict between minority safety, civil-liberties framing and far-right prosecution narratives. |

### Workers, welfare and public services

| ID | Label | Decision points | Follow-ups |
| --- | --- | --- | --- |
| **ISS-LAB-01 — Teachers' strike** | **H/N** | Strike fund, mediation, pay settlement, exams legislation or neutrality. | Determines union trust years before the Left governs education/labour. |
| **ISS-LAB-02 — Free Christmas Eve** | **H/P** | Full closure, Sunday-trading exchange, small-business compensation or retreat. | Visible gain versus retail-worker loopholes and employer backlash. |
| **ISS-LAB-03 — Shorter-time pilot** | **H/P** | Broad, sectoral or tightly controlled pilot; independent evaluation or political showcase. | Universal 35-hour/4-day proposal, quiet abandonment, or employer-led flexibility without worker power. |
| **ISS-LAB-04 — PIP enforcement** | **H/P** | Fund inspectors and reclassification powers, or satisfy the KPO milestone on paper. | Real conversion of sham contracts, court backlog, employer evasion or presidential credit-sharing. |
| **ISS-LAB-05 — Collective bargaining** | **H/P** | Sectoral agreements, public-procurement incentives, union-access rights or passive registration. | Raises wage-setting power or becomes an unused legal shell. |
| **ISS-LAB-06 — General strike** | **P/E** | Austerity, pensions, public-sector pay or labour-law rollback unites unions. | Mediate, join, repress or wait it out. Militancy, union relations and public sympathy determine cabinet survival. |
| **ISS-LAB-07 — Housing ultimatum** | **P** | Razem/Left demands public construction and tenant protection against a credit-subsidy policy favoured by KO/PSL. | Budget crisis, developer scandal, compromise or Razem withdrawal of support. |
| **ISS-LAB-08 — Health-service breakdown** | **P** | Queues, hospital debt and staff protest peak after COVID. | Raise contributions/taxes, restructure hospitals, increase private contracting or ration implicitly; each reshapes the left coalition. |
| **ISS-LAB-09 — Pension ownership** | **H/P** | PiS and Left compete over indexation, widow's pension and retirement age. | Issue cooperation can deliver benefits while blurring opposition/government identities. |
| **ISS-LAB-10 — Representation versus redistribution** | **H/P** | Women-on-boards rule divides equality advocates and class-first critics. | Combine with care/wage policy, claim an elite-only win, or let KO own it. |

## Courts, the Constitutional Tribunal and state accountability

The judicial crisis is not one chain and should not use one “rule of law”
score. Track at least:

- lawful composition and recognised authority of the Constitutional Tribunal;
- status of each contested Tribunal seat and each judge's term;
- KRS composition and the appointment path of different groups of judges;
- independence and recognised status of Supreme Court chambers;
- prosecutor independence and chain of command;
- president–government cooperation over appointments and legislation;
- compliance with Polish judgments, ECtHR judgments and CJEU judgments;
- public legal certainty, court capacity and case backlog;
- judicial self-government and trust of ordinary court users;
- government restraint: whether repair uses general law, individual review or
  politically directed shortcuts.

The original 2015–2016 Tribunal conflict concerned appointment, recognition
and publication of judgments. The later crisis also includes “double judges,”
the Tribunal presidency, judgments issued by irregular panels, a parliamentary
resolution declaring institutional dysfunction, reform statutes referred by
President Duda, and European judgments questioning whether particular panels
constitute a tribunal established by law. A change of government does not
collapse those disputes into a clean replacement decision.
([European Commission recommendation of 27 July 2016](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016H1374);
[ECtHR, *Xero Flor v Poland*](https://hudoc.echr.coe.int/eng/?i=001-210065);
[Sejm resolution of 6 March 2024](https://eli.sejm.gov.pl/eli/MP/2024/198/ogl/pol);
[Venice Commission opinion on the 2024 Tribunal reforms](https://www.venice.coe.int/webforms/documents/?pdf=CDL-AD%282024%29035-e))

| ID | Label | Trigger and branches | Follow-ups |
| --- | --- | --- | --- |
| **LAW-01 — Public media quickly** | **H/N** | Replace boards through corporate/liquidation route and accept legal challenge. | Immediate communications gain, procedural legitimacy cost and presidential retaliation. This is detailed in the [media model](MEDIA_MODEL.md#public-media-is-a-governance-problem). |
| **LAW-02 — Public media slowly** | **P** | Wait for legislation, courts and negotiation with Duda. | PiS-aligned management survives longer; reform has a cleaner mandate but may never pass. This is detailed in the [media model](MEDIA_MODEL.md#public-media-is-a-governance-problem). |
| **LAW-03 — Pegasus truth commission** | **H/P** | Parliamentary inquiry, prosecutor-led case, independent technical commission or broad amnesty for testimony. | Evidence can reform services or be discredited as vengeance. |
| **LAW-04 — Kamiński/Wąsik confrontation** | **H/N** | Arrest, negotiate surrender, delay enforcement or recognise Duda's pardon. | Court authority versus martyrdom; establishes precedent for later accountability cases. |
| **LAW-05 — Prosecute selectively** | **P** | Prioritise strongest corruption/abuse files with independent review. | Slower but more legitimate; coalition militants complain that settlements are stalling. |
| **LAW-06 — Settle everything at once** | **P** | Mass investigations and institutional replacement. | Capacity overload, errors and opposition mobilisation; a friendly president or constitutional majority becomes crucial. |
| **LAW-07 — EU funds freeze persists** | **P** | Commission rejects the new government's rule-of-law plan or milestones fail. | Coalition budget crisis, Eurosceptic backlash and pressure for constitutionally risky shortcuts. |
| **LAW-08 — Article 7 closes** | **H** | EU rewards the action plan before domestic judicial conflict is resolved. | Government claims normalisation; critics attack Brussels for accepting promises. |
| **LAW-09 — A minister falls** | **P** | Procurement, appointments, abuse or personal scandal reaches a Left ministry. | Defend, investigate, dismiss or trade portfolios. Factional succession should follow the personnel choice. |
| **LAW-10 — Publish the missing judgments** | **H/N** | A government or Tribunal presidency publishes, annotates, rejects or selectively recognises judgments withheld during the 2015–2016 crisis. | Restores part of the record but opens disputes about retrospective legal effects and which later acts depended on unlawful non-publication. |
| **LAW-11 — The three contested seats** | **H/N** | Treat the “double judges” as never appointed, await individual term expiry, negotiate resignations, or seek adjudication by an agreed panel. | Speed, personnel rights and institutional legitimacy trade off. Police removal from the building is an exceptional escalation, not an administrative shortcut. |
| **LAW-12 — The Sejm declares dysfunction** | **H/N** | Adopt the historical 2024 resolution, narrow it to specific panels, or refuse a declaratory route. | A powerful political mandate can persuade state organs to withhold participation, but a resolution alone cannot securely settle every judgment or judicial office. |
| **LAW-13 — Duda's preventive referral** | **H/N** | President Duda refers the Tribunal reform statutes before signature. Negotiate amendments, wait for a new president, contest the receiving panel, or seek a constitutional majority. | The reform can remain frozen while disputed judges decide the body designed to replace them. Ignoring the referral maximises speed and legal dualism. |
| **LAW-14 — The Venice-compatible reset** | **N/P** | Rewrite the package around individual review, continuity, transparent selection and execution of European judgments. | Slower and less satisfying to coalition militants; increases international and professional legitimacy and may isolate a presidential veto. |
| **LAW-15 — Tribunal terms expire naturally** | **P** | Maintain institutional quarantine while successive terms end and elect replacements under stricter cross-party rules. | Avoids a purge but sacrifices years of constitutional review; PiS can boycott or later reverse the appointments. |
| **LAW-16 — Constitutional amendment bargain** | **P/E** | Seek a two-thirds settlement on Tribunal selection, staggered terms, recusals and transitional review. | Requires concessions to PiS or the radical right. A durable court may be bought at the price of entrenching conservative policy or amnesty. |
| **LAW-17 — The flagship law meets the Tribunal** | **P** | A labour, equality, media or abortion law is referred to a panel the government considers irregular. Appear, challenge the panel, obey, repass, or await Europe. | Each option changes immediate policy, court recognition and the precedent used against the next government. |
| **LAW-18 — What happens to old judgments?** | **P** | Validate all for legal certainty, invalidate decisions of irregular panels, or permit case-by-case reopening by affected parties. | Blanket answers are fast and destabilising; individual review is fairer and can overwhelm courts for years. |
| **LAW-19 — KRS selection reform** | **H/N** | Restore judicial election of judge-members, add parliamentary safeguards, or design a mixed selection. | Duda/Nawrocki may veto; the design affects corporatism, democratic accountability and EU compliance separately. |
| **LAW-20 — The president refuses appointments** | **P** | A hostile president refuses or delays judicial appointments under a reformed KRS. Negotiate a list, litigate, publicise vacancies or amend the procedure. | Court vacancies and backlog turn an elite conflict into an everyday service crisis; a secret quota deal destroys reform credibility. |
| **LAW-21 — Categories, not a mass purge** | **P** | Separate judges by appointment circumstances, chamber, conduct and actual independence; use individual challenge and disciplinary review. | Preserves access to court and avoids collective punishment but lets opponents portray repair as weak and leaves years of litigation. |
| **LAW-22 — The blanket nullification** | **P/E** | Declare all post-2018 appointments or judgments invalid. | Delivers a dramatic rupture, then threatens thousands of cases, personnel rights and compliance with rule-of-law standards. Requires an enormous capacity and legitimacy cost. |
| **LAW-23 — Supreme Court chamber collision** | **H/P** | A chamber whose status is contested validates an election, rules on immunity or blocks reform. | Accepting the useful part while rejecting adverse judgments appears opportunistic; consistent treatment can impose severe political cost. |
| **LAW-24 — Election certification under doubt** | **P/E** | A very close presidential or parliamentary result depends on disputed judicial institutions. | Invite maximum observation, publish precinct evidence and use narrow remedies; a political attempt to manufacture jurisdiction can produce parallel claims to office. |
| **LAW-25 — The prosecutor has two superiors** | **H/P** | Rival interpretations of appointment and dismissal create competing national-prosecutor claims. | Police and regional prosecutors choose whose instructions are legally safe. Negotiated transition, court resolution or personnel siege produce different precedents. |
| **LAW-26 — Independent prosecution statute** | **P** | Separate Prosecutor General from justice minister, create a fixed term and transparent removal, or retain democratic ministerial responsibility with safeguards. | Independence can harden into unaccountability; ministerial control can become selective prosecution after the next election. |
| **LAW-27 — Europe rules again** | **H/P** | ECtHR or CJEU finds that another Polish panel fails independence or lawful-establishment standards. | Execute narrowly, reopen affected cases, redesign institutions, or reject the judgment. EU money, sovereignty politics and domestic certainty move independently. |
| **LAW-28 — The backlog defeats the reformers** | **P** | Vacancies, reopening and appointment freezes make waiting times spike. | Emergency funding and triage restore public value; blaming judges or hiding data lets PiS/Konfederacja redefine rule-of-law reform as elite self-service. |
| **LAW-29 — A negotiated zero option** | **P/E** | Government, president and judicial representatives exchange resignations, recognition of uncontested judgments and a new appointments statute. | Can end dualism without declaring a total winner. The price—immunity, recognised appointments or deferred cases—can split KO and the Left. |

## The Ambassador crisis and alliance management

The February 2026 dispute began when US Ambassador Tom Rose announced that he
would no longer communicate with Marshal Włodzimierz Czarzasty after the Marshal
refused to support a Nobel Peace Prize nomination for Donald Trump and
criticised the US president's treatment of allies. Prime Minister Tusk defended
the principle that allies show respect rather than lecture one another.
President Nawrocki both criticised an ambassador attempting to discipline the
Marshal and argued that Czarzasty had damaged the alliance.
([PAP on the ambassador's decision and Tusk response](https://www.pap.pl/aktualnosci/ambasador-usa-w-polsce-nie-bedziemy-juz-utrzymywac-kontaktow-z-marszalkiem-sejmu);
[PAP on Nawrocki's response](https://www.pap.pl/aktualnosci/ambasador-usa-kontra-czarzasty-prezydent-zabral-glos-nie-jest-dobre-dla-polski))

Do not model this as a single US relations penalty. Maintain separate channels:
ambassador–Marshal; White House–president; State Department–foreign ministry;
Congress–Sejm committees; Pentagon–defence ministry; intelligence and military
working contacts; business/investment; and public trust. One channel can break
while the alliance continues to function. Conversely, a smiling presidential
visit does not repair a parliamentary boycott or quiet operational concern.

| ID | Label | Trigger and branches | Follow-ups |
| --- | --- | --- | --- |
| **DIP-01 — Rose breaks contact** | **H/N** | Czarzasty retracts, clarifies without apologising, stands firm, or invites the ambassador to a formal institutional meeting. | Retraction repairs access and damages Left leadership; defiance pleases part of the base and risks making the Marshal the subject of every alliance story. |
| **DIP-02 — Tusk defends the Marshal** | **H/N** | The prime minister invokes allied respect while the foreign ministry privately de-escalates, or publicly distances the cabinet from Czarzasty. | A joint constitutional front protects Polish institutions. Public distancing can save White House access while giving the Left a coalition grievance. |
| **DIP-03 — Nawrocki occupies both positions** | **H/N** | The president condemns diplomatic pressure but blames the Marshal for provoking it. | He can appear more statesmanlike than both sides and strengthen the Palace's claim to lead US policy; government exclusion produces rival diplomacy. |
| **DIP-04 — Committee channels remain open** | **P** | Defence and foreign-affairs committee chairs maintain congressional contacts despite the ambassador's boycott. | Limits material harm and lets a deputy become an alternative Left foreign-policy centre, potentially weakening Czarzasty. |
| **DIP-05 — The ambassador extends the boycott** | **P** | Contact is cut with Left ministers, committee chairs or the entire Sejm leadership after another exchange. | Coalition partners demand a personnel concession; opposition alleges isolation; operational ministries route around the dispute until symbolism becomes material. |
| **DIP-06 — Summon or soothe** | **P** | The foreign ministry summons the ambassador for an explanation, issues a note, requests Washington clarification, or treats it as a personal dispute. | Formal escalation asserts sovereignty but fixes the dispute on the bilateral agenda. Quiet diplomacy can work while looking like capitulation. |
| **DIP-07 — Congressional delegation** | **P** | Visiting US legislators meet the president and government but omit the Marshal, or insist on a parliamentary meeting. | A snub prolongs humiliation; bipartisan contact demonstrates that the alliance is larger than the incumbent administration. |
| **DIP-08 — Defence decision during the rupture** | **P** | Troop posture, arms procurement or Ukraine logistics requires high-level agreement while political contact is frozen. | Professional channels can contain the crisis; a leak alleging delayed defence turns symbolic conflict into a government-threatening event. |
| **DIP-09 — Anti-American left challenge** | **P** | A Left caucus demands base restrictions, procurement review or a parliamentary condemnation of Trump. | Czarzasty can channel anger into a narrow sovereignty resolution or lose control to a challenger who ties social spending to defence dependence. |
| **DIP-10 — Atlanticist Left revolt** | **P** | Ministers, veterans or younger deputies argue that leadership theatre endangers Ukraine and NATO. | Apology demand, leadership vote or a new foreign-policy caucus; old-guard authority and Left defence credibility move in opposite directions. |
| **DIP-11 — Ambassador recalled or promoted** | **P** | Washington replaces Rose, recalls him for consultations, or publicly backs his conduct. | Replacement permits a face-saving reset without resolving the underlying political dispute; endorsement hardens every actor's domestic incentive not to retreat. |
| **DIP-12 — A rules-based reset** | **P** | The Marshal and ambassador agree that institutional contact resumes without endorsement of one another's statements. | Low-drama success improves working channels but gives neither side a victory headline. A new personal insult can reactivate the chain. |
| **DIP-13 — The alliance election weapon** | **P** | PiS/Nawrocki portray KO–Left as anti-American; KO portrays the Left as reckless; Konfederacja attacks dependency itself. | US relations split into competing nationalist, Atlanticist and European-autonomy frames rather than one pro/anti-American axis. |
| **DIP-14 — Administration changes in Washington** | **P** | A later US government reverses the personal relationship while defence and business ties persist. | Players who burned institutional bridges for access to one president pay a delayed cost; diversified contacts become a strategic asset. |

## Belarus border, refugees and social radicalisation

The border system must separate six questions that polling and political
rhetoric often collapse:

1. whether Belarus/Russia is conducting a hostile instrumentalisation
   operation;
2. confidence in the Armed Forces and Border Guard as institutions;
3. approval of particular force, detention and pushback rules;
4. willingness to admit an individual to an asylum procedure;
5. sympathy for refugees and migrants as people;
6. prejudice, hate crime and willingness to accept minorities as neighbours.

Opinion can become more security-oriented without every voter becoming racist.
At the same time, repeated dehumanisation, impunity and false collective claims
can produce real racist mobilisation which must have consequences beyond an
election bar.

The shift was large: CBOS reported opposition to allowing people at the
Belarusian border to apply for asylum rising from 58% in December 2021 to 72%
in June 2024. After soldier Mateusz Sitek died from wounds inflicted at the
border, 73% opposed accepting asylum applications there, 84% supported wider
firearms authority and 72% supported closing the border fully. These measures
of policy do not reveal what respondents think about every refugee, soldier or
racial minority.
([CBOS, June 2024](https://www.cbos.pl/EN/publications/cbos_news_text.php?no=14%2F2024);
[CBOS, July 2024](https://www.cbos.pl/EN/publications/reports_text.php?id=6862))

Track institutional trust by incident and respondent segment. A death in
service may increase solidarity with soldiers; detention of soldiers who fired
warning shots may cause anger at commanders and prosecutors; evidence of an
unlawful pushback or abuse may reduce trust among rights-oriented voters while
producing a rally effect elsewhere. “Support the uniform” and “trust the
government's border policy” are not interchangeable.

| ID | Label | Trigger and branches | Follow-ups |
| --- | --- | --- | --- |
| **BOR-01 — The 2021 engineered route** | **H/N** | Declare an emergency, request EU/Frontex aid, preserve asylum processing, restrict access, or use pushbacks. | Fast control raises security confidence; opacity and illegality build a delayed court, media and humanitarian crisis. |
| **BOR-02 — Journalists and medics in the zone** | **H/N** | Permit escorted access, independent access, accredited humanitarian teams, or a broad exclusion zone. | Transparency risks images of operational failure but limits rumour. Exclusion gives authorities narrative control and creates dependence on activists and Belarusian footage. |
| **BOR-03 — The person in the forest** | **H/P** | Border unit encounters a sick family or isolated minor. Rescue and register, transfer across the line, call NGO aid, or await command. | Individual welfare, officer legality, unit morale and public framing depend on training and documentation—not only the minister's abstract policy. |
| **BOR-04 — Build the barrier** | **H/N** | Permanent wall, electronic surveillance, mobile patrols, environmental mitigation or no barrier. | Crossings, cost, wildlife damage, procurement scandal risk and symbolic security all change separately. |
| **BOR-05 — Pushback judgment** | **H/P** | A domestic or European court finds an operation unlawful. Comply, appeal, narrow the ruling, compensate, or reject jurisdiction. | Officer legal clarity improves only if new procedure is operationally usable; defiance raises sovereignty support and future damages. |
| **BOR-06 — Mateusz Sitek dies** | **H/N** | National mourning, operational review, immediate force expansion, or accusations against pro-refugee actors. | Solidarity and demand for protection surge. Collective blame can accelerate racism and threats while preventing a sober command inquiry. |
| **BOR-07 — Soldiers detained over warning shots** | **H/N** | Defend prosecutorial independence, suspend investigators, publish evidence, change commanders, or pardon later convictions. | A fair transparent case can preserve legality; political intervention may improve military morale and teach that uniformed conduct is beyond review. |
| **BOR-08 — Wider firearms law** | **H/N** | Pass broad protection, define precise necessity/proportionality, require cameras/reporting, or reject expansion. | Officers gain confidence or legal ambiguity. A later shooting tests whether safeguards were real. |
| **BOR-09 — Temporary asylum suspension** | **H/N** | Suspend applications by regulation/statute, create humanitarian exceptions, request EU derogation, or refuse suspension. | Apparent control and mainstream convergence on the right; constitutional, EU and human-rights challenges; Left rupture over participation in government. |
| **BOR-10 — Processing away from the fence** | **P** | Create controlled registration points, transport to reception centres and rapid security screening with independent monitoring. | May combine order and rights but is vulnerable to sabotage, capacity overload and the charge that it rewards Belarus. |
| **BOR-11 — Officer abuse documented** | **P** | Verified footage shows beating, theft, abandonment or racist language. Investigate individually, deny, blame orders, or attack the source. | Accountability can strengthen professional trust while angering uniformed lobbies; cover-up makes later propaganda easier to believe. |
| **BOR-12 — Activist prosecution** | **H/P** | Charge people for facilitating illegal entry, distinguish humanitarian aid, offer immunity for rescue, or conduct a political show trial. | Conviction may deter aid and mobilise the right; overreach produces an international cause and deepens Left–government conflict. |
| **BOR-13 — Belarus escalates tactically** | **P** | Larger organised groups, weapons, laser attacks, drones or a staged shooting test the line. | Rules of engagement, evidence release and NATO/EU consultation matter. Collective retaliation against all migrants rewards the hybrid tactic. |
| **BOR-14 — A death caused by Polish force** | **P** | A migrant or bystander is killed under disputed circumstances. Independent investigation, immediate defence of officers, compensation, or suppression. | Security support need not collapse, but legal impunity, protest and international litigation can become a lasting crisis. |
| **BOR-15 — Ukrainians are recoded as migrants** | **H/P** | Housing, benefits, crime stories or war fatigue erase the earlier refugee/worker distinction in political rhetoric. | Konfederacja/KKP can combine anti-Ukrainian and anti-Muslim themes; labour enforcement and local integration can prevent zero-sum competition. |
| **BOR-16 — Hate-crime surge** | **H/P** | Assaults and threats against Ukrainians, Muslims, Black residents or aid workers rise. Improve reporting/prosecution, fund victim support, deny a trend, or adopt opponents' rhetoric. | Minority safety and trust, international reputation and extremist confidence shift independently of border crossings. OSCE's 2024 civil-society submissions already show the need to track under-reporting and bias categories. ([OSCE hate-crime reporting](https://hatecrime.osce.org/reporting/poland/2024)) |
| **BOR-17 — Local integration backlash** | **P** | A town faces school crowding, rent pressure and a rumoured migrant centre. Add capacity and resident consultation, impose a site, abandon it, or let activists fight online. | Material investment can reduce competition; secrecy turns an ordinary planning decision into a national mobilisation node. |
| **BOR-18 — The racist candidate** | **P** | A Left candidate or local official uses dehumanising language and claims it is necessary to keep working-class voters. | Discipline protects minority trust and risks a local split; tolerance normalises the frame inside the party and empowers conservative old-guard networks. |
| **BOR-19 — Counter-mobilisation** | **P** | Veterans, medics, border residents, churches and refugee organisations jointly demand secure and lawful procedures. | A non-party coalition can break the security-versus-humanity binary if the Left supplies capacity without branding it as an electoral front. |
| **BOR-20 — Disinformation dossier** | **P** | Evidence links viral atrocity/crime claims to Belarusian or Russian networks, mixed with genuine local grievances. | Publish evidence and fix real failures. Calling every critic a foreign agent destroys credibility and lets authentic racists hide among ordinary residents. |
| **BOR-21 — Uniformed political intervention** | **P/E** | Retired or serving officers publicly attack government border rules during an election. | Protect lawful speech and enforce service neutrality; purge rhetoric politicises the services while inaction can turn commanders into party actors. |
| **BOR-22 — The Left's border convention** | **P** | Razem, old SLD networks, Wiosna-derived progressives, defence-oriented deputies and local mayors negotiate one doctrine. | A line combining border control, lawful asylum, officer protection and anti-racism can restore credibility. A vague compromise invites every faction to contradict it on television. |

## The media ecosystem

Use the actor records, investment ladder and monthly loop in
[MEDIA_MODEL.md](MEDIA_MODEL.md). Media events change reach, trust, agenda
power, talent, access and financial resilience independently. They never add a
generic number of “media votes.”

| ID | Label | Trigger and branches | Follow-ups |
| --- | --- | --- | --- |
| **MED-01 — Public-media shock** | **H/N** | In December 2023, change management quickly through the corporate/liquidation route, negotiate a transition, or wait for a presidential statute. | Speed removes a hostile government broadcaster; procedure, funding, staff treatment and audience trust become separate multi-year crises. |
| **MED-02 — The audience goes into opposition** | **H/N** | Former TVP presenters and viewers migrate to Republika and wPolsce24. Ignore them, compete for viewers, attack the transfers, or defend staff rights while criticising coverage. | A durable alternative network forms. Treating the audience itself as illegitimate makes reacquisition harder. |
| **MED-03 — Republika donation drive** | **H/P** | Advertising loss or expansion produces an appeal to viewers and sympathetic businesses. | Donations improve financial resilience and identity. Publicising donor conflicts can expose patronage or reinforce the persecuted-outsider frame. |
| **MED-04 — Advertiser boycott** | **H/N** | Offensive on-air claims lead large firms to withdraw campaigns. Support a voluntary boycott, demand general standards, oppose commercial pressure, or stay out. | Short-term revenue loss may coexist with audience growth and donations. Government pressure on advertisers creates a censorship scandal. |
| **MED-05 — Who appears on Republika?** | **P** | The Left chooses full boycott, conditional access, regular engagement or one sacrificial combative spokesperson. | Boycott protects activists and abandons rebuttal; preparation can reach new viewers; repeated outrage appearances make the host—not the party—the agenda setter. |
| **MED-06 — Licence and carriage decision** | **H/P** | A regulator or platform decides terrestrial carriage, channel position or licence renewal under intense partisan scrutiny. | Apply neutral published criteria and judicial review. Manipulation can cripple an outlet briefly and hand it a stronger legitimacy narrative. |
| **MED-07 — Republika professionalises** | **H/P** | Talent, distribution and money allow broader news programming beyond core grievance content. | It reaches softer PiS and anti-government viewers; assuming every appearance is fringe becomes strategically disastrous. Internal conflict can emerge between newsroom and activist brand. |
| **MED-08 — The false border story** | **P** | An explosive claim about a migrant, soldier or activist spreads before verification. | Rapid evidence, uncertainty and victim protection can contain it. A false categorical denial becomes more damaging if any part proves true. |
| **MED-09 — A Stanowski invitation** | **H/P** | Kanał Zero offers a long interview during a leadership, policy or scandal moment. Select messenger, disclosure level and preparation time—or refuse. | A competent answer reaches news avoiders; evasion becomes a distributed clip and can trigger a caucus challenge over communications strategy. |
| **MED-10 — Stanowski runs** | **H/N** | Treat the 2025 media candidacy as satire, a legitimate campaign, an anti-system threat or an opportunity for debate. | Dismissal validates the outsider frame; engagement tests politicians outside party-controlled formats. His result increases creator leverage without creating a stable party. |
| **MED-11 — Candidate becomes broadcaster** | **H/P** | Kanał Zero expands into a news site and television while Stanowski's own political recognition remains high. | Access to presidents and ministers increases agenda power; conventional broadcasters recruit creators or attack unequal standards. |
| **MED-12 — Duda gets a programme** | **H/P** | The former president accepts a regular show or creator-platform role. The Left can appear, boycott, challenge his record or try to regulate conflicts. | Duda gains a post-PiS audience and can arbitrate the succession without joining party structures. A successful programme makes “independent Duda” materially more plausible. |
| **MED-13 — Build the party studio** | **P** | Invest a year's communications budget in video, podcast and rapid-response production. | Speed and message discipline improve; if the same money is removed from local offices, the content reaches only existing urban supporters and strengthens factional patronage. |
| **MED-14 — A network, not a station** | **P** | Fund training, disclosed creator contracts, local correspondents, experts and shared production instead of one large outlet. | Slower attention growth and greater reach resilience. Independent creators may criticise the party or endorse rivals. |
| **MED-15 — The Left newsroom proposal** | **P** | Create a subscription/co-operative newsroom with an arm's-length charter, or an openly party-owned publication. | Independence improves external trust and removes message control; party ownership guarantees access and imposes a low credibility ceiling. Hidden ambiguity is the worst outcome. |
| **MED-16 — Independent investigation hurts the Left** | **P** | A supported or friendly outlet uncovers patronage, harassment or procurement abuse by a Left minister. | Accept the investigation and act, pressure editors, cut funding, or discredit the reporter. Respect proves independence; retaliation destroys the entire ecosystem investment. |
| **MED-17 — Movement channel rejects discipline** | **P** | Feminist, labour, LGBT+ or tenant organisers publicly reject a coalition compromise. | Dialogue and visible policy correction can preserve trusted messengers. Demanding loyalty confirms that the party was attempting capture. |
| **MED-18 — The star outgrows the party** | **P** | A young progressive spokesperson or creator develops more personal reach than the leadership. | Promote, rotate, bind with office, tolerate independence or orchestrate scandal. Suppression can produce a splinter; dependence creates a single point of failure. |
| **MED-19 — Local newsroom collapse** | **P** | A regional outlet closes or is bought by an aligned commercial/state network. | Transparent local-media support and municipal-advertising rules build pluralism; a friendly takeover wins coverage and creates a patronage file for the next government. |
| **MED-20 — Public broadcaster funding vote** | **P** | Stable licence/tax/budget funding collides with the annual coalition budget. | Independence requires predictable money; annual discretionary subsidy turns editors into coalition hostages and gives PSL another exit threat. |
| **MED-21 — Public-media charter** | **P** | Government, president and opposition negotiate board appointment, protected terms, audit and political-balance rules. | A supermajority bargain can survive power change; dividing board seats among parties merely constitutionalises patronage. |
| **MED-22 — Debate exclusion** | **P** | A broadcaster or platform excludes a Left splinter, Braun/KKP or creator candidate using disputed thresholds. | Defend general access rules even for hostile actors, litigate, or exploit exclusion. Inconsistent principles return in the next election. |
| **MED-23 — Platform algorithm shock** | **P** | Search/social recommendation changes suddenly reduce political reach or favour confrontational short video. | Owned mailing lists and cross-platform production provide resilience; chasing the algorithm can hollow out policy credibility and empower internal provocateurs. |
| **MED-24 — Coordinated harassment** | **H/P** | A woman, trans candidate, racialised activist or journalist receives threats after a broadcast. | Security, evidence preservation, platform action and non-amplifying rebuttal protect the target. Silence improves message discipline only by driving people out of politics. |
| **MED-25 — Deepfake before voting** | **P** | Convincing fabricated audio/video alleges corruption, insult or foreign dependence. | Pre-built verification relationships and rapid publication of originals matter. Censorship panic, a false accusation of fakery, or slow coalition sign-off magnifies damage. |
| **MED-26 — Election-night parallel realities** | **P** | Public media, Republika and creator streams frame an uncertain count in incompatible ways. | Joint publication of precinct data and cross-outlet standards preserves legitimacy; leaders declaring victory early can activate the disputed-result chains. |

## National and international shock ledger

These are scenario seeds, not predictions. Where the underlying event is
historical, its consequence can still diverge.

| ID | Label | Shock and immediate choices | Political directions |
| --- | --- | --- | --- |
| **SHK-01 — Belarus border surge** | **H/P** | Emergency powers, humanitarian corridor, Frontex/EU assistance, pushbacks, press access. | Security credibility versus rights; PSL/PiS/Konfederacja pressure; division inside the Left. |
| **SHK-02 — Russian invasion** | **H** | Arms, refugees, sanctions, social support and defence budget. | Razem/Atlanticist solidarity, pacifist dissent, cost-of-living politics and far-right Ukraine scepticism. |
| **SHK-03 — Przewodów escalation** | **N/P** | Verify before attribution, call NATO consultations, communicate uncertainty or retaliate rhetorically. | Responsible de-escalation, alliance trust, panic or accidental entry into war. |
| **SHK-04 — Direct Russian strike** | **E** | Missile/drone intentionally hits Polish territory. | Article 4/5 consultation, mobilisation, unity cabinet or blame crisis; foreign and military relations accumulated earlier govern options. |
| **SHK-05 — Ukraine ceasefire** | **P** | Support deal, demand guarantees, prepare reconstruction and refugee choices. | Defence spending dispute, return/integration of Ukrainians, business opportunity and accusations of betrayal. |
| **SHK-06 — Ukraine battlefield collapse** | **E** | New refugee wave, eastern reinforcement and emergency EU/NATO diplomacy. | National unity or far-right surge; social services and housing capacity become security assets. |
| **SHK-07 — Polish–Ukrainian grain war** | **H/P** | Embargo, transit controls, compensation, WTO/EU negotiation. | PSL strength, rural protest, alliance damage and Russian disinformation. |
| **SHK-08 — US retrenchment** | **P** | Trump administration reduces commitment or conditions it on spending/policy. | Sikorski/Atlanticists seek repair, European autonomy gains force, PiS/Nawrocki claim privileged ties, Czarzasty risks diplomatic crisis. |
| **SHK-09 — US–Marshal rupture** | **H/N** | Ambassador breaks contact after a Trump dispute. Apologise, stand firm, let government bypass the Marshal or seek parliamentary statement. | Left base pride versus coalition/defence concern; can challenge Czarzasty's leadership. |
| **SHK-10 — NATO spending shock** | **P** | Defence demand collides with health, housing and climate budgets. | New taxes, debt, cuts or procurement localisation; labour can support industrial jobs while opposing austerity. |
| **SHK-11 — EU migration-pact deadline** | **P** | Implement, seek exemption, suspend asylum or join resistance with right governments. | KO–Left rights conflict, PSL conservative leverage and EU-law consequences. |
| **SHK-12 — EU funds suspended again** | **P** | Judicial backsliding, procurement scandal or missed KPO milestones pauses money. | Cabinet blame game, investment cuts and pressure on labour reforms tied to milestones. |
| **SHK-13 — German recession** | **P** | Export/manufacturing downturn hits Polish industry. | Wage support, industrial policy, anti-German politics, unemployment and conflict over EU fiscal rules. |
| **SHK-14 — European far-right wave** | **H/P** | Elections in major EU states weaken climate, migration and Ukraine consensus. | Konfederacja/KKP legitimacy, KO's “European firewall,” Left debate over social versus moral anti-fascism. |
| **SHK-15 — Gaza war splits the coalition** | **H/P** | Recognition, arms/trade policy, campus protest and antisemitism/Islamophobia responses. | Wiosna/Razem/KO foreign-policy divides; Braun exploits scandal; Jewish and Muslim safety become substantive policy. |
| **SHK-16 — New pandemic** | **P/E** | Early border/testing/vaccine decisions occur under the memory of COVID. | Previous health investment and trust determine compliance; anti-system actors begin stronger than in 2020. |
| **SHK-17 — Oder repeats** | **H/P** | Second pollution event reveals whether monitoring and cross-border warning improved. | A repeat after ignored reform becomes minister-ending; fast response can validate green governance. |
| **SHK-18 — Hundred-year flood** | **H/P** | Evacuation, emergency status, compensation and dam/retention controversy. | Competence, local-government relations and climate adaptation; reconstruction corruption can become a later scandal. |
| **SHK-19 — Coal-region revolt** | **P** | Mine closure schedule and electricity prices mobilise Silesia. | Just-transition jobs and union bargain, postponement, repression or nationalist takeover of the protests. |
| **SHK-20 — Energy price spike** | **H/P** | Russian war, gas/oil shock or carbon price drives bills. | Price caps, windfall tax, coal revival, nuclear acceleration or austerity; each rearranges KO–Left–PSL relations. |
| **SHK-21 — National blackout/cyberattack** | **P** | Grid or public services fail amid suspected foreign sabotage. | Emergency powers, attribution, infrastructure spending and surveillance; wrongful attribution can be catastrophic. |
| **SHK-22 — Rail or arms-logistics sabotage** | **P** | Ukraine supply route attacked. | Secrecy versus transparency, Russian attribution, civil-liberty safeguards and NATO consultation. |
| **SHK-23 — Constitutional-court collision** | **P** | Court invalidates a flagship equality, judiciary or labour law while government disputes the court's composition. | Obey, ignore, repass, seek EU judgment or negotiate; every choice spends rule-of-law credibility. |
| **SHK-24 — Presidential incapacity** | **E** | Sudden incapacity makes the Marshal acting head of state under disputed conditions. | Czarzasty/Hołownia legitimacy, early election timing and coalition control of two institutions. |
| **SHK-25 — Death or incapacity of a party leader** | **P** | Tusk, Kaczyński, Czarzasty, Kosiniak-Kamysz or another central broker suddenly leaves. | Use dynamic succession fields, not a fixed heir; organisations, offices and relationships accumulated earlier decide. |
| **SHK-26 — Early parliamentary election** | **P** | Failed budget, constructive no confidence failure or coalition exit ends the term. | Threshold panic creates common lists; president, Marshal and caretaker cabinet influence timing and fairness. |
| **SHK-27 — Political violence** | **P/E** | Attack on party office, candidate or minority site. | Joint condemnation, security response, opportunistic blame or spiral. Prior rhetoric and extremist organisation determine escalation. |
| **SHK-28 — Major corruption file** | **P** | EU funds, reconstruction, defence procurement or state company contracts implicate a coalition party. | Independent investigation, sacrificed minister, cover-up, coalition withdrawal or early election. |

## Compound chains worth prioritising

These combinations can support long arcs of the kind used by the inherited mod.

### 1. The Marshal's bargain

1. Presidential defeat weakens the government.
2. Hołownia demands a rewritten coalition agreement and meets PiS.
3. PSL separately demands a conservative/rural protocol.
4. The Left insists that Czarzasty receive the promised Marshal rotation.
5. Hołownia resigns unconditionally, resigns for a price, refuses, or tries to
   assemble an alternate majority.
6. The vote can elect Czarzasty, a compromise PSL candidate, an opposition
   Marshal or nobody.
7. Agenda control then affects the budget, investigations and confidence vote.

The important resource is not “coalition unity” alone. It is the relationship
of each party with Hołownia, Czarzasty, PSL and the opposition, plus whether an
alternate premier has 231 committed votes.

### 2. The Braun legal chain

1. Provocation creates public outrage but also a loyal audience.
2. Prosecutors collect evidence; parliament/EP considers immunity.
3. Braun appears, ignores summonses, or leaves the country.
4. Forced appearance can be professional, fail procedurally or meet organised
   resistance.
5. Charge, trial and appeal are separated by enough time for elections.
6. Conviction, acquittal and delay create different KKP successions.
7. Konfederacja chooses continued distance or a tactical reunion.

This should use the inherited `deport_hitler` logic: enforcement outcome depends
on legal preparation and institutional capacity, not on the player's desire to
remove an opponent.

### 3. The PSL ratchet

1. PSL defeats a progressive bill but stays in government.
2. The Left retaliates on an agrarian or budget priority.
3. Farm protests reduce PSL polling anyway.
4. PiS/Morawiecki privately offers a safe list and conservative protocol.
5. PSL issues a portfolio ultimatum.
6. A concession preserves the cabinet but makes Razem/Wiosna revolt; refusal
   produces exit or a confidence vote.
7. The final right partnership can still fail because the personnel and policy
   guarantees are unacceptable.

This is the closest Polish analogue to the mod's toleration/cabinet chains.

### 4. The left succession

1. Government delivers labour benefits but fails on abortion/equality.
2. Zandberg beats the government-left presidential candidate.
3. Czarzasty gains the Marshal office and centralises Nowa Lewica.
4. Old guard, labour-renewal, Wiosna/progressive and Razem-reconciliation
   candidates build distinct assets.
5. A scandal, retirement or election loss opens the contest.
6. Losing factions accept posts, demand primaries, defect or create a common
   list with outsiders.

The leader should emerge from prior delivery and faction strength; the game
should not present five names with identical chances.

### 5. The PiS succession and right realignment

1. Kaczyński's attempt to suppress associations produces or prevents the
   Morawiecki rupture.
2. Szydło, Czarnek, apparatus and presidential currents decide whether to
   remain neutral.
3. Konfederacja competes for first place on the right.
4. PSL tests which successor can make an acceptable coalition offer.
5. A common list, multiple lists or a presidential movement results.
6. Only after the election do arithmetic, prime-minister choice and Braun's
   status determine whether a right government is actually possible.

### 6. From partnership compromise to marriage

1. The Left negotiates the closest-person bill with PSL.
2. President vetoes it.
3. CJEU requires recognition of foreign EU same-sex marriages.
4. Government chooses full compliance, minimal compliance or delay.
5. A presidential/Sejm election changes the veto structure.
6. Activists demand civil partnership or equal marriage; PSL offers another
   narrow compromise.
7. A statute passes, fails inside coalition, dies at the president, or survives
   court review.

Every stage can deliver practical rights; none should be treated as an
automatic linear march.

### 7. The Palace–Tribunal trap

1. The government prepares a Tribunal reset without consulting Duda.
2. Duda refers it preventively to the very Tribunal whose composition the bill
   contests.
3. Coalition militants demand non-recognition; lawyers and European partners
   demand a narrower transition.
4. Waiting for a new president loses terms, judgments and public patience.
5. A flagship abortion, equality or labour law then reaches a contested panel.
6. Government can accept an adverse judgment, reject it consistently, apply
   only the useful parts, or seek a negotiated resignations/appointments deal.
7. The eventual settlement is judged by legal certainty and court service as
   well as how many PiS-era officeholders remain.

This chain makes courting Duda issue-specific. His welfare or defence signature
does not imply consent to dismantling judicial arrangements he helped create.

### 8. The border permission spiral

1. Belarus engineers a new surge and an officer or migrant is seriously hurt.
2. Coalition leaders compete to demonstrate firmness before evidence is clear.
3. Wider force authority and access restrictions improve unit confidence but
   conceal individual misconduct.
4. Republika, creator channels and party accounts circulate incompatible
   footage; foreign manipulation mixes with authentic local grievances.
5. Hate incidents rise against people unconnected to the crossing.
6. The Left chooses a security-only pivot, a rights-only denunciation, or a
   joint operational doctrine with officers, lawyers, medics and border towns.
7. The result changes service trust, crossings, minority safety and far-right
   agenda dominance separately.

### 9. Duda's third act

1. Late-term vetoes and signatures establish that Duda is PiS-aligned but not
   subject to ordinary party discipline.
2. He leaves office with advisers, legacy and foreign contacts but without a
   parliamentary machine.
3. A regular media programme provides agenda access and a personal audience.
4. PiS succession candidates seek his endorsement; the apparatus resists a
   Palace/media current it cannot control.
5. Duda backs Szydło or Morawiecki, remains an arbiter, builds a movement, or
   fails to convert recognition into candidates.
6. A successful intervention rearranges the right; an unsuccessful one exposes
   how little organisational independence the presidency created.

### 10. The women's-movement reckoning

1. The 2016 victory creates organiser capacity and expectations.
2. The 2020 Tribunal ruling produces a broader strike, repression and a more
   radical programme without immediate legal success.
3. Preventable deaths and annual marches keep the network alive between
   elections.
4. The 2023 coalition promises reform; PSL defeats or delays the decisive bill.
5. Clinical guidance and legal aid save access but do not satisfy the promise.
6. Activists demand a deadline, candidate places or exit from government.
7. The Left can win a statute, preserve an autonomous movement through honest
   partial delivery, capture and fracture it, or leave office with credibility
   but no law.

## Guardrails for later writing

- Do not portray PSL as “secretly PiS.” Give it material rural interests,
  conservative voters, offices, local structures and survival logic.
- Do not portray the SLD old guard as economically right-wing merely because it
  is socially cautious.
- Do not make Razem's only action “leave.” It can set milestones, organise
  pressure, vote issue by issue, take a ministry, win a primary or lose an
  internal argument.
- Do not use LGBT+ and trans people only as controversy generators. Include
  administrative rights, safety, healthcare, candidate protection and ordinary
  policy delivery.
- Do not collapse detention, arrest, remand, conviction and imprisonment into
  one Braun event.
- Do not assume a friendly president eliminates PSL, court or budget veto
  points.
- Do not let a party split transfer every MP, member and voter at the same
  percentage. Parliamentary clubs, legal registration, local branches, money
  and electorate should resolve separately.
- Do not make every international shock a right-wing bonus. Competent public
  provision, labour protection, alliance management and humanitarian policy can
  strengthen the Left.
- Keep counterfactual content clearly labelled in future documentation and
  scenes; it must never be cited as historical fact.

## Research still needed before implementation

- named Nowa Lewica regional organisers and factional loyalties;
- union landscape beyond ZNP: OPZZ, Solidarność, FZZ and sectoral unions;
- PSL regional barons, local-government networks and leadership alternatives;
- the exact membership of PiS/Rozwój Plus and other 2026 associations after the
  cutoff;
- roll calls on abortion, partnership, migration, labour and confidence votes;
- public-opinion time series for church, LGBT+, Ukraine, migration and labour;
- budget costings and responsible ministries for every distributive promise;
- constitutional procedure for acting presidency, early election and dismissal
  of the Marshal;
- organisations representing feminist, LGBT+, trans, housing, disability,
  refugee and rural interests;
- a month-by-month COVID policy/mortality/vaccination chronology;
- local and European elections as sources of candidate-list conflict;
- international branches tied to dated scenarios rather than generic random
  events.

Before any `.scene.dry` work, the best candidates should receive a second,
implementation-shaped ledger with: exact date window, actor availability,
preconditions, visible choices, hidden checks, immediate effects, delayed scene
IDs, cancellation conditions and sources.
