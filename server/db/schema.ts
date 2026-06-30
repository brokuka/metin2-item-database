import { customType, int, mysqlSchema, tinyint } from 'drizzle-orm/mysql-core'

// item_proto names are varbinary (EUC-KR `name`, English `locale_name`). Decode Buffer -> string on read.
const binStr = customType<{ data: string }>({
	dataType() { return 'varbinary(24)' },
	fromDriver(v) { return Buffer.isBuffer(v) ? v.toString('utf8') : String(v ?? '') },
})

// Item definitions live in the `player` DB (owned by the server). Read-only wiki source.
export const player = mysqlSchema('player')
export const itemProto = player.table('item_proto', {
	vnum: int('vnum').primaryKey(),
	name: binStr('name'),
	localeName: binStr('locale_name'),
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
