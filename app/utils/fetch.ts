// Reuse an already-fetched useFetch result (SSR payload or static) instead of re-hitting the
// server for the same key. Pass as `getCachedData` to useFetch. Auto-imported by Nuxt.
export function cachedData(key: string, app: { payload: { data: Record<string, unknown> }, static: { data: Record<string, unknown> } }) {
	return app.payload.data[key] ?? app.static.data[key]
}
