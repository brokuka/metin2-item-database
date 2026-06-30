import { fileURLToPath } from 'node:url'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',
	devtools: { enabled: true },

	modules: [
		'@nuxt/image',
		'@nuxt/ui',
		'@nuxt/eslint',
		'@nuxtjs/i18n',
	],

	eslint: {
		config: {
			standalone: false,
		},
	},

	// Resolve relative to THIS layer (not the consuming app's srcDir), so it works
	// both standalone and when extended as a layer (git submodule).
	css: [fileURLToPath(new URL('./app/assets/css/main.css', import.meta.url))],

	i18n: {
		strategy: 'no_prefix',
		defaultLocale: 'en',
		locales: [
			{ code: 'en', name: 'English', file: 'en.json' },
			{ code: 'ru', name: 'Русский', file: 'ru.json' },
		],
		detectBrowserLanguage: { useCookie: true, cookieKey: 'i18n_locale', redirectOn: 'root' },
	},

	// Server-only DB config. Point these at YOUR Metin2 game DB.
	// Override via env: NUXT_DB_HOST, NUXT_DB_PORT, NUXT_DB_USER, NUXT_DB_PASSWORD, NUXT_DB_DATABASE.
	runtimeConfig: {
		db: {
			host: '127.0.0.1',
			port: 3306,
			user: 'root',
			password: '',
			database: 'player',
		},
	},

	vite: {
		optimizeDeps: {
			include: [
				'@vue/devtools-core',
				'@vue/devtools-kit',
			],
		},
	},
})
