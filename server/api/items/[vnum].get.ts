import { and, between, eq } from 'drizzle-orm'
import { itemProto } from '../../db/schema'
import { resolveItemIcon } from '../../utils/icons'
import { itemDesc } from '../../utils/itemDesc'
import { itemName, langOf } from '../../utils/itemNames'
import { appliesIndexed, decodeRestrictions, decodeStats, describeLimits, itemTypeLabel, parseRefine, REFINE_TYPES } from '../../utils/items'

type Row = typeof itemProto.$inferSelect

const signed = (v: number, percent: boolean) => `${v > 0 ? '+' : ''}${v}${percent ? '%' : ''}`

export default defineCachedEventHandler(async (event) => {
	const vnum = Number(getRouterParam(event, 'vnum'))
	if (!Number.isInteger(vnum))
		throw createError({ statusCode: 400, statusMessage: 'Bad vnum' })
	const lang = langOf(getQuery(event).lang)
	const db = useDb()

	const [it] = await db.select().from(itemProto).where(eq(itemProto.vnum, vnum)).limit(1)
	if (!it)
		throw createError({ statusCode: 404, statusMessage: 'Item not found' })

	const name = itemName(it.vnum, lang, it.localeName)
	const refine = REFINE_TYPES.has(it.type) ? parseRefine(name) : null
	let baseName = name
	let baseVnum = it.vnum

	let rows: Row[]
	if (refine) {
		baseName = refine.base
		baseVnum = it.vnum - refine.level
		const siblings = await db.select().from(itemProto).where(and(eq(itemProto.type, it.type), between(itemProto.vnum, baseVnum, baseVnum + 9))).orderBy(itemProto.vnum)
		rows = siblings.filter(r => parseRefine(itemName(r.vnum, lang, r.localeName))?.base.toLowerCase() === refine.base.toLowerCase())
	}
	else {
		rows = [it]
	}

	// A stat that CHANGES across refine levels is a characteristic; one that stays constant is a bonus.
	const dynamic = new Set<number>()
	for (let i = 0; i < 3; i++) {
		const present = rows.some(r => (r as Record<string, number>)[`applytype${i}`])
		if (!present)
			continue
		const variants = new Set(rows.map((r) => {
			const rr = r as Record<string, number>
			return `${rr[`applytype${i}`]}:${rr[`applyvalue${i}`]}`
		}))
		if (variants.size > 1)
			dynamic.add(i)
	}

	// Some applies are inherent characteristics, not bonuses, even when constant across refine —
	// e.g. a weapon's attack speed (apply type 7). Force those slots into stats.
	const inherentTypes = it.type === 1 ? new Set([7]) : new Set<number>()
	const r0 = rows[0] as unknown as Record<string, number>
	const forced = new Set<number>()
	for (let i = 0; i < 3; i++) {
		if (inherentTypes.has(r0[`applytype${i}`]))
			forced.add(i)
	}
	const isStatSlot = (i: number) => dynamic.has(i) || forced.has(i)

	const levels = rows.map((row) => {
		const r = row as unknown as Record<string, number>
		const dyn = appliesIndexed(row, lang).filter(a => isStatSlot(a.idx)).map(a => ({ label: a.label, text: signed(a.value, a.percent) }))
		return {
			vnum: row.vnum,
			level: parseRefine(itemName(row.vnum, lang, row.localeName))?.level ?? 0,
			stats: [...decodeStats(r, lang), ...dyn], // characteristics (vary with level)
			limits: describeLimits(r, lang),
			gold: row.gold ?? 0,
			giveCommand: `/item ${row.vnum}`,
		}
	})

	// bonuses = applies constant across all levels (level-independent overlay), minus inherent stats
	const bonuses = appliesIndexed(rows[0], lang)
		.filter(a => !isStatSlot(a.idx))
		.map(a => ({ label: a.label, value: a.value, percent: a.percent }))

	return {
		name: baseName,
		type: it.type,
		typeLabel: itemTypeLabel(it.type, lang),
		icon: resolveItemIcon(baseVnum, itemName(baseVnum, 'en', it.localeName)),
		description: itemDesc(baseVnum, lang),
		isEquip: REFINE_TYPES.has(it.type) || it.type === 28,
		...decodeRestrictions(it.antiflag ?? 0),
		bonuses,
		levels,
	}
}, {
	maxAge: 60,
	getKey: event => `item:${getRouterParam(event, 'vnum')}:${langOf(getQuery(event).lang)}`,
})
