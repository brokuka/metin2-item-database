import iconv from 'iconv-lite'
import { customType, int, mysqlSchema, smallint, tinyint } from 'drizzle-orm/mysql-core'

// item_proto names are varbinary (EUC-KR `name`, English `locale_name`). Decode Buffer -> string on read.
const binStr = customType<{ data: string }>({
	dataType() { return 'varbinary(24)' },
	fromDriver(v) { return Buffer.isBuffer(v) ? v.toString('utf8') : String(v ?? '') },
})

// mob_proto / item_proto locale_name is the server-locale name in cp1251 (this server runs RU).
// Override the charset via NUXT_MOB_NAME_ENCODING if your server uses another locale.
const localeStr = customType<{ data: string }>({
	dataType() { return 'varbinary(24)' },
	fromDriver(v) { return Buffer.isBuffer(v) ? iconv.decode(v, process.env.NUXT_MOB_NAME_ENCODING || 'win1251') : String(v ?? '') },
})

// enum/set columns come back as plain strings (sets comma-joined); read-only passthrough.
const str = customType<{ data: string }>({
	dataType() { return 'varchar(255)' },
	fromDriver(v) { return v == null ? '' : String(v) },
})

// Item definitions live in the `player` DB (owned by the server). Read-only wiki source.
export const player = mysqlSchema('player')
export const itemProto = player.table('item_proto', {
	vnum: int('vnum').primaryKey(),
	name: binStr('name'),
	// locale_name is the server-locale name (cp1251 on this RU server), not utf8 — decode like
	// mob names. Only shown as a fallback when the item isn't in item_names_*.txt (e.g. dragon souls).
	localeName: localeStr('locale_name'),
	type: tinyint('type').notNull(),
	subtype: tinyint('subtype').notNull(),
	weight: tinyint('weight'),
	size: tinyint('size'),
	gold: int('gold'),
	shopBuyPrice: int('shop_buy_price'),
	limittype0: tinyint('limittype0'),
	limitvalue0: int('limitvalue0'),
	limittype1: tinyint('limittype1'),
	limitvalue1: int('limitvalue1'),
	applytype0: tinyint('applytype0'),
	applyvalue0: int('applyvalue0'),
	applytype1: tinyint('applytype1'),
	applyvalue1: int('applyvalue1'),
	applytype2: tinyint('applytype2'),
	applyvalue2: int('applyvalue2'),
	value0: int('value0'),
	value1: int('value1'),
	value2: int('value2'),
	value3: int('value3'),
	value4: int('value4'),
	value5: int('value5'),
	wearflag: int('wearflag'),
	antiflag: int('antiflag'),
})

// Monsters / NPCs, also in `player` (read-only wiki source).
export const mobProto = player.table('mob_proto', {
	vnum: int('vnum').primaryKey(),
	name: binStr('name'),
	localeName: localeStr('locale_name'),
	rank: tinyint('rank'),
	type: tinyint('type'),
	battleType: tinyint('battle_type'),
	level: smallint('level'),
	size: str('size'),
	aiFlag: str('ai_flag'),
	raceFlag: str('setRaceFlag'),
	immuneFlag: str('setImmuneFlag'),
	empire: tinyint('empire'),
	st: smallint('st'),
	dx: smallint('dx'),
	ht: smallint('ht'),
	iq: smallint('iq'),
	damageMin: smallint('damage_min'),
	damageMax: smallint('damage_max'),
	maxHp: int('max_hp'),
	goldMin: int('gold_min'),
	goldMax: int('gold_max'),
	exp: int('exp'),
	def: smallint('def'),
	attackSpeed: smallint('attack_speed'),
	moveSpeed: smallint('move_speed'),
	aggressiveHpPct: tinyint('aggressive_hp_pct'),
	aggressiveSight: smallint('aggressive_sight'),
	attackRange: smallint('attack_range'),
	dropItem: int('drop_item'),
})
