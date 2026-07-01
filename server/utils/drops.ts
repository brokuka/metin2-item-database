import { readFileSync } from 'node:fs'
import type { Lang } from './itemNames'
import { resolveItemIcon } from './icons'
import { itemName } from './itemNames'
import { parseRefine } from './items'

// Drop data lives next to the name lists: <gamefiles>/data/*.txt. Derive it from
// M2_NAMES_DIR (…/conf) unless M2_DATA_DIR overrides. Files are EUC-KR for the group/item
// names, but we only read the numeric columns (vnum/count/pct), so latin1 is safe.
const NAMES = process.env.M2_NAMES_DIR || '../server/gamefiles/conf'
const DATA = process.env.M2_DATA_DIR || NAMES.replace(/conf\/?$/, 'data')

export type DropType = 'drop' | 'kill' | 'limit' | 'thiefgloves'
export interface DropRow { vnum: number, count: number, value: number } // value = pct (drop/limit) or weight (kill)
export interface DropGroup { type: DropType, killDrop?: number, levelLimit?: number, items: DropRow[] }

// mob_drop_item.txt: brace-delimited groups keyed by `Mob <vnum>`. A mob can own several groups.
//   Group <name> { [Kill_drop N] Mob <vnum> Type <drop|kill|limit> [level_limit N] <slot vnum count value [rare]>... }
let mobDrops: Map<number, DropGroup[]> | null = null
function loadMobDrops(): Map<number, DropGroup[]> {
	if (mobDrops)
		return mobDrops
	mobDrops = new Map()
	let txt: string
	try {
		txt = readFileSync(`${DATA}/mob_drop_item.txt`, 'latin1')
	}
	catch {
		return mobDrops
	}
	let cur: (DropGroup & { mob?: number }) | null = null
	for (const raw of txt.split(/\r?\n/)) {
		const line = raw.trim()
		if (!line)
			continue
		if (line === '{') {
			cur = { type: 'drop', items: [] }
			continue
		}
		if (line === '}') {
			if (cur?.mob && cur.items.length) {
				const list = mobDrops.get(cur.mob) ?? []
				list.push({ type: cur.type, killDrop: cur.killDrop, levelLimit: cur.levelLimit, items: cur.items })
				mobDrops.set(cur.mob, list)
			}
			cur = null
			continue
		}
		if (!cur)
			continue // Group header (name) sits outside the braces — skip.
		const c = line.split(/\s+/)
		const key = c[0].toLowerCase()
		if (key === 'mob')
			cur.mob = Number(c[1])
		else if (key === 'type')
			cur.type = c[1].toLowerCase() as DropType
		else if (key === 'kill_drop')
			cur.killDrop = Number(c[1])
		else if (key === 'level_limit')
			cur.levelLimit = Number(c[1])
		else if (/^\d/.test(c[0])) {
			// item row: slot vnum count value [rare]
			const vnum = Number(c[1])
			if (vnum)
				cur.items.push({ vnum, count: Number(c[2]) || 1, value: Number(c[3]) || 0 })
		}
	}
	return mobDrops
}

export function mobDropsFor(vnum: number): DropGroup[] {
	return loadMobDrops().get(vnum) ?? []
}

// common_drop_item.txt: level-ranged generic drops in 4 rank columns (PAWN S_PAWN KNIGHT S_KNIGHT
// = mob rank 0..3), 6 fields each: name, lvStart, lvEnd, pct, vnum, ratio. Rows continue a rank's
// list (name blank). Bosses/kings (rank 4/5) have no common column.
export interface CommonDrop { lvStart: number, lvEnd: number, pct: number, vnum: number }
let commonDrops: CommonDrop[][] | null = null
function loadCommonDrops(): CommonDrop[][] {
	if (commonDrops)
		return commonDrops
	commonDrops = [[], [], [], []]
	let txt: string
	try {
		txt = readFileSync(`${DATA}/common_drop_item.txt`, 'latin1')
	}
	catch {
		return commonDrops
	}
	for (const raw of txt.split(/\r?\n/).slice(1)) { // row 0 is the rank header
		const cols = raw.split('\t')
		for (let r = 0; r < 4; r++) {
			const b = r * 6
			const lvStart = Number(cols[b + 1])
			const lvEnd = Number(cols[b + 2])
			const pct = Number(cols[b + 3])
			const vnum = Number(cols[b + 4])
			if (vnum && pct > 0 && Number.isFinite(lvStart) && Number.isFinite(lvEnd))
				commonDrops[r].push({ lvStart, lvEnd, pct, vnum })
		}
	}
	return commonDrops
}

export function commonDropsFor(rank: number, level: number): CommonDrop[] {
	if (rank < 0 || rank > 3)
		return []
	return loadCommonDrops()[rank].filter(d => level >= d.lvStart && level <= d.lvEnd)
}

// Attach a localized name + resolved icon + refine level (+N) to a dropped item vnum (no DB hit).
export function resolveDropItem(vnum: number, lang: Lang) {
	const name = itemName(vnum, lang, `#${vnum}`)
	return { vnum, name, icon: resolveItemIcon(vnum, itemName(vnum, 'en', '')), refine: parseRefine(name)?.level ?? 0 }
}
