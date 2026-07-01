import { itemProto } from '../../db/schema'
import { resolveItemIcon } from '../../utils/icons'
import { itemDesc } from '../../utils/itemDesc'
import { itemName, langOf } from '../../utils/itemNames'
import { itemClasses, itemTypeLabel, parseRefine, REFINE_TYPES } from '../../utils/items'

// Fetch all item rows once, cached — avoids hitting the DB on every search/filter/page request.
const getAllRows = defineCachedFunction(
	async () => {
		const db = useDb()
		return db.select({
			vnum: itemProto.vnum,
			type: itemProto.type,
			localeName: itemProto.localeName,
			subtype: itemProto.subtype,
			limittype0: itemProto.limittype0,
			limitvalue0: itemProto.limitvalue0,
			antiflag: itemProto.antiflag,
		}).from(itemProto).orderBy(itemProto.vnum)
	},
	{ maxAge: 60, name: 'itemProtoRows', getKey: () => 'all' },
)

export default defineEventHandler(async (event) => {
	const query = getQuery(event)
	const lang = langOf(query.lang)
	const search = String(query.q ?? '').trim().toLowerCase()
	const typeNum = Number(query.type)
	const type = Number.isInteger(typeNum) && typeNum > 0 ? typeNum : undefined
	const clsRaw = String(query.class ?? '')
	const cls = clsRaw && clsRaw !== 'all' ? clsRaw : '' // 'all'/empty = no class filter
	// gender usability (antiflag bit set = that gender CANNOT use it): FEMALE=1, MALE=2
	const genderBit = { male: 2, female: 1 }[String(query.gender ?? '')] ?? 0
	const page = Math.max(1, Number(query.page) || 1)
	const limit = Math.min(100, Math.max(1, Number(query.limit) || 48))
	const sort = String(query.sort ?? 'id')
	const dir = query.dir === 'desc' ? -1 : 1

	const rows = await getAllRows()

	// Types actually present in the data — lets the UI hide empty category cards.
	const availableTypes = [...new Set(rows.filter(r => r.type !== 0).map(r => r.type))].sort((a, b) => a - b)

	const named = rows
		.filter(r => r.type !== 0 && (!type || r.type === type))
		.filter(r => !cls || itemClasses(r.type, r.subtype ?? 0, r.antiflag ?? 0).includes(cls)) // usable by class
		.filter(r => !genderBit || !((r.antiflag ?? 0) & genderBit)) // usable by gender
		.map(r => ({ vnum: r.vnum, type: r.type, name: itemName(r.vnum, lang, r.localeName), level: r.limittype0 === 1 ? (r.limitvalue0 ?? 0) : 0 }))
		.filter(r => r.name && r.name !== 'Noname')
		.filter(r => !search || r.name.toLowerCase().includes(search) || String(r.vnum).includes(search))

	// collapse +0..+9 refine families of equipment into one entry (rep = +0)
	const groups = new Map<string, { vnum: number, name: string, type: number, maxLevel: number, levels: number, level: number }>()
	for (const r of named) {
		const refine = REFINE_TYPES.has(r.type) ? parseRefine(r.name) : null
		if (refine) {
			const key = `${r.type}:${refine.base.toLowerCase()}`
			const g = groups.get(key)
			if (!g) {
				groups.set(key, { vnum: r.vnum, name: refine.base, type: r.type, maxLevel: refine.level, levels: 1, level: r.level })
			}
			else {
				g.maxLevel = Math.max(g.maxLevel, refine.level)
				g.levels++
			}
		}
		else {
			groups.set(`v:${r.vnum}`, { vnum: r.vnum, name: r.name, type: r.type, maxLevel: 0, levels: 1, level: r.level })
		}
	}

	const all = [...groups.values()]
	if (sort === 'name')
		all.sort((a, b) => a.name.localeCompare(b.name) * dir)
	else if (sort === 'level')
		all.sort((a, b) => (a.level - b.level || a.vnum - b.vnum) * dir)
	else all.sort((a, b) => (a.vnum - b.vnum) * dir) // 'id'
	const items = all.slice((page - 1) * limit, page * limit).map(g => ({
		vnum: g.vnum,
		name: g.name,
		type: g.type,
		typeLabel: itemTypeLabel(g.type, lang),
		icon: resolveItemIcon(g.vnum, itemName(g.vnum, 'en', '')),
		refine: g.levels > 1 ? g.maxLevel : 0,
		desc: itemDesc(g.vnum, lang),
	}))

	return { total: all.length, page, limit, items, types: availableTypes }
})
