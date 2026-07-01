import type { Lang } from './itemNames'
import { readFileSync } from 'node:fs'
import iconv from 'iconv-lite'

// Localized mob names from the server's lists:
//   <M2_NAMES_DIR>/mob_names_<lang>.txt  (VNUM<TAB>NAME, header row, CRLF)
// EN is ASCII, RU is CP1251 — same shape as item_names.
const DIR = process.env.M2_NAMES_DIR || '../server/gamefiles/conf'
const ENC: Record<string, string> = { en: 'utf8', ru: 'win1251' }
const cache: Partial<Record<Lang, Map<number, string>>> = {}

function load(lang: Lang): Map<number, string> {
	if (cache[lang])
		return cache[lang]!
	const map = new Map<number, string>()
	try {
		const txt = iconv.decode(readFileSync(`${DIR}/mob_names_${lang}.txt`), ENC[lang] ?? 'utf8')
		for (const line of txt.split(/\r?\n/).slice(1)) {
			const tab = line.indexOf('\t')
			if (tab < 0)
				continue
			const vnum = Number(line.slice(0, tab))
			if (vnum)
				map.set(vnum, line.slice(tab + 1).trim())
		}
	}
	catch { /* fall back to caller-supplied name */ }
	cache[lang] = map
	return map
}

export function mobName(vnum: number, lang: Lang, fallback = ''): string {
	return load(lang).get(vnum) || load('en').get(vnum) || fallback
}
