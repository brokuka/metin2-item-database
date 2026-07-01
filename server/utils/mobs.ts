import type { Lang } from './itemNames'
import { createHash } from 'node:crypto'

// Official Gameforge wiki uses a MediaWiki image path: images/thumb/{h0}/{h0..1}/File.png/200px-File.png
// where h = md5(File.png). File = English mob name, spaces -> underscores, first letter capitalized.
// Many mobs have no page there -> the <img> falls back to the kind icon on error.
// Manual fixes where the wiki file is named differently than our mob.
// Key = our English mob name, value = the wiki file base name (without .png).
const IMAGE_OVERRIDE: Record<string, string> = {
	'Black Storm Joh-Hwan': 'Black Wind Jak-To',
	'Black Storm Pho-Hwan': 'Black Wind Gu-Ryung',
	'Black Storm Kyuk-Jang': 'Black Wind To-Su',
	'Evil Bl. Storm Joh-Hwan': 'Black Wind Jak-To',
	'Evil Bl. Storm Kyuk-Jang': 'Black Wind To-Su',
	'Evil Bl. Storm Pho-Hwa': 'Black Wind Gu-Ryung',
	'Se-Rang': 'Mu-Shu',
	'Jin-Hee': 'Yah-Ki',
	'White Oath Commander': 'White Oath General',
	'Craven White Oath Sold.': 'White Oath Soldier',
	'Craven White Oath Archer': 'White Oath Archer',
	'Craven White Oath Gen.': 'White Oath General',
	'Craven Wh. Oath Com.': 'White Oath General',
	'Ghost Sword Master': 'Skull Sword Master',
	'Spider Egg': 'Spider Egg (Metin)', // wiki file has the "(Metin)" suffix and is a .png
	'Dark Queen Spider': 'Spider Baron',
	'General Yonghan': 'General Huashin',
	'Azrael\'s Spawn': 'Tartaros',
	'Erebos': 'Tartaros',
	'Proud Demon King': 'Demon King',
	'Ice Witch': 'Mighty Ice Witch',
	'Dark Flame King': 'Flame King',
	'Elite Dark Leader': 'Dark Leader',
	'Chief Elite Orc': 'Chief Orc',
	'Pirate Tanaka': 'Pirate Tanaka (Level 1)',
}

// Build the ORIGINAL-file URL for a given name (thumb widths on the wiki are unreliable).
function wikiFileUrl(name: string, ext: string): string {
	const base = name.replace(/ /g, '_')
	const capped = base.charAt(0).toUpperCase() + base.slice(1)
	const h = createHash('md5').update(`${capped}.${ext}`).digest('hex') // md5 of the raw filename
	const file = `${encodeURIComponent(capped)}.${ext}` // URL-safe for the path
	return `https://en-wiki.metin2.gameforge.com/images/${h[0]}/${h.slice(0, 2)}/${file}`
}

// Name -> wiki-filename quirks (the wiki is inconsistent). Each returns one candidate name.
const swapHungryCursed = (s: string) => s.replace(/^(Hungry|Cursed)\b/, w => (w === 'Hungry' ? 'Cursed' : 'Hungry'))
const stripAlpha = (s: string) => s.replace(/\bAlpha /g, '')
const toggleDispirited = (s: string) => (s.startsWith('Dispirited ') ? s.replace(/^Dispirited /, '') : `Dispirited ${s}`)
const blackWind = (s: string) => s.replace(/Black Storm|Evil Bl\. Storm/g, 'Black Wind')

// Return a candidate list in priority order — the browser tries each via <img @error>
// and shows the first that loads. IMAGE_OVERRIDE beats the rules.
export function mobImageCandidates(enName: string, kind?: MobKind): string[] {
	if (!enName)
		return []
	// Metins are usually .jpg on the wiki, but some (e.g. Spider Egg) are .png — try both.
	const exts = kind === 'stone' ? ['jpg', 'png'] : ['png']
	const raw = enName.trim()
	const variants = [
		raw,
		swapHungryCursed(raw),
		stripAlpha(raw),
		stripAlpha(swapHungryCursed(raw)),
		toggleDispirited(raw),
		blackWind(raw),
	]
	// Apply overrides to each variant too, so e.g. "Dispirited Se-Rang" -> (toggle)
	// "Se-Rang" -> (override) "Mu-Shu" without needing a separate override entry.
	const names = variants.map(v => IMAGE_OVERRIDE[v] ?? v)
	return [...new Set(names)].flatMap(n => exts.map(e => wikiFileUrl(n, e)))
}

// mob_proto.rank (server/src/common/tables.h: enum e_mob_rank)
export const RANK_LABEL: Record<number, Record<Lang, string>> = {
	0: { en: 'Pawn', ru: 'Пешка' },
	1: { en: 'Super Pawn', ru: 'Супер-пешка' },
	2: { en: 'Knight', ru: 'Рыцарь' },
	3: { en: 'Super Knight', ru: 'Супер-рыцарь' },
	4: { en: 'Boss', ru: 'Босс' },
	5: { en: 'King', ru: 'Король' },
}

// mob_proto.type (enum e_char_type): only the ones worth listing in a wiki.
export const TYPE_LABEL: Record<number, Record<Lang, string>> = {
	0: { en: 'Monster', ru: 'Монстр' },
	1: { en: 'NPC', ru: 'NPC' },
	2: { en: 'Metin Stone', ru: 'Камень духа' },
}

export type MobKind = 'monster' | 'boss' | 'npc' | 'stone'

// Some mobs are metin-like breakable objects in-game but stored as plain monsters (type=0)
// in mob_proto — the engine only treats type==2 as a stone, so there's no data signal.
// Reclassify these by vnum (verified in-game). Extend as more turn up.
const KIND_OVERRIDE: Record<number, MobKind> = {
	2095: 'stone', // Яйцо паука / Spider Egg — breakable object, not a monster
}

// A single field to filter/badge on: bosses (rank>=4) split out from plain monsters.
export function mobKind(vnum: number, type: number, rank: number): MobKind {
	if (KIND_OVERRIDE[vnum])
		return KIND_OVERRIDE[vnum]
	if (type === 1)
		return 'npc'
	if (type === 2)
		return 'stone'
	return rank >= 4 ? 'boss' : 'monster'
}

export const KIND_LABEL: Record<MobKind, Record<Lang, string>> = {
	monster: { en: 'Monster', ru: 'Монстр' },
	boss: { en: 'Boss', ru: 'Босс' },
	npc: { en: 'NPC', ru: 'NPC' },
	stone: { en: 'Metin Stone', ru: 'Камень духа' },
}

export function rankLabel(rank: number, lang: Lang): string {
	return RANK_LABEL[rank]?.[lang] ?? ''
}

export function kindLabel(kind: MobKind, lang: Lang): string {
	return KIND_LABEL[kind][lang]
}
