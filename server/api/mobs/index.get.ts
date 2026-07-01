import { mobProto } from '../../db/schema'
import { commonDropsFor, mobDropsFor } from '../../utils/drops'
import { langOf } from '../../utils/itemNames'
import { mobName } from '../../utils/mobNames'
import { kindLabel, mobImageCandidates, mobKind, rankLabel } from '../../utils/mobs'

// Fetch the list columns once, cached — no DB hit per search/filter/page. hasDrops is baked in
// here (same maps the detail uses) so the `drops` filter is cheap.
const getAllRows = defineCachedFunction(
	async () => {
		const db = useDb()
		const rows = await db.select({
			vnum: mobProto.vnum,
			localeName: mobProto.localeName,
			rank: mobProto.rank,
			type: mobProto.type,
			level: mobProto.level,
			maxHp: mobProto.maxHp,
			exp: mobProto.exp,
		}).from(mobProto).orderBy(mobProto.vnum)
		return rows.map(r => ({
			...r,
			hasDrops: mobDropsFor(r.vnum).length > 0 || commonDropsFor(r.rank ?? 0, r.level ?? 0).length > 0,
		}))
	},
	{ maxAge: 60, name: 'mobProtoRows', getKey: () => 'all' },
)

export default defineEventHandler(async (event) => {
	const query = getQuery(event)
	const lang = langOf(query.lang)
	const search = String(query.q ?? '').trim().toLowerCase()
	const kind = String(query.kind ?? 'all')
	const onlyDrops = query.drops === '1' || query.drops === 'true'
	const page = Math.max(1, Number(query.page) || 1)
	const limit = Math.min(100, Math.max(1, Number(query.limit) || 48))
	const sort = String(query.sort ?? 'id')
	const dir = query.dir === 'desc' ? -1 : 1

	const rows = await getAllRows()

	const list = rows
		.filter(r => r.type === 0 || r.type === 1 || r.type === 2) // monster / npc / stone only
		.map(r => ({
			vnum: r.vnum,
			name: mobName(r.vnum, lang, r.localeName),
			kind: mobKind(r.vnum, r.type ?? 0, r.rank ?? 0),
			rank: r.rank ?? 0,
			level: r.level ?? 0,
			maxHp: r.maxHp ?? 0,
			exp: r.exp ?? 0,
			hasDrops: r.hasDrops,
		}))
		.filter(r => r.name && r.name !== 'Noname')
		.filter(r => kind === 'all' || r.kind === kind)
		.filter(r => !onlyDrops || r.hasDrops)
		.filter(r => !search || r.name.toLowerCase().includes(search) || String(r.vnum).includes(search))

	if (sort === 'name')
		list.sort((a, b) => a.name.localeCompare(b.name) * dir)
	else if (sort === 'level')
		list.sort((a, b) => (a.level - b.level || a.vnum - b.vnum) * dir)
	else list.sort((a, b) => (a.vnum - b.vnum) * dir)

	const mobs = list.slice((page - 1) * limit, page * limit).map(m => ({
		vnum: m.vnum,
		name: m.name,
		kind: m.kind,
		kindLabel: kindLabel(m.kind, lang),
		rankLabel: rankLabel(m.rank, lang),
		level: m.level,
		maxHp: m.maxHp,
		exp: m.exp,
		images: mobImageCandidates(mobName(m.vnum, 'en'), m.kind),
	}))

	return { total: list.length, page, limit, mobs }
})
