<script setup lang="ts">
const { t, locale } = useI18n()
// Standalone wiki -> home; shell overrides wikiHome to its /wiki hub.
const wikiHome = useAppConfig().wikiHome || '/'

useHead({ title: () => (locale.value === 'ru' ? 'Монстры и NPC' : 'Monsters & NPCs') })

const KINDS = ['monster', 'boss', 'npc', 'stone'] as const
const KIND_ICON: Record<string, string> = {
	all: 'i-lucide-layout-grid',
	monster: 'i-lucide-paw-print',
	boss: 'i-lucide-skull',
	npc: 'i-lucide-user-round',
	stone: 'i-lucide-hexagon',
}
const KIND_LABEL: Record<string, { ru: string, en: string }> = {
	all: { ru: 'Все', en: 'All' },
	monster: { ru: 'Монстры', en: 'Monsters' },
	boss: { ru: 'Боссы', en: 'Bosses' },
	npc: { ru: 'NPC', en: 'NPC' },
	stone: { ru: 'Камни духа', en: 'Metin Stones' },
}
const KIND_COLOR: Record<string, string> = {
	monster: 'neutral',
	boss: 'error',
	npc: 'info',
	stone: 'warning',
}
const lang = computed(() => (locale.value === 'ru' ? 'ru' : 'en'))

// Mobs whose wiki image 404'd -> fall back to the kind icon.
const failed = reactive(new Set<number>())
// Loaded images -> fade in (avoids the blink when a new page's images load).
const loaded = reactive(new Set<number>())
// Which image candidate we're on per mob (browser steps through the list on error).
const imgIdx = reactive<Record<number, number>>({})
function nextImg(vnum: number, len: number) {
	const next = (imgIdx[vnum] ?? 0) + 1
	if (next >= len)
		failed.add(vnum)
	else
		imgIdx[vnum] = next
}

const kindCards = computed(() => [
	{ value: 'all', label: KIND_LABEL.all[lang.value], icon: KIND_ICON.all },
	...KINDS.map(k => ({ value: k, label: KIND_LABEL[k][lang.value], icon: KIND_ICON[k] })),
])

const route = useRoute()
const router = useRouter()

const q = ref(String(route.query.q ?? ''))
const kind = ref(String(route.query.kind ?? 'all'))
const sort = ref(String(route.query.sort ?? 'id'))
const dir = ref<'asc' | 'desc'>(route.query.dir === 'desc' ? 'desc' : 'asc')
const page = ref(Number(route.query.page) || 1)
const onlyDrops = ref(route.query.drops === '1') // server-side filter
const onlyImage = ref(route.query.img === '1') // client-side (image existence isn't known server-side)

// Smoothly scroll to the top when paging.
watch(page, () => {
	if (import.meta.client)
		window.scrollTo({ top: 0, behavior: 'smooth' })
})

const debouncedQ = ref(q.value)
let timer: ReturnType<typeof setTimeout>
watch(q, (v) => {
	clearTimeout(timer)
	timer = setTimeout(() => { debouncedQ.value = v }, 300)
})

const sortOptions = computed(() => [
	{ label: t('sort.id'), value: 'id' },
	{ label: t('sort.name'), value: 'name' },
	{ label: t('sort.level'), value: 'level' },
])

watch([debouncedQ, kind, sort, dir, onlyDrops], () => { page.value = 1 })

watch([q, kind, sort, dir, page, onlyDrops, onlyImage], () => {
	router.replace({
		query: {
			...(q.value ? { q: q.value } : {}),
			...(kind.value !== 'all' ? { kind: kind.value } : {}),
			...(sort.value !== 'id' ? { sort: sort.value } : {}),
			...(dir.value !== 'asc' ? { dir: dir.value } : {}),
			...(onlyDrops.value ? { drops: '1' } : {}),
			...(onlyImage.value ? { img: '1' } : {}),
			...(page.value !== 1 ? { page: page.value } : {}),
		},
	})
})

const { data, status } = await useFetch('/api/mobs', {
	query: { q: debouncedQ, kind, sort, dir, page, lang: locale, drops: computed(() => (onlyDrops.value ? '1' : undefined)) },
	getCachedData: cachedData,
})

// "Has image" isn't known server-side (Gameforge wiki), so filter client-side by mobs whose
// image actually loaded (failed = every candidate 404'd).
const visibleMobs = computed(() => {
	const list = data.value?.mobs ?? []
	return onlyImage.value ? list.filter(m => !failed.has(m.vnum)) : list
})

</script>

