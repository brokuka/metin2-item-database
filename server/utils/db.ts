import type { MySql2Database } from 'drizzle-orm/mysql2'
import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from '../db/schema'

// ponytail: one shared pool + drizzle instance, lazily created.
let db: MySql2Database<typeof schema> | undefined

export function useDb(): MySql2Database<typeof schema> {
	if (!db) {
		const { db: cfg } = useRuntimeConfig()
		const pool = mysql.createPool({
			host: cfg.host,
			port: Number(cfg.port),
			user: cfg.user,
			password: cfg.password,
			database: cfg.database,
			connectionLimit: 5,
		})
		db = drizzle(pool, { schema, mode: 'default' })
	}
	return db
}
