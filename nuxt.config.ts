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

	app: {
		pageTransition: { name: 'page', mode: 'out-in' },

		head: {
			titleTemplate: '%s · Metin2',
			link: [
				{ rel: 'preconnect', href: 'https://fonts.googleapis.com' },
				{ rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
				{ rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&display=swap' },
			],
		},
	},

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
		public: {
			// Server's max player level (caps the exp calculator). Override: NUXT_PUBLIC_MAX_LEVEL.
			maxLevel: 99,
			// Server's max item stack (ITEM_MAX_COUNT). Override: NUXT_PUBLIC_MAX_STACK.
			maxStack: 200,
		},
		// Absolute path to this layer's converted item icons. Resolved here (config runs
		// in Node with a correct import.meta.url) because a cwd/bundle-relative path can't
		// find the layer's public/ once this is consumed as a layer. Override: NUXT_ICON_DIR.
		iconDir: fileURLToPath(new URL('./public/icons/items', import.meta.url)),
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
