# Metin2 Item Database

A fast, self-hostable item database (wiki) for **your own** Metin2 server. It reads
item definitions live from your game DB and renders an in-game-accurate catalog:
search, category filter, sorting, refine `+0..+9`, stats/bonuses, and a tooltip that
matches the client's `ItemToolTip`. Bilingual UI (EN / RU).

No accounts, no registration — it's a read-only item database.

> Every server runs different item protos, names and icons, so this ships as the
> **system** only: you point it at your client + server files and the included scripts
> generate the icons/frame from _your_ data.

## How it gets data

| Data                                 | Source                                                            | Used at             |
| ------------------------------------ | ----------------------------------------------------------------- | ------------------- |
| Item protos (stats, applies, values) | live `player.item_proto` table in your DB                         | runtime             |
| Names (EN/RU)                        | `<M2_NAMES_DIR>/item_names_<lang>.txt` (server conf)              | runtime             |
| Descriptions (EN/RU)                 | `<M2_PACK_DIR>/locale_<lang>/locale/<lang>/itemdesc.txt` (client) | runtime             |
| Icons                                | `*.tga` under `<M2_PACK_DIR>` → converted to `webp`               | `data:icons` script |
| Tooltip frame                        | `<M2_PACK_DIR>/ETC/ymir work/ui/pattern/thinboard_*`              | `data:board` script |

## Requirements

- [Bun](https://bun.sh) (or Node 20+). Bun auto-loads `.env`.
- Access to your Metin2 server's MySQL/MariaDB (the DB with the `player.item_proto` table).
- Your **client pack** folder and your **server conf** folder (for icons, names, descriptions).

## Setup

```bash
# 1. install deps
bun install

# 2. configure — copy and edit paths/credentials
cp .env.example .env
#   set NUXT_DB_*    -> your game DB
#   set M2_PACK_DIR  -> your client's pack dir (contains locale_*, ETC/, icon/, ...)
#   set M2_NAMES_DIR -> your server's conf dir (item_names_en.txt / item_names_ru.txt)

# 3. generate icons + tooltip frame from YOUR client
bun data:setup
#   = bun data:board (tooltip frame) + bun data:icons (item icons -> public/icons/items/*.webp)

# 4. run
bun dev            # http://localhost:3000
```

Production:

```bash
bun run build
bun run preview    # or deploy the .output/ (Node server) anywhere
```

The data scripts also accept the pack dir as a CLI arg (handy without `.env`):

```bash
node scripts/convert-icons.mjs /path/to/client/bin/pack
node scripts/build-board.mjs   /path/to/client/bin/pack
```

Re-run `bun data:icons` whenever you add new items/icons. Item names, descriptions and
protos are read live, so those update automatically.

## Tech

Nuxt 4 · Nuxt UI 4 (Tailwind v4) · Drizzle ORM + mysql2 · @nuxtjs/i18n · sharp/tga (icon conversion).

The item proto schema (`server/db/schema.ts`) mirrors the standard Metin2 `item_proto`
columns. Extra columns on your server are fine — only the standard ones are read.

## Disclaimer

This is a fan tool for private Metin2 servers. **Metin2** and all game assets (icons,
item names, textures) are property of **Webzen / Ymir Entertainment**. This repository
ships **no game assets** — you generate them from your own client, which you must own.
Use at your own risk.

## License

[MIT](./LICENSE) — code only.
