import { eq, inArray } from 'drizzle-orm'
import { itemProto, mobProto } from '../../db/schema'
import { commonDropsFor, mobDropsFor, resolveDropItem } from '../../utils/drops'
import { langOf, type Lang } from '../../utils/itemNames'
import { CATEGORY_ORDER, categoryLabel, itemCategory } from '../../utils/items'
import { mobName } from '../../utils/mobNames'
import { kindLabel, mobImageCandidates, mobKind, rankLabel } from '../../utils/mobs'

// Common (level-based) drops are generic per rank+level and can number in the hundreds;
// show the most likely ones and report the total so the UI can say "N of M".
const COMMON_CAP = 60

const splitSet = (s: string | null) => (s ? s.split(',').map(x => x.trim()).filter(Boolean) : [])

// Bucket resolved drop items by category, ordered, each list sorted by chance desc.
interface CatItem { cat: string, pct: number }
function groupByCategory<T extends CatItem>(items: T[], lang: Lang) {
	const byKey = new Map<string, T[]>()
	for (const it of items) {
		const list = byKey.get(it.cat) ?? []
		list.push(it)
		byKey.set(it.cat, list)
	}
	return CATEGORY_ORDER.filter(k => byKey.has(k)).map(k => ({
		key: k,
		label: categoryLabel(k, lang),
		items: byKey.get(k)!.sort((a, b) => b.pct - a.pct),
	}))
}

export default defineEventHandler(async (event) => {
	const vnum = Number(getRouterParam(event, 'vnum'))
	if (!Number.isInteger(vnum))
		throw createError({ statusCode: 400, statusMessage: 'Bad vnum' })

	const lang = langOf(getQuery(event).lang)
	const db = useDb()
	const [m] = await db.select().from(mobProto).where(eq(mobProto.vnum, vnum)).limit(1)
	if (!m)
		throw createError({ statusCode: 404, statusMessage: 'Mob not found' })

	const kind = mobKind(m.vnum, m.type ?? 0, m.rank ?? 0)

	const groups = mobDropsFor(m.vnum)
	const commonAll = commonDropsFor(m.rank ?? 0, m.level ?? 0).sort((a, b) => b.pct - a.pct)
	const common = commonAll.slice(0, COMMON_CAP)

	// One batched lookup of item_proto.type for every dropped vnum -> category bucket.
	const vnums = [...new Set([...groups.flatMap(g => g.items.map(i => i.vnum)), ...common.map(d => d.vnum)])]
	const catByVnum = new Map<number, string>()
	if (vnums.length) {
		const rows = await db.select({ vnum: itemProto.vnum, type: itemProto.type }).from(itemProto).where(inArray(itemProto.vnum, vnums))
		for (const r of rows)
			catByVnum.set(r.vnum, itemCategory(r.type))
	}
	const catOf = (vnum: number) => catByVnum.get(vnum) ?? 'other'

	// Per-mob drops flattened with source + chance, then grouped by category.
	// kill groups: pct = weight share (which item drops when the group triggers).
	const dropItems = groups.flatMap((g) => {
		const sum = g.type === 'kill' ? (g.items.reduce((s, x) => s + x.value, 0) || 1) : 0
		return g.items.map(it => ({
			...resolveDropItem(it.vnum, lang),
			cat: catOf(it.vnum),
			source: g.type,
			pct: g.type === 'kill' ? (it.value / sum) * 100 : it.value,
			count: it.count,
			killDrop: g.killDrop ?? 0,
			levelLimit: g.levelLimit ?? 0,
		}))
	})
	const commonItems = common.map(d => ({ ...resolveDropItem(d.vnum, lang), cat: catOf(d.vnum), source: 'common' as const, pct: d.pct }))

	return {
		vnum: m.vnum,
		name: mobName(m.vnum, lang, m.localeName || m.name),
		images: mobImageCandidates(mobName(m.vnum, 'en', m.localeName || m.name), kind),
		kind,
		kindLabel: kindLabel(kind, lang),
		rankLabel: rankLabel(m.rank ?? 0, lang),
		level: m.level ?? 0,
		maxHp: m.maxHp ?? 0,
		exp: m.exp ?? 0,
		goldMin: m.goldMin ?? 0,
		goldMax: m.goldMax ?? 0,
		damageMin: m.damageMin ?? 0,
		damageMax: m.damageMax ?? 0,
		def: m.def ?? 0,
		st: m.st ?? 0,
		dx: m.dx ?? 0,
		ht: m.ht ?? 0,
		iq: m.iq ?? 0,
		moveSpeed: m.moveSpeed ?? 0,
		attackSpeed: m.attackSpeed ?? 0,
		size: m.size || '',
		aggressiveSight: m.aggressiveSight ?? 0,
		attackRange: m.attackRange ?? 0,
		dropItem: m.dropItem ?? 0,
		aiFlags: splitSet(m.aiFlag),
		raceFlags: splitSet(m.raceFlag),
		immuneFlags: splitSet(m.immuneFlag),
		dropCats: groupByCategory(dropItems, lang),
		commonCats: groupByCategory(commonItems, lang),
		commonShown: common.length,
		commonTotal: commonAll.length,
	}
})
