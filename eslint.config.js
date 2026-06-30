import antfu from '@antfu/eslint-config'
import nuxt from './.nuxt/eslint.config.mjs'

export default antfu(
	{
		formatters: true,
		stylistic: {
			indent: 'tab',
		},
	},
	{
		rules: {
			// Nuxt/Nitro — process и Buffer это легитимные глобалы, require тут не нужен
			'node/prefer-global/process': 'off',
			'node/prefer-global/buffer': 'off',
		},
	},
)
	.append(nuxt())
