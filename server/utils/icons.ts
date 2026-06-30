import { readdirSync, readFileSync } from 'node:fs'
import { itemName } from '~~/server/utils/itemNames'

// Authoritative vnum -> icon basename from the client's item_list.txt (cols: vnum, type, iconPath, model).
// Plus a name -> icon fallback so duplicate items (e.g. 9xxxx clones not in item_list) reuse the
// icon of the same-named item. Cross-checked against the converted .webp set.
const PACK = process.env.M2_PACK_DIR || '../client/bin/pack'
const LIST = process.env.M2_ITEM_LIST || `${PACK}/locale_en/locale/en/item_list.txt`
const ICON_DIR = './public/icons/items'

let vnumToIcon: Map<number, string> | null = null
let nameToIcon: Map<string, string> | null = null
let haveWebp: Set<string> | null = null

function ensure() {
	if (vnumToIcon) return
	vnumToIcon = new Map()
	nameToIcon = new Map()
	haveWebp = new Set()
	try {
		for (const f of readdirSync(ICON_DIR)) if (f.endsWith('.webp')) haveWebp.add(f.slice(0, -5))
	} catch { /* ignore */ }
	try {
		for (const line of readFileSync(LIST, 'utf8').split(/\r?\n/)) { // no header row
			const c = line.split('\t')
			if (c.length < 3) continue
			const vnum = Number(c[0])
			const base = c[2].split('/').pop()?.replace(/\.[a-z]+$/i, '').toLowerCase()
			if (vnum && base) vnumToIcon.set(vnum, base)
		}
	} catch { /* ignore */ }
	// name -> icon (first/lowest vnum with a real icon wins)
	for (const [vnum, base] of vnumToIcon) {
		if (!haveWebp.has(base)) continue
		const name = itemName(vnum, 'en', '').toLowerCase()
		if (name && !nameToIcon.has(name)) nameToIcon.set(name, base)
	}
}

// Resolve an item's icon: by vnum, else by English name (duplicate/clone items), else null.
export function resolveItemIcon(vnum: number, enName = ''): string | null {
	ensure()
	const direct = vnumToIcon!.get(vnum)
	if (direct && haveWebp!.has(direct)) return direct
	const byName = enName && nameToIcon!.get(enName.toLowerCase())
	if (byName && haveWebp!.has(byName)) return byName
	// Fallback: many items (accessories etc.) are absent from item_list.txt but their
	// icon is named by vnum (or the +0 base of the refine family). The game reads these
	// from item_proto, not item_list. ponytail: vnum-name heuristic, fine since haveWebp guards it.
	const self = String(vnum)
	if (haveWebp!.has(self)) return self
	const base = String(Math.floor(vnum / 10) * 10)
	return haveWebp!.has(base) ? base : null
}
