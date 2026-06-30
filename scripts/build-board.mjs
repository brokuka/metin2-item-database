// Build the in-game tooltip frame sprite from the client's ThinBoard textures.
// uitooltip.py uses ui.ThinBoard: 16x16 corner + line images, and a solid black 51% fill.
// We bake only the corners+edges into a 48x48 9-slice (center transparent); the fill is CSS.
// Output: web/public/ui/board.webp. Run: bun scripts/build-board.mjs
import { readFileSync, mkdirSync } from 'node:fs'
import TGA from 'tga'
import sharp from 'sharp'

// Point this at YOUR client's pack dir: env M2_PACK_DIR, or CLI arg, else the default.
const PACK = process.argv[2] || process.env.M2_PACK_DIR || '../client/bin/pack'
const BASE = `${PACK}/ETC/ymir work/ui/pattern/`
const OUT = './public/ui'
mkdirSync(OUT, { recursive: true })

function cell(name) {
	const t = new TGA(readFileSync(BASE + name + '.tga'))
	return sharp(Buffer.from(t.pixels), { raw: { width: t.width, height: t.height, channels: 4 } }).png().toBuffer()
}

const parts = {
	tl: 'thinboard_corner_lefttop', tr: 'thinboard_corner_righttop', bl: 'thinboard_corner_leftbottom', br: 'thinboard_corner_rightbottom',
	t: 'thinboard_line_top', b: 'thinboard_line_bottom', l: 'thinboard_line_left', r: 'thinboard_line_right'
}
const buf = Object.fromEntries(await Promise.all(Object.entries(parts).map(async ([k, v]) => [k, await cell(v)])))

await sharp({ create: { width: 48, height: 48, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
	.composite([
		{ input: buf.tl, left: 0, top: 0 }, { input: buf.t, left: 16, top: 0 }, { input: buf.tr, left: 32, top: 0 },
		{ input: buf.l, left: 0, top: 16 }, /* center stays transparent */ { input: buf.r, left: 32, top: 16 },
		{ input: buf.bl, left: 0, top: 32 }, { input: buf.b, left: 16, top: 32 }, { input: buf.br, left: 32, top: 32 }
	])
	.webp({ lossless: true })
	.toFile(OUT + '/board.webp')

console.log('built public/ui/board.webp (48x48 ThinBoard 9-slice, transparent center)')
