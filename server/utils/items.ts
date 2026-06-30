import type { Lang } from '~~/server/utils/itemNames'

// Maps from game source: client/bin/pack/root/uitooltip.py (formulas, percent rules),
// client/src/GameLib/ItemData.h (EItemType), server/src/common/length.h (EApplyTypes).

const ITEM_TYPES_EN: Record<number, string> = {
	0: 'None', 1: 'Weapon', 2: 'Armor', 3: 'Consumable', 4: 'Auto-use', 5: 'Material',
	6: 'Special', 7: 'Tool', 8: 'Lottery', 9: 'Currency', 10: 'Metin Stone', 11: 'Container',
	12: 'Fishing', 13: 'Rod', 14: 'Resource', 15: 'Campfire', 16: 'Unique', 17: 'Skill Book',
	18: 'Quest', 19: 'Polymorph', 20: 'Treasure Box', 21: 'Treasure Key', 22: 'Skill Forget',
	23: 'Gift Box', 24: 'Pick', 25: 'Hair', 26: 'Totem', 27: 'Blend', 28: 'Costume',
	29: 'Dragon Soul', 30: 'Special DS', 31: 'Extract', 32: 'Secondary Coin', 33: 'Ring', 34: 'Belt'
}
const ITEM_TYPES_RU: Record<number, string> = {
	0: 'Нет', 1: 'Оружие', 2: 'Броня', 3: 'Расходники', 4: 'Авто-исп.', 5: 'Материал',
	6: 'Особое', 7: 'Инструмент', 8: 'Лотерея', 9: 'Валюта', 10: 'Камень духа', 11: 'Контейнер',
	12: 'Рыбалка', 13: 'Удочка', 14: 'Ресурс', 15: 'Костёр', 16: 'Уникальное', 17: 'Книга умений',
	18: 'Квестовое', 19: 'Превращение', 20: 'Сундук', 21: 'Ключ от сундука', 22: 'Забвение умений',
	23: 'Подарок', 24: 'Кирка', 25: 'Причёска', 26: 'Тотем', 27: 'Смесь', 28: 'Костюм',
	29: 'Дух дракона', 30: 'Особый ДД', 31: 'Извлечение', 32: 'Вторичная монета', 33: 'Кольцо', 34: 'Пояс'
}
export const REFINE_TYPES = new Set([1, 2, 33, 34])
export function itemTypeLabel(type: number, lang: Lang = 'en'): string {
	return (lang === 'ru' ? ITEM_TYPES_RU : ITEM_TYPES_EN)[type] ?? `#${type}`
}

