import { defineConfig } from 'drizzle-kit'

// Drizzle is a typed query layer over the game server's EXISTING schema.
// Use `drizzle-kit pull` to regenerate server/db/schema.ts from the live DB.
// Do NOT run `drizzle-kit push/migrate` against these tables — the server owns the schema.
export default defineConfig({
	dialect: 'mysql',
	schema: './server/db/schema.ts',
	out: './server/db/migrations',
	dbCredentials: {
		host: process.env.NUXT_DB_HOST || '127.0.0.1',
		port: Number(process.env.NUXT_DB_PORT) || 3306,
		user: process.env.NUXT_DB_USER || 'root',
		password: process.env.NUXT_DB_PASSWORD || '',
		database: process.env.NUXT_DB_DATABASE || 'player',
	},
})
