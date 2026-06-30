import type { Lang } from './itemNames'
import { readFileSync } from 'node:fs'
import iconv from 'iconv-lite'

// Short item descriptions from the client: locale_<lang>/locale/<lang>/itemdesc.txt
// Format: VNUM<TAB>NAME<TAB>DESCRIPTION. EN ascii, RU cp1251. Partial coverage (special items).
const DIR = process.env.M2_PACK_DIR || '../client/bin/pack'
const ENC: Record<string, string> = { en: 'utf8', ru: 'win1251' }
const cache: Partial<Record<Lang, Map<number, string>>> = {}

function load(lang: Lang): Map<number, string> {
	if (cache[lang])
		return cache[lang]!
	const map = new Map<number, string>()
	try {
		const txt = iconv.decode(readFileSync(`${DIR}/locale_${lang}/locale/${lang}/itemdesc.txt`), ENC[lang] ?? 'utf8')
		for (const line of txt.split(/\r?\n/)) {
			const c = line.split('\t')
			const vnum = Number(c[0])
			if (vnum && c[2])
				map.set(vnum, c[2].trim())
		}
	}
	catch { /* ignore */ }
	cache[lang] = map
	return map
}

export function itemDesc(vnum: number, lang: Lang): string {
	return load(lang).get(vnum) || load('en').get(vnum) || ''
}
