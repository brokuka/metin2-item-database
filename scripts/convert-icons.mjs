// Convert every item icon referenced by item_list.txt -> web/public/icons/items/*.webp
// Item icons live in many pack dirs (icon/item, icon/weapon/<class>, season1/..., patches),
// so we index all .tga under any /icon/ path by basename, then convert the ones items reference.
// Run: bun scripts/convert-icons.mjs   (re-run after adding items/icons)
import { readdirSync, mkdirSync, readFileSync } from 'node:fs'
import { join, basename } from 'node:path'
import TGA from 'tga'
import sharp from 'sharp'

// Point this at YOUR client's pack dir: env M2_PACK_DIR, or CLI arg, else the default.
const PACK = process.argv[2] || process.env.M2_PACK_DIR || '../client/bin/pack'
const LIST = process.env.M2_ITEM_LIST || `${PACK}/locale_en/locale/en/item_list.txt`
const OUT = './public/icons/items'

mkdirSync(OUT, { recursive: true })

// 1) index every .tga under an /icon/ path by lowercase basename
const index = new Map()
for (const p of readdirSync(PACK, { recursive: true })) {
	const s = String(p)
	if (/[/\\]icon[/\\].*\.tga$/i.test(s)) index.set(basename(s, '.tga').toLowerCase(), s)
}

// 2) collect basenames referenced by item_list (col 3 = icon path)
const refs = new Set()
for (const line of readFileSync(LIST, 'utf8').split(/\r?\n/)) {
	const c = line.split('\t')
	if (c.length >= 3 && c[2]) refs.add(basename(c[2].trim(), '.tga').toLowerCase().replace(/\.tga$/i, ''))
}
console.log(`${refs.size} referenced icons, ${index.size} .tga indexed`)

let ok = 0, miss = 0, fail = 0
for (const name of refs) {
	const rel = index.get(name)
	if (!rel) { miss++; continue }
	try {
		const tga = new TGA(readFileSync(join(PACK, rel)))
		await sharp(Buffer.from(tga.pixels), { raw: { width: tga.width, height: tga.height, channels: 4 } })
			.webp({ lossless: true })
			.toFile(join(OUT, name + '.webp'))
		ok++
	} catch (e) {
		fail++
		console.warn(`skip ${rel}: ${e.message}`)
	}
}
console.log(`done: ${ok} ok, ${miss} no-file, ${fail} failed`)
