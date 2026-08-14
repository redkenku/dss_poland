# Election geography

The game ships its election maps as offline generated assets. Runtime play
does not download boundaries or election results.

Run `npm run data:elections` to rebuild them. The generator downloads and
SHA-256-verifies:

- GUGiK PRG 2023 administrative boundaries: voivodeships, powiats,
  municipalities, and cadastral units;
- Natural Earth 10m land geometry, used only to clip PRG's maritime
  administrative envelope back to the Baltic coastline. Its mask receives a
  1.2 km cartographic buffer so narrow features such as Hel remain visible at
  national-map scale;
- PKW 2019 Sejm district and municipality results; and
- PKW 2023 Sejm district magnitudes, electorates, and municipality assignments.

Exact URLs and checksums are pinned in
`scripts/generate-election-geography.js`. `mapshaper` is a development-only
dependency used to simplify PRG geometry. The committed browser asset contains
16 voivodeships, 380 powiats, 2,477 municipalities, and the finer units used by
the synthetic constituencies.

The 41-district layer follows PKW assignments. The 230- and 460-seat layers are
hypothetical, fixed independent-commission maps generated without polling
input. They never cross voivodeship boundaries and preserve the requested
138/92 and 276/184 urban/rural seat totals. They are a gameplay model, not an
official or recommended redistricting proposal.