const APPLY_EN: Record<number, string> = {
	1: 'Max HP', 2: 'Max SP', 3: 'Vitality', 4: 'Intelligence', 5: 'Strength', 6: 'Dexterity',
	7: 'Attack Speed', 8: 'Move Speed', 9: 'Cast Speed', 10: 'HP Regen', 11: 'SP Regen',
	12: 'Poison Chance', 13: 'Stun Chance', 14: 'Slow Chance', 15: 'Critical', 16: 'Penetration',
	17: 'Att vs Humans', 18: 'Att vs Animals', 19: 'Att vs Orcs', 20: 'Att vs Mystics', 21: 'Att vs Undead',
	22: 'Att vs Devils', 23: 'HP Steal', 24: 'SP Steal', 25: 'Mana Burn', 26: 'SP on Damage',
	27: 'Block', 28: 'Dodge', 29: 'Resist Sword', 30: 'Resist Two-hand', 31: 'Resist Dagger',
	32: 'Resist Bell', 33: 'Resist Fan', 34: 'Resist Bow', 35: 'Resist Fire', 36: 'Resist Lightning',
	37: 'Resist Magic', 38: 'Resist Wind', 39: 'Reflect Melee', 40: 'Reflect Curse', 41: 'Poison Reduce',
	42: 'SP on Kill', 43: 'EXP Bonus', 44: 'Gold Bonus', 45: 'Item Drop', 46: 'Potion Bonus',
	47: 'HP on Kill', 48: 'Immune Stun', 49: 'Immune Slow', 50: 'Immune Fall', 51: 'Skill', 52: 'Bow Range',
	53: 'Attack Power', 54: 'Defense Bonus', 55: 'Magic Attack', 56: 'Magic Defense', 57: 'Curse Chance',
	58: 'Max Stamina', 59: 'Att vs Warriors', 60: 'Att vs Ninja', 61: 'Att vs Sura', 62: 'Att vs Shaman',
	63: 'Att vs Monsters', 64: 'Attack (Mall)', 65: 'Defense (Mall)', 66: 'EXP (Mall)', 67: 'Item Drop (Mall)',
	68: 'Gold Drop (Mall)', 69: 'Max HP', 70: 'Max SP', 71: 'Skill Damage', 72: 'Normal Damage',
	73: 'Skill Defense', 74: 'Normal Defense', 75: 'EXP (PC-Bang)', 76: 'Drop (PC-Bang)', 77: 'HP Cost on Use',
	78: 'Resist Warriors', 79: 'Resist Ninja', 80: 'Resist Sura', 81: 'Resist Shaman', 82: 'Energy',
	83: 'Defense', 84: 'Costume Attr Bonus', 85: 'Magic Attack', 86: 'Melee+Magic Attack',
	87: 'Resist Ice', 88: 'Resist Earth', 89: 'Resist Dark', 90: 'Anti-Critical', 91: 'Anti-Penetration'
}
const APPLY_RU: Record<number, string> = {
	1: 'Макс. здоровье', 2: 'Макс. мана', 3: 'Выносливость', 4: 'Интеллект', 5: 'Сила', 6: 'Ловкость',
	7: 'Скорость атаки', 8: 'Скорость передвижения', 9: 'Скорость каста', 10: 'Восст. здоровья', 11: 'Восст. маны',
	12: 'Шанс отравления', 13: 'Шанс оглушения', 14: 'Шанс замедления', 15: 'Крит. удар', 16: 'Пробивание',
	17: 'Атака против Людей', 18: 'Атака против Животных', 19: 'Атака против Орков', 20: 'Атака против Мистиков', 21: 'Атака против Нежити',
	22: 'Атака против Дьяволов', 23: 'Похищение здоровья', 24: 'Похищение маны', 25: 'Сжигание маны', 26: 'Мана при уроне',
	27: 'Блок', 28: 'Уклонение', 29: 'Сопр. мечу', 30: 'Сопр. двуручному', 31: 'Сопр. кинжалу',
	32: 'Сопр. колоколу', 33: 'Сопр. вееру', 34: 'Сопр. луку', 35: 'Сопр. огню', 36: 'Сопр. молнии',
	37: 'Сопр. магии', 38: 'Сопр. ветру', 39: 'Отражение ближнего боя', 40: 'Отражение проклятий', 41: 'Сниж. урона от яда',
	42: 'Мана за убийство', 43: 'Бонус опыта', 44: 'Бонус золота', 45: 'Бонус дропа', 46: 'Эффект зелий',
	47: 'Здоровье за убийство', 48: 'Иммун. к оглушению', 49: 'Иммун. к замедлению', 50: 'Иммун. к падению', 51: 'Навык', 52: 'Дальность лука',
	53: 'Сила атаки', 54: 'Бонус защиты', 55: 'Маг. атака', 56: 'Маг. защита', 57: 'Шанс проклятия',
	58: 'Макс. выносливость', 59: 'Атака против Воинов', 60: 'Атака против Ниндзя', 61: 'Атака против Сур', 62: 'Атака против Шаманов',
	63: 'Атака против Монстров', 64: 'Атака (премиум)', 65: 'Защита (премиум)', 66: 'Опыт (премиум)', 67: 'Дроп (премиум)',
	68: 'Золото (премиум)', 69: 'Макс. здоровье', 70: 'Макс. мана', 71: 'Урон навыков', 72: 'Урон атак',
	73: 'Защита от навыков', 74: 'Защита от атак', 75: 'Опыт (ПК-бар)', 76: 'Дроп (ПК-бар)', 77: 'Расход здоровья',
	78: 'Сопр. Воинам', 79: 'Сопр. Ниндзя', 80: 'Сопр. Сурам', 81: 'Сопр. Шаманам', 82: 'Энергия',
	83: 'Защита', 84: 'Бонус атрибутов костюма', 85: 'Маг. атака', 86: 'Бл. + маг. атака',
	87: 'Сопр. льду', 88: 'Сопр. земле', 89: 'Сопр. тьме', 90: 'Сопр. криту', 91: 'Сопр. пробиванию'
}
function applyLabel(type: number, lang: Lang): string {
	return (lang === 'ru' ? APPLY_RU : APPLY_EN)[type] ?? `#${type}`
}

