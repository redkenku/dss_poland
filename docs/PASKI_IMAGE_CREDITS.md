# Wiadomości band image credits

The studio frames in `out/html/img/paski/` sit above the two-line pasek in the
press-review rail while PiS holds the cabinet. They are screen captures of
*Wiadomości* and adjacent TVP Info and wPolsce24 programming, contributed to
this repository rather than sourced from a free-media archive. No generative
image tools were used.

## Status

**These are not freely licensed images.** Copyright in the broadcasts remains
with the broadcaster and is not replaced by the repository's MIT license.
They are used here to document the visual grammar of a programme the scenario
depicts and criticises. Anyone redistributing this build should satisfy
themselves that the use is defensible in their jurisdiction, or replace the
directory with material they hold rights to; the band degrades cleanly to its
text-only form if the files are absent.

## Presentation rules

The images are backdrops, not portraits. Every frame is cropped to a 4.2rem
strip, desaturated and darkened before the red banner is drawn beneath it, so
the band reads as the bulletin rather than as an attribution to the presenter
on screen. This matters because the captions the game writes are invented: a
simulated smear must never look like something a real, named journalist said.
For the same reason the band never names a presenter, and the alt text
describes the setting only.

## The altered Tusk frame

`pasek15.png` shows Donald Tusk with horns added. It is in the rotation because
the alteration is the broadcaster's own: the graphic went out on air, which
makes it an artefact of the practice the scenario depicts rather than something
this project did to a photograph. That is the same standard the caption archive
uses — reproduce what was broadcast, invent nothing about a real person.

## Excluded from the rotation

One contributed file is present in the directory but deliberately not
referenced by `pressPaskiCovers` in `out/html/game.js`:

| File | Reason |
| --- | --- |
| `pasek9.jpg` | Carries the caption `HOLECKA ROBI HERBATĘ Z WODY PO PARÓWKACH` about a named presenter. This reads as a joke edit rather than a broadcast graphic, so unlike the Tusk frame it is not part of the record; and a frame that arrives with a caption already attached cannot be shown under a second invented one. If it did go out on air, move it into `pressPaskiCovers` and record that here. |

It remains on disk so the decision is visible and reversible rather than
silently lost.

## Files in the rotation

`paski1.png`, `paski2.png`, `paski3.jpg`, `paski4.jpg`, `paski5.jpeg`,
`paski6.png`, `paski7.png`, `paski8.jpg`, `pasek8.png`, `pasek11.png`,
`pasek12.png`, `pasek13.png`, `pasek14.png`, `pasek15.png`.

The rotation advances every fourth pasek. The band counts its own changes to
decide this rather than reading the quality state: `month_actions` misses every
click that does not spend an action, and a turn is a whole political month, so
both leave one studio on screen far too long. Re-rendering the same pasek — a
tab switch, a redraw — does not advance the counter. Every frame is held in
memory for the life of the session: the one on screen is fetched first and the
rest are warmed when the browser goes idle, so a band never appears before its
backdrop.

## Captions taken from the same captures

Twelve entries in `pressPaskiArchive` are transcribed from broadcast captures
supplied alongside these images rather than from a citable archive page, and
carry the source label `Broadcast capture` with no link:

`LEWICOWY FASZYZM NISZCZY POLSKĘ`, `OPOZYCJA CHCE SPARALIŻOWAĆ PAŃSTWO`,
`OPOZYCJA CHCE SPARALIŻOWAĆ SEJM`, `OPOZYCJA CHCE ANARCHII, BO PRZEGRYWA
WYBORY`, `OPOZYCJA CHCE ANARCHII W CZASIE EPIDEMII`, `"PODATEK TUSKA" UDERZYŁ W
POLAKÓW`, `"PODATEK TUSKA" PODBIŁ INFLACJĘ`, `"TUSKOWE" DRENUJE KIESZENIE
POLAKÓW`, `DONALD "FÜR DEUTSCHLAND" TUSK W INTERESIE NIEMIEC`, `RZĄD TUSKA
ZGADZA SIĘ NA HOMOMAŁŻEŃSTWA I HOMOADOPCJE`, `TERROR I ATMOSFERA STRACHU W
PAŃSTWIE TUSKA`, `TRWA ZMASOWANA AKCJA ZASTRASZANIA I NĘKANIA REPUBLIKI`.

Captions alleging a specific crime by a named living person — the run of
`MARSZAŁEK SENATU BRAŁ ŁAPÓWKI?` banners is the clearest example — are not
transcribed even though they are equally well attested. The scenario reproduces
the form of that campaign through its own collective targets instead.

## Weight

The directory is 7.4 MB, and `paski6.png` alone is 4.0 MB at 1920×832 for a
slot that renders about 288 px wide. Only the selected frame is fetched, so
this costs nothing on a local build, but the originals are worth downscaling to
roughly 600 px and converting to JPEG before any web deployment.
