# Media ecosystem and communications minigame

Last researched: **8 August 2026**.

Status: **research and design only**, apart from the implemented press-review
presentation scaffold. The historical baseline is sourced; proposed mechanics
and alternate events are not predictions or implemented code. Related chains are collected in
[SCENARIO_LEDGER.md](SCENARIO_LEDGER.md#the-media-ecosystem) and dated events
remain in [POLITICAL_TIMELINE.md](POLITICAL_TIMELINE.md).

## Historical baseline

Polish media should not be represented by a single “free versus controlled”
slider. It is a fragmented attention market in which television still has
large reach, online video and social platforms increasingly set the daily
agenda, audiences sort themselves by political identity, and the formal
independence of an outlet does not make its reporting politically neutral.

Three developments define the starting position:

1. **Public media became an electoral actor.** ODIHR found that TVP provided
   PiS with a clear advantage in the 2023 parliamentary campaign and was
   openly hostile towards KO. The post-election government's rapid replacement
   of public-media management then created its own dispute over legality,
   procedure and funding rather than simply restoring a neutral status quo.
   ([ODIHR 2023 election report](https://odihr.osce.org/sites/default/files/f/documents/3/d/553978.pdf);
   [ODIHR 2025 presidential-election report](https://www.osce.org/files/f/documents/2/b/599685_0.pdf))
2. **The conservative audience and workforce migrated.** The 2025 ODIHR report
   recorded that roughly eighty former TVP journalists had moved to Republika
   and wPolsce24. Reuters Institute described Republika as one of Poland's four
   largest television channels in 2025; Nielsen measured its share across TV
   and online video rising from 3.24% in 2024 to 5.23% in 2025.
   ([Reuters Institute, Poland 2026](https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2026/poland);
   [Nielsen All Screens Video Landscape](https://www.nielsen.com/pl/news-center/2026/nielsens-all-screens-video-landscape-report-reveals-shift-in-polish-media-rankings-and-deeper-audience-engagement/))
3. **Creator-led political media became a first-class institution.** Krzysztof
   Stanowski launched Kanał Zero in February 2024, ran for president in 2025
   and won 243,479 votes (1.24%), then extended the brand into a news site and
   television service. This is not equivalent to founding a conventional
   party newspaper: the product is personality, confrontation, entertainment,
   interviews and the claim of independence from every party.
   ([Reuters Institute, Poland 2025](https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/poland);
   [ODIHR 2025 report](https://www.osce.org/files/f/documents/2/b/599685_0.pdf))

The statement that Lewica lacks a comparable media ecosystem is a **scenario
design inference**, not a claim that there are no left-wing journalists,
outlets, creators or sympathetic audiences. It means that the playable Left
begins without a large, loyal and cross-format network capable of:

- reaching beyond already convinced voters every day;
- moving an issue from specialist reporting into the national agenda;
- producing rapid video, live interviews and local stories at the same time;
- protecting a politician through a hostile news cycle without suppressing
  legitimate criticism;
- developing recognisable presenters, reporters and expert voices;
- surviving a party subsidy loss, advertiser retreat or platform change.

That deficit should be painful and expensive to repair. It should not be solved
by pressing “create left-wing TV.”

## Reach is not support

Each outlet or creator has a record rather than a party colour:

| Field | Meaning |
| --- | --- |
| `audience_by_segment` | Who actually encounters it: age, education, town size, region, class position and political consideration set. |
| `attention_power` | Ability to make other journalists and politicians discuss a story. |
| `trust_by_segment` | Whether an audience believes the outlet, not whether it watches for entertainment or outrage. |
| `access` | Willingness to invite the Left, take its questions or use its experts. |
| `editorial_distance` | Independence from the government, opposition parties, owners, donors and star presenters. |
| `format_strength` | Live television, long interview, short video, investigation, local news, radio, newsletter or policy analysis. |
| `talent` | Reporters, producers, editors, presenters, lawyers, researchers and technical staff. |
| `financial_resilience` | Mix of advertising, subscription, donations, public funds, wealthy owners and party money. |
| `distribution_resilience` | Terrestrial carriage, cable, website, applications, social platforms, search and mailing lists. |
| `legal_exposure` | Defamation cases, regulator decisions, licensing, source protection and ownership disputes. |
| `relationship` | Current institutional relationship with the player, which may vary by newsroom, programme and host. |

A hostile outlet can have high access because conflict attracts viewers. A
friendly activist account can have high trust and almost no reach outside the
Left. Republika viewers are not automatically PiS voters, Kanał Zero viewers
are not automatically Stanowski voters, and appearing on TVN is not equivalent
to gaining a KO endorsement.

## The media map

The exact brands and personalities change, but the scenario needs stable actor
types:

| Actor | Strategic value | Characteristic danger |
| --- | --- | --- |
| Public television and radio | Universal-service capacity, regional network, live state communication and large inherited recognition. | Government capture, legally disputed appointments, unstable funding and another purge after power changes. |
| Commercial television | National reach, professional newsrooms, debates and agenda power. | Owner priorities, compressed formats and a tendency to centre the KO–PiS conflict. |
| Republika and adjacent conservative outlets | Loyal audience, activist energy, transferred talent and rapid opposition framing. | Normalisation of false or dehumanising claims, access boycotts, advertiser controversy and a self-reinforcing grievance economy. |
| Kanał Zero and personality-led video | Young and politically mixed attention, long interviews, spectacle and agenda-setting clips. | The host controls the frame; entertainment incentives reward conflict, ambiguity and humiliation more than policy delivery. |
| Newspapers, weeklies and digital newsrooms | Investigations, elite agenda and policy detail. | Smaller mass reach, paywalls, weak finances and dependence on stories being amplified elsewhere. |
| Local and regional media | Trust, constituency problems and a route around Warsaw polarisation. | Consolidation, municipal advertising pressure, newsroom closures and very uneven quality. |
| Radio and podcasts | Habitual reach, commuting audience, intimacy and long-form explanation. | Fragmented measurement and limited visual virality. |
| Social platforms and search | Cheap initial distribution and fast mobilisation. | Algorithm shifts, harassment, manipulation, context collapse and dependence on foreign firms. |
| Civil-society, union and movement channels | Trusted messengers on work, abortion, housing, health and minority rights. | They are not party property; attempted capture destroys the credibility the player needs. |
| Party-owned channels | Guaranteed message discipline and volunteer conversion. | Low external trust, subsidy dependence and propaganda incentives. |

No player should be able to purchase editorial obedience from an independent
outlet. Investments can buy staff, training, production, advertising, events or
a genuinely disclosed party channel. Relationships buy a fair hearing, not a
guaranteed headline.

## Press-review rail: staged implementation

The desktop interface reserves the right rail for **two or three outlet voices
per political month**. It rotates source-labelled slots from Onet, WP,
Rzeczpospolita, TVP, TVN and Republika, with Kanał Zero joining from February
2024. The selection is deterministic for a given turn so opening a card or
changing a ledger tab does not make the press cycle flicker. The former
Objectives panel remains available as the second right-rail tab. Every playable
month from October 2019 through August 2026 has a contemporaneous report with
its source link and date. Authored monthly reports cover every slot through the
October 2027 scenario horizon.
When a month contains a contemporaneous real report, one sourced item is always
reserved in the visible edition; authored reactions to the latest outcome fill
the remaining slots before monthly copy. A live `news_headline` fallback covers
outcomes without an authored slot, while public-opinion support and backlash
enter one analysis-oriented report only when its subject actually concerns the
matching issue field. The same polling sentence is never appended to every
outlet in an edition. Real-source coverage stops in 2026: reports in the 2027
scenario cannot truthfully be attributed to future outlet pages.

## The Wiadomości chyron

While PiS holds public media the TVP slot is presented as the evening bulletin
rather than as a wire report. The card is labelled `WIADOMOŚCI · TVP INFO` and
carries a two-line **pasek**: a red all-caps banner over a narrower yellow
strip. Both lines are generated from live state rather than written per month,
and each does a different job.

For as long as PiS holds the cabinet the pasek is a standing fixture of the
rail rather than something the player meets only when TVP happens to rotate
into the edition. A labelled band sits directly under the panel heading and
stays stuck there while the rail scrolls, so the bulletin's line on the
player's last action is on screen every month of the PiS years whatever else
the press review is showing. It is painted on the opaque content background
rather than the translucent surface token, because it scrolls over the cards
beneath it. The band follows the month's own `news_headline`, and it is the
bulletin's only chyron: while it is up the TVP card carries no banner of its
own. When the cabinet changes hands the band disappears and the card falls back
to the patron rule, so a PiS-held broadcaster under somebody else's government
still runs a banner on its own card without the panel-wide fixture.

The red banner is chosen in three stages.

**Authored outcomes come first.** Fifty-seven moments with a recognisable
historical shape carry a banner and strip written for them alone, matched on
the outcome text exactly: the audit chamber crisis and the government's attempt
to remove its own auditor, the contest for the Marshal's chair and the
vice-marshal ballots, the ventilator contract, Czajka and the capital's sewage,
Pegasus and the Senate surveillance commission, the John Paul II resolution,
the constructive motion against Morawiecki, the absorption of Suwerenna Polska,
the fur-farm ban, the presidential primary and the 2025 runoff. Nothing general
can override these, which is the point: the distinctive months of the scenario
were previously being swallowed by broad frames.

**Then fifty-six subject frames**, each with four banner lines, matched on the
displayed headline and standfirst: the audit chamber, the Marshal and the
presidium, the Senate, surveillance, scandal and contracts, national symbols
and Independence Day, climate direct action, rivers and pollution, the centrist
parties, communism and decommunisation, public ownership, recovery funds and the
EU, German influence, foreign policy, the courts, prosecutions, the presidency,
referendums, visas, fuel prices, the border, migration, Ukraine, the army, the
police, the pandemic, the health service, transfers and care, labour and work
time, housing, energy, infrastructure, abortion, equality, the church, schools,
research, the digital state, public media, the budget, farmers, animals,
inflation, the right's parties, primaries, defections, local government, the
street, party organisation, factions, chosen enemies, the cabinet, coalition
manoeuvre, the opposition bloc and elections. The first match wins, so specific
subjects sit above broad ones. Matching is on whole words: a coalition is not a
coal story and a broad front is not a road programme.

Every fourth rotation the banner drops the subject line for one of the **stock
forms** the record leans on constantly and a plain declarative sentence cannot
reach: the allegation put as a question, the coined label in scare quotes, and
the serial *kolejny* framing that makes each week the next instalment of the
same conspiracy. The interrogative forms stay political rather than criminal —
the game does not put an invented offence to a named person.

The banner also **holds**. Repetition was the practice's loudest habit, so the
line moves on a three-month clock keyed to the subject rather than to the
report: a returning subject keeps its banner for a stretch while the yellow
strip beneath it changes with each story. The studio frame behind the band
moves slower still, once every fourth pasek.

**Then one reflex frame** for everything else, because a bulletin with nothing
to say still runs a banner. `npm run check:paski` walks every `news_headline` in
the scene tree — 2,678 outcomes across cards, hub actions and dated events — and
reports how many land on that reflex frame. It fails above five per cent, fails
if any single frame absorbs more than nine per cent of the corpus, and fails if
a frame becomes unreachable. The corpus currently produces 283 distinct banners
with 3.4 per cent on the reflex lines.

The yellow strip belongs to the subject in an ordinary month — each of the
fifty-seven frames carries six follow-ups of its own, so a housing story and a
courts story do not close on the same line, and a subject the player returns to
does not exhaust its supply. The strip switches to the mood pool only where the
numbers should do the talking: a mobilised backlash, or a campaign month. The
corpus yields 355 distinct yellow strips, and `npm run check:paski` fails below
three hundred.

The mood registers, used for the hot months and as the fallback:

| Register | Condition | What the strip does |
| --- | --- | --- |
| `quiet` | salience below 40 | Fills the gap: government work in the report, the target accused of silence. |
| `alarm` | backlash 62+ with salience 55+ | The emergency line — chaos, an attack on the state, how far will they go. Deepens the banner to crisis red. |
| `threatened` | support for the Left position 60+ | Leaves the subject alone and attacks funding and motive instead. |
| `confident` | support 42 or below | Plays the polling back as a verdict already passed. |
| `contested` | anything else | Routine insinuation: fine print, orders from somewhere, experts who see through it. |
| `campaign` | within four months of a vote | Overrides everything below it. See the campaign register. |

The studio framing sentence in the report body follows the same register, so a
month where the public has moved toward the Left reads visibly differently from
one where it has not. Selection is seeded by turn and date, so reopening a card
does not reshuffle the banner.

### The campaign register

Wiadomości ran its loudest line into a vote, and the scenario reproduces that
shape rather than holding one flat tone for eight years. The banner escalates by
distance to the next election — the Sejm votes of October 2019 and October 2023,
the presidential rounds of 2020 and 2025, and the October 2027 scenario horizon.
Within ten months the register floors at `alarm`; within four months it becomes
`campaign`, which is the deliberate peak: a siren opening bolted onto the subject
banner, a black-and-yellow second strip promising that a vote for the target is a
vote against Poland, and a studio line that has stopped pretending to report.
The run-up to October 2023 is therefore the most aggressive stretch in the game,
which is what the record shows it was.

### The named target and the PiS channel

The target follows the balance of power. Under a PiS cabinet the banner attacks
the total opposition, and names Lewica directly once the Left's polling makes it
a worthwhile target on its own. If a later branch leaves TVP under PiS
management while another cabinet governs — the statutory reform behind the veto
wall, for example — the same machinery turns on the new government instead. When
public media passes to a KO, Left or pluralist board, the banner stops and TVP
reverts to the ordinary patron-driven voice.

A working channel to the governing camp changes who is on screen, not how loud
the bulletin is. Once `pis_relation` reaches 50 **or** `government_negotiation_hostility`
falls to 50 — the same thresholds the negotiation chain already uses to open a
PiS channel — Lewica disappears from the banner entirely and Donald Tusk, the
Tusk camp and KO take its place. Frames whose lines name nobody are dropped in
favour of ones that do, so a spared Left is never the implied subject of its own
smear, and the archive narrows to the captions that were aimed at Tusk and KO.
The campaign register still applies: warm relations in September 2023 produce
the most aggressive anti-Tusk banners in the game, not a quiet month.

### Imported captions

Where the record has a real caption for the subject on screen, the bulletin uses
it instead of an invented one. Fourteen captions broadcast by TVP Wiadomości are
carried verbatim in Polish on the red strip, with an English gloss on the yellow
strip and a `BROADCAST CAPTION` credit linking the source. They are drawn from
[OKO.press's guide to the paski](https://oko.press/jak-tvp-pierze-mozgi-widzom-przewodnik),
[Press.pl's account of how they were written](https://www.press.pl/tresc/51324,glupi-jak-pasek)
and the [Obserwatorium Językowe UW entry on *totalna opozycja*](https://obserwatoriumjezykowe.uw.edu.pl/hasla/totalnaopozycja/).
Each is tagged with the target it was aimed at, so the warm-channel rule applies
to the archive as well. The campaign register always reaches for an archive
caption when one exists for the subject; outside a campaign it appears about a
third of the time.

Two exclusions are deliberate. The ethnic and antisemitic captions in the same
record are not imported, and captions constructed from a described pattern
rather than an attested broadcast are left out: only verbatim, sourced captions
enter the archive. Everything else on the banner is original pastiche, and no
quotation or criminal allegation is invented for a real person.

Authored PiS-era copy already carries the editorial line, so it receives the
banner and nothing else; only live fallback copy also gains the studio framing
sentence.

The first outcome-specific authoring pass adds 162 reports across 58 branches:
the presidential nomination, media strategy, lockdown, rescue shield, abortion
revolt, recovery-fund vote, Belarus border, Ukraine invasion, opposition-list
strategy, the July 2023 Konfederacja surge, visa scandal, referendum, Orlen
pricing and pre-election military-command crisis. Each branch covers every
outlet that rotates into the rail for that month.

The content stage should fill each slot with this small record:

| Field | Purpose |
| --- | --- |
| `outlet_id` | Selects the masthead treatment and editorial voice. |
| `turn` | Campaign month for availability and repeat control. |
| `headline` | Original simulated headline, never copied from the outlet. |
| `text` | An outlet-specific opening followed by a public-mood response. |
| `source_url`, `source_date` | Required only for a contemporaneous real non-political item. |

Copy selection follows a fixed priority: show one contemporaneous sourced item
when the month has one; respond to the latest consequential in-game event in
the remaining slots; otherwise comment on the current political balance. Real
items belong in a checked authoring ledger rather than a live browser request:
the game is static, the campaign date is historical, and a current homepage
would produce the wrong month. The underlying fact or game outcome must stay
recognisable even when the presentation is deliberately lurid.

The shared voice direction is: **write unmistakable pastiche, push clickbait,
conflict and partisan framing as hard as the source character allows, and lead
with the most emotionally or politically loaded interpretation.**
Do not invent quotations, criminal allegations or real-world events. A
counterfactual outcome is reported as part of the simulation; a sourced real
item is paraphrased and keeps its provenance. Media copy refers to Lewica as a
whole; it does not name internal currents other than Razem.

| Outlet voice | Maximum-strength direction for the simulated copy |
| --- | --- |
| **Onet** | Pro-KO digital urgency. A good KO relationship makes Lewica a tolerable democratic partner; a bad one makes it a spoiler, liability or concealed ally of PiS. |
| **WP** | The neutral mass-market option: direct consequence, service information and a strong curiosity gap without a permanent party patron. |
| **Rzeczpospolita** | Centre-right institutional and business analysis: sceptical of Left spending, attentive to legality, cost, enforceability and precedent. |
| **Kanał Zero** | Pro-PiS or pro-Konfederacja confrontation after February 2024. The active patron and its relation to Lewica decide whether the Left is mocked as an enemy or briefly useful against the centre. |
| **TVP** | Pro-government. Under PiS management it runs as *Wiadomości*, leading with a pasek that treats the opposition as a threat to the nation before any reporting begins, at its loudest in the months before a vote and pointed at Tusk rather than Lewica once a PiS channel is open; under a KO-led cabinet it drops the banner, foregrounds KO delivery and treats Lewica according to the live KO relationship. |
| **TVN** | Pro-KO democratic framing. A good KO relationship tolerates Lewica as a partner; a bad one depicts it as an irresponsible obstacle to defeating PiS. |
| **Republika** | Usually pro-PiS, occasionally pro-Konfederacja, and more aggressively partisan than TVP. It presents Lewica as hostile unless the active right patron finds a temporary tactical use for it. |

These are dramatic game voices, not claims that every report or journalist at
an outlet follows a single line. Outlet marks remain typographic labels rather
than copied logos, and all final prose should be original.

## The monthly communications loop

Each political month gives the player fewer communications actions than there
are active crises:

1. **Listen.** Commission polling, social listening, local reports or movement
   consultation. Cheap monitoring is fast and noisy; high-quality research
   takes time.
2. **Choose an agenda.** Select at most two subjects to push. Additional
   messages dilute spokesperson preparation and reduce repetition.
3. **Choose a messenger and format.** A union organiser, doctor, minister,
   affected citizen, expert, mayor and party leader have different credibility.
4. **Prepare.** Fact-check, rehearse hostile questions, collect a local example,
   make a short clip and plan the follow-through.
5. **Place or publish.** Seek an interview, briefing, investigation, rally,
   podcast, local visit, newsletter or owned-media release.
6. **Respond.** Correct an error, defend a target of harassment, withdraw a
   false claim, publish documents, or refuse to feed an outrage cycle.
7. **Evaluate.** Measure awareness, comprehension, trust, volunteer conversion
   and policy movement separately from views.

Breaking events can interrupt the loop. A prepared press room responds within
hours; an unprepared coalition loses the first frame and pays more to reverse
it.

## The story contest

The opinion model does not turn coverage directly into support. Every important
story is resolved through the same contest:

`reach × audience trust × signed frame × messenger credibility × issue salience × Left credibility`

The signed frame records whether the dominant interpretation helps or hurts
the Left; its strength participates in the product. The product then produces
five separate outcomes: **persuasion**, **backlash**, **mobilisation**,
**abstention** and **issue ownership**. A story can therefore mobilise a party
core, increase conservative backlash, lose broader sympathy and produce almost
no persuasion at the same time. None of those outputs substitutes for reach or
for the public's prior attitude toward the issue.

Salience memory decays comparatively quickly. Distrust, backlash and party
reputation recover on slower and deliberately unequal clocks. A corrected
headline can disappear while the belief that a party is incompetent or
opportunistic remains.

For example, a Left minister can obtain huge salience on Republika while the
dominant frame is “coalition chaos.” A movement doctor with smaller reach can
gain enough credibility to change PSL deputies' votes. A viral clip can raise
name recognition while making the candidate less acceptable to every possible
coalition partner.

The first report is not permanent. Documents, a good hostile interview,
independent verification and visible policy delivery can change a frame.
Deletion, denial and attacks on reporters may preserve core supporters while
making recovery with persuadable voters harder.

The PiS-era TVP appearance card treats access as an adversarial exchange, not
endorsement or coalition cooperation. TVP wants ratings, opposition conflict
and proof that the government owns the agenda; Lewica wants an audience it
cannot otherwise reach. A prepared appearance can create bargaining capital, a
poor one loses it, and neither outcome changes who controls public media.

The electorate beneath those stories has seven independent latent attitudes:
acceptance of capitalism and private hierarchy; expectation of welfare
transfers and public services; cultural conservatism; order and threat
sensitivity; universal solidarity; institutional trust; and appetite for
political change. Poland can consequently be capitalist and culturally
conservative while retaining strong expectations of pensions, family benefits
and public healthcare. Welfare expectation is never treated as socialist
identification.

Three long stories demonstrate why the separation matters:

- the pandemic initially increases solidarity and public-health salience, but
  prolonged restriction, insecurity and distrust feed order and anti-system
  channels unless workplace protection and public services have credible Left
  ownership;
- the Women's Strike tracks activist mobilisation, broad sympathy, party
  conversion and conservative backlash separately, so party capture or an
  undisciplined message can grow the core while shrinking the coalition;
- migration separates empathy, border competence, local-service capacity,
  welfare competition and disinformation. Delivery protects solidarity;
  moral rhetoric without administrative capacity can lose the broader frame.

## Building a Left ecosystem

The player has four distinct layers to build:

### 1. Party capacity

A press office, research desk, broadcast studio, clipping service, trained
spokespeople, local press officers and a secure rapid-response channel. This is
openly partisan infrastructure. It improves speed and consistency but has a
credibility ceiling.

### 2. Movement and labour relationships

Long-term cooperation with unions, tenants, feminists, LGBT+ groups, disability
campaigners, climate groups and local associations. These actors retain their
own editorial voice and can publicly oppose the government. Respecting that
autonomy makes their eventual support valuable.

### 3. Independent media supply

Training, transparent subscriptions, cultural grants with arm's-length
governance, local-media support, access to public data and strong source
protection can improve pluralism without creating a party newspaper. A hidden
subsidy or patronage appointment turns the investment into a scandal.

### 4. Recognisable creators

Policy explainers, entertainers, podcasters and local correspondents need years
to build an audience. They may later criticise the Left, endorse another party
or refuse campaign coordination. That independence is the reason their
endorsement can reach beyond party loyalists.

An ecosystem recovery therefore consumes money, senior attention and scarce
talent over several budgets. Its early returns are better crisis handling and
local coverage, not an immediate polling bonus.

## Investment ladder

| Stage | Investment | Likely return | Failure mode |
| --- | --- | --- | --- |
| **0 — Reactive office** | One central press team and leader accounts. | Basic statements and campaign logistics. | Every ministry freelances; stories are answered after the frame has settled. |
| **1 — Professional network** | Research, monitoring, media training and local coordinators. | Fewer avoidable errors; credible regional spokespeople. | Barons turn jobs into factional patronage. |
| **2 — Format capacity** | Studio, video team, podcast, newsletter and field production. | Regular content and reusable explainers. | Expensive party content circulates only among existing supporters. |
| **3 — Social infrastructure** | Durable relationships with movements, unions, experts and civic media. | Trusted third-party messengers and candidate pipeline. | Party capture produces public resignations and loss of movement autonomy. |
| **4 — Plural ecosystem** | Independent subscription outlets, local reporting, cultural production and creator network. | Agenda power beyond election periods and resilience after leaving office. | Undisclosed finance, editorial interference or overexpansion destroys trust. |

The annual budget can fund staff and institutions, but credibility cannot be
bought in December and delivered in January.

## Republika: opposition broadcaster, not a support counter

Republika's rise should be an event chain with several causes:

- migration of recognisable TVP staff and audiences after December 2023;
- conservative demand for a permanent opposition broadcaster;
- donations, subscriptions, advertising and distribution agreements;
- exclusive access to right-wing politicians;
- controversies that repel advertisers but strengthen the persecution frame;
- professionalisation sufficient to compete for ordinary news viewers.

In January 2024 several large advertisers withdrew after offensive remarks
aired by the station. That can be modelled as a genuine commercial and ethical
crisis without assuming the station disappears: audience donations, sympathetic
businesses and political grievance can offset a boycott.
([Associated Press](https://apnews.com/article/1df312136f8972999161a2199993022f))

The Left has four recurring choices:

- **full boycott** — denies normal access and pleases activists, but leaves
  accusations unanswered and may make exclusion part of Republika's brand;
- **conditional access** — appear with prepared spokespeople while refusing
  programmes or hosts that cross specified standards;
- **open engagement** — maximise reach and normalisation, accepting hostile
  clips and factional criticism;
- **regulatory retaliation** — potentially unlawful or self-defeating unless
  based on neutral, reviewable rules applied to every broadcaster.

Regulator decisions, state advertising and press access must use general rules.
Punishing a hostile line gives the right a durable victim narrative and creates
tools a future government can use against the Left.

## Stanowski and the personality-media challenge

Stanowski should be a recurring independent actor, not assigned to the right,
centre or anti-system camp once and for all. His power comes from:

- the ability to invite a politician into a long, apparently informal format;
- strong personal control over topic, pacing, editing and follow-up clips;
- an audience that includes people avoiding traditional political news;
- entertainment value in exposing an evasive answer or campaign absurdity;
- enough political ambiguity to interview, ridicule or validate actors from
  several camps;
- demonstrated capacity to turn media recognition into an electoral candidacy.

An invitation creates a preparation event. The player chooses a policy expert,
combative factional figure, relatable outsider or senior leader; reveals full
documents or keeps coalition negotiations private; accepts a long interview or
demands a shorter format. A strong performance can reach new voters. A weak
performance becomes a week of derivative clips across every rival outlet.

The player must never receive a permanent “Stanowski endorsement” merely by
being charming. The durable rewards are demonstrated competence, willingness
to answer, a relationship that keeps invitations open, and access to an
audience. His own presidential run should sharpen his independence and make
party attempts to co-opt him more visible.

## Public media is a governance problem

The public-media track needs at least six separate variables:

- legal security of boards and appointments;
- editorial independence;
- political balance and treatment of government/opposition;
- stable funding;
- regional and public-service capacity;
- audience trust by political segment.

Changing management can improve one and damage another. The government may
gain friendlier coverage while losing legal security and half the audience.
Waiting for a statute may preserve procedure while leaving an openly partisan
news operation in place. A durable settlement requires transparent
appointments, protected terms, reviewable standards, stable funding and a
credible transition for staff—not merely a new list of presenters.

Government communication and public broadcasting must also stay distinct. A
minister has a right to explain policy and answer questions; the newsroom must
retain the ability to challenge the minister and lead with a government
failure.

## Media, hate and personal safety

The media system connects directly to the border and minority-safety systems.
Do not turn racism into a generic “polarisation” penalty. Track:

- frequency and prominence of dehumanising frames;
- organised harassment capacity;
- targeted threats against refugees, Ukrainians, Jews, Muslims, LGBT+ people,
  women activists and racialised politicians;
- newsroom and platform moderation;
- police response, reporting confidence and prosecution quality;
- elite rebuttal or repetition across parties.

Repeating a false claim to condemn it can still increase its reach. Silence can
abandon the target and let the false frame settle. Effective response combines
a trusted messenger, verified facts, protection for the target, consequences
for threats and a positive account of equal citizenship.

## Resource and faction effects

Media choices redistribute power inside the Left:

- old organisational networks favour dependable party channels, local offices
  and disciplined spokespeople;
- younger progressive politicians often perform better in rapid social and
  culture-war formats but face gendered harassment;
- Wiosna-derived networks may prioritise creator, culture and equality media;
- Razem may possess strong long-form and activist communication while rejecting
  coalition message discipline;
- ministers want delivery coverage; parliamentary rebels gain attention by
  breaking the agreed line;
- local leaders resent a Warsaw studio that consumes money without covering
  municipal work.

Spokesperson prominence should increase personal following and succession
power. The party may solve its attention deficit by creating a leader it can no
longer control.

## Success and failure

The minigame is won neither by controlling every outlet nor by eliminating
hostile coverage. A successful Left can:

- get its account into the first news cycle;
- reach voters beyond its core through several independent messengers;
- survive one hostile interview or internal leak without message collapse;
- maintain a trusted local, labour and movement network while governing;
- correct falsehoods without making censorship the story;
- leave public media more independent than it found them;
- sustain communications capacity after losing office.

Failure can take several forms: an inward-facing propaganda bubble; dependence
on one charismatic creator; public-media capture followed by a purge; a donor
or patronage scandal; constant defensive reaction to Republika; movement
estrangement; or high online reach with no electoral conversion.

This is intentionally a long and costly game. The reward is not immunity from
bad news. It is the ability to contest what bad news means.