const STAT: Record<string, { en: string, ru: string }> = {
	attack: { en: 'Attack', ru: 'Атака' },
	magicAttack: { en: 'Magic Attack', ru: 'Маг. атака' },
	defense: { en: 'Defense', ru: 'Защита' },
	magicDefense: { en: 'Magic Defense', ru: 'Маг. защита' },
	level: { en: 'Required Level', ru: 'Требуемый уровень' }
}
function statLabel(key: string, lang: Lang): string { return STAT[key]?.[lang] ?? key }

// Applies shown as a percentage in the client tooltip (locale_game.txt format has %%).
const PERCENT_APPLIES = new Set([
	7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
	29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 57,
	59, 60, 61, 62, 63, 64, 65, 66, 69, 70, 71, 72, 73, 74, 75, 76, 78, 79, 80, 81,
	84, 85, 86, 87, 88, 89, 90, 91
])

export function parseRefine(name: string): { base: string, level: number } | null {
	const m = /^(.*?)\s*\+(\d+)$/.exec(name)
	return m ? { base: m[1].trim(), level: Number(m[2]) } : null
}

export function iconId(vnum: number): string {
	return String(Math.floor(vnum / 10) * 10).padStart(5, '0')
}

type Row = Record<string, number>

// Type-specific value-field decoding (mirrors uitooltip.py). Returns localized labels.
export function decodeStats(it: Row, lang: Lang): { label: string, text: string }[] {
	const out: { label: string, text: string }[] = []
	const range = (min: number, max: number) => (max > min ? `${min} - ${max}` : String(min))
	if (it.type === 1) {
		const add = it.value5 || 0
		const pMin = (it.value3 || 0) + add, pMax = (it.value4 || 0) + add
		if (pMin > 0 || pMax > 0) out.push({ label: statLabel('attack', lang), text: range(pMin, pMax) })
		if ((it.value1 || 0) > 0 || (it.value2 || 0) > 0) out.push({ label: statLabel('magicAttack', lang), text: range((it.value1 || 0) + add, (it.value2 || 0) + add) })
	} else if (it.type === 2) {
		const def = (it.value1 || 0) + (it.value5 || 0) * 2
		if ((it.value1 || 0) > 0) out.push({ label: statLabel('defense', lang), text: String(def) })
		if ((it.value0 || 0) > 0) out.push({ label: statLabel('magicDefense', lang), text: String(it.value0) })
	}
	return out
}

// Applies with their slot index + type, so the caller can decide per-slot whether the value
// varies across refine levels (=> characteristic) or stays constant (=> bonus).
export function appliesIndexed(it: Row, lang: Lang): { idx: number, type: number, label: string, value: number, percent: boolean }[] {
	const out = []
	for (let i = 0; i < 3; i++) {
		const t = it[`applytype${i}`], v = it[`applyvalue${i}`]
		if (t && v) out.push({ idx: i, type: t, label: applyLabel(t, lang), value: v, percent: PERCENT_APPLIES.has(t) })
	}
	return out
}

export function describeLimits(it: Row, lang: Lang): { label: string, value: number }[] {
	const out = []
	for (let i = 0; i < 2; i++) {
		const t = it[`limittype${i}`], v = it[`limitvalue${i}`]
		if (t === 1 && v > 0) out.push({ label: statLabel('level', lang), value: v })
	}
	return out
}

// Class/gender from antiflag (item_length.h): set bit = CANNOT use. FEMALE=1,MALE=2,WAR=4,ASSA=8,SURA=16,SHAM=32.
export function decodeRestrictions(antiflag: number): { classes: string[], gender: 'male' | 'female' | 'both' | 'none' } {
	const classes: string[] = []
	if (!(antiflag & 4)) classes.push('warrior')
	if (!(antiflag & 8)) classes.push('assassin')
	if (!(antiflag & 16)) classes.push('sura')
	if (!(antiflag & 32)) classes.push('shaman')
	const noFemale = !!(antiflag & 1), noMale = !!(antiflag & 2)
	const gender = noFemale && noMale ? 'none' : noFemale ? 'male' : noMale ? 'female' : 'both'
	return { classes, gender }
}