<template>
	<div>
		<BackButton :to="wikiHome" :label="wikiHome === '/' ? (locale === 'ru' ? 'Главная' : 'Home') : 'Wiki'" class="mb-3" />

		<div class="mb-6">
			<h1 class="font-display text-2xl font-bold uppercase tracking-wide text-default">
				{{ lang === 'ru' ? 'Монстры и NPC' : 'Monsters & NPCs' }}
			</h1>

			<p class="text-sm text-muted">
				{{ lang === 'ru' ? `Напрямую с сервера — ${data?.total ?? 0} существ` : `Live from the server — ${data?.total ?? 0} creatures` }}
			</p>
		</div>

		<!-- Kind cards -->
		<div class="mb-6 grid grid-cols-3 gap-2 sm:grid-cols-5">
			<button
				v-for="c in kindCards" :key="c.value"
				class="flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition"
				:class="kind === c.value
					? 'border-primary bg-primary/10 text-primary'
					: 'border-default bg-default/40 text-muted hover:border-primary/40 hover:text-default'"
				@click="kind = c.value"
			>
				<UIcon :name="c.icon" class="size-6 shrink-0" />

				<span class="text-xs font-medium leading-tight">{{ c.label }}</span>
			</button>
		</div>

		<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_250px]">
			<aside class="lg:order-last lg:sticky lg:top-4 lg:col-start-2 lg:row-start-1 lg:self-start">
				<div class="m2-frame flex flex-col gap-3">
					<UInput
						v-model="q" icon="i-lucide-search" :placeholder="t('items.search')" class="w-full"
						:loading="status === 'pending'"
					/>

					<div class="flex gap-2">
						<USelect v-model="sort" :items="sortOptions" icon="i-lucide-arrow-up-down" class="flex-1" />

						<UButton
							color="neutral" variant="subtle"
							:icon="dir === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : 'i-lucide-arrow-down-wide-narrow'" :aria-label="dir"
							@click="dir = dir === 'asc' ? 'desc' : 'asc'"
						/>
					</div>

					<div class="flex items-center justify-between gap-2 border-t border-accented pt-3">
						<span class="text-sm text-muted">{{ lang === 'ru' ? 'С картинкой' : 'With image' }}</span>

						<USwitch v-model="onlyImage" />
					</div>

					<div class="flex items-center justify-between gap-2">
						<span class="text-sm text-muted">{{ lang === 'ru' ? 'С дропом' : 'With drops' }}</span>

						<USwitch v-model="onlyDrops" />
					</div>
				</div>
			</aside>

			<div class="lg:col-start-1 lg:row-start-1">
				<div v-if="visibleMobs.length" class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
					<NuxtLink
						v-for="mob in visibleMobs" :key="mob.vnum"
						:to="`/mobs/${mob.vnum}`"
					>
						<UCard class="cursor-pointer transition hover:ring-2 hover:ring-primary" :ui="{ body: 'p-3' }">
							<div class="flex items-center gap-3">
								<div class="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-elevated/60">
									<img
										v-if="mob.images?.length && !failed.has(mob.vnum)"
										:src="mob.images[imgIdx[mob.vnum] ?? 0]" :alt="mob.name"
										class="size-full object-contain transition-opacity duration-300"
										:class="loaded.has(mob.vnum) ? 'opacity-100' : 'opacity-0'"
										loading="lazy" @load="loaded.add(mob.vnum)" @error="nextImg(mob.vnum, mob.images.length)"
									>

									<UIcon v-else :name="KIND_ICON[mob.kind]" class="size-6 text-muted" />
								</div>

								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium text-default">
										{{ mob.name }}
									</p>

									<div class="mt-1 flex flex-wrap items-center gap-1">
										<UBadge size="sm" variant="subtle" color="neutral" :label="`#${mob.vnum}`" />

										<UBadge size="sm" variant="subtle" :color="KIND_COLOR[mob.kind]" :label="mob.kindLabel" />

										<UBadge v-if="mob.kind !== 'npc'" size="sm" variant="subtle" color="primary" :label="`Lv ${mob.level}`" />
									</div>
								</div>
							</div>
						</UCard>
					</NuxtLink>
				</div>

				<p v-else class="py-12 text-center text-muted">
					{{ t('items.none') }}
				</p>

				<div v-if="data && data.total > data.limit" class="mt-6 flex justify-center">
					<UPagination v-model:page="page" :total="data.total" :items-per-page="data.limit" />
				</div>
			</div>
		</div>
	</div>
</template>
