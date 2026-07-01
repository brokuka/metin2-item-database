# Changelog

All notable changes to this project are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); versions use [SemVer](https://semver.org/).

## v0.2.0 — 2026-07-01

### Added

- **Monsters & NPCs section** — list with search, kind cards (monster/boss/npc/metin), sort,
  and filters for "has image" and "has drops"; full detail pages for mobs and metins.
- **Drop tables** on mob/metin detail — per-mob drops with real per-kill chances (`drop`,
  `kill` as "≈1 per N kills", level-gated `limit`) plus level-based common drops, grouped by
  item category and rendered as an icon grid. Chances scale by your level (level-delta) and a
  configurable server drop-rate.
- **Reward panel** on mob detail — exp/yang scaled by level-delta with an efficiency gauge;
  exp is 0 at the level cap.
- **Item filters** — character class (by weapon subtype / antiflag) and gender selects.
- **Item quantity** field on the give command for stackable items, defaulting to the server
  stack max (`ITEM_MAX_COUNT`).
- Detail pages (replacing modals), shared `BackButton`, per-page titles, drop-rate config.

### Fixed

- Dragon-soul item names showed mojibake — `item_proto.locale_name` is cp1251, was decoded as utf8.
- Detail pages didn't re-translate name/tags on language switch (cache key now includes lang).
- Drop percentages were overstated 4× — corrected to the server roll (`iRandRange = 4,000,000`).
- Several mob images pointed at the wrong Gameforge file (name overrides); metins can be `.png`.
- Spider Egg reclassified as a metin (it's a breakable object, stored as a monster).
- Light-theme modal colors and dark-theme borders.
