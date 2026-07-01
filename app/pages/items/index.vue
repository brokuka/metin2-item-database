<script setup lang="ts">
const { t, locale } = useI18n()
// Standalone wiki -> home; shell overrides wikiHome to its /wiki hub.
const wikiHome = useAppConfig().wikiHome || '/'

useHead({ title: () => (locale.value === 'ru' ? 'Предметы' : 'Items') })

const CATS = [1, 2, 3, 5, 6, 9, 10, 17, 18, 23, 28, 29, 33, 34]

// A valid lucide icon per category (loosely themed; the set only needs to be valid).
const CAT_ICON: Record<string, string> = {
	all: 'i-lucide-layout-grid',
	1: 'i-lucide-sword',
	2: 'i-lucide-shield',
	3: 'i-lucide-flask-conical',
	5: 'i-lucide-boxes',
	6: 'i-lucide-sparkles',
	9: 'i-lucide-coins',
	10: 'i-lucide-diamond',
	17: 'i-lucide-book-marked',
	18: 'i-lucide-scroll-text',
	23: 'i-lucide-gift',
	28: 'i-lucide-shirt',
	29: 'i-lucide-flame',
	33: 'i-lucide-gem',
	34: 'i-lucide-square-dashed',
}

const catCards = computed(() => {
	// Hide categories with no items on this server (e.g. Rings when the DB has no type-33).
	const present: number[] = data.value?.types ?? []
	return [
		{ value: 'all' as number | 'all', label: t('items.allCategories'), icon: CAT_ICON.all },
		...CATS.filter(v => !present.length || present.includes(v))
			.map(v => ({ value: v as number | 'all', label: t(`category.${v}`), icon: CAT_ICON[v] })),
	]
})

// State is initialised from the URL query and synced back to it, so search/filters survive
// reloads, back/forward and are shareable.
const route = useRoute()
const router = useRouter()

const q = ref(String(route.query.q ?? ''))
const type = ref<number | 'all'>(route.query.type ? Number(route.query.type) : 'all')
const cls = ref(String(route.query.class ?? 'all')) // character class the item is usable by
const gender = ref(String(route.query.gender ?? 'all'))
const sort = ref(String(route.query.sort ?? 'id'))
const dir = ref<'asc' | 'desc'>(route.query.dir === 'desc' ? 'desc' : 'asc')
const page = ref(Number(route.query.page) || 1)

const classOptions = computed(() => [
	{ label: locale.value === 'ru' ? 'Все классы' : 'All classes', value: 'all' },
	...(['warrior', 'assassin', 'sura', 'shaman'] as const).map(c => ({ label: t(`class.${c}`), value: c })),
])

// Smoothly scroll to the top when paging.
watch(page, () => {
	if (import.meta.client)
		window.scrollTo({ top: 0, behavior: 'smooth' })
})

const debouncedQ = ref(q.value)
let timer: ReturnType<typeof setTimeout>
watch(q, (v) => {
	clearTimeout(timer)
	timer = setTimeout(() => {
		debouncedQ.value = v
	}, 300)
})

const sortOptions = computed(() => [
	{ label: t('sort.id'), value: 'id' },
	{ label: t('sort.name'), value: 'name' },
	{ label: t('sort.level'), value: 'level' },
])
watch([debouncedQ, type, cls, gender, sort, dir], () => {
	page.value = 1
})

// reflect state in the URL (replace, so we don't spam history); omit defaults to keep it clean
watch([q, type, cls, gender, sort, dir, page], () => {
	router.replace({
		query: {
			...(q.value ? { q: q.value } : {}),
			...(type.value !== 'all' ? { type: type.value } : {}),
			...(cls.value !== 'all' ? { class: cls.value } : {}),
			...(gender.value !== 'all' ? { gender: gender.value } : {}),
			...(sort.value !== 'id' ? { sort: sort.value } : {}),
			...(dir.value !== 'asc' ? { dir: dir.value } : {}),
			...(page.value !== 1 ? { page: page.value } : {}),
		},
	})
})

const { data, status } = await useFetch('/api/items', {
	query: { q: debouncedQ, type, class: cls, gender, sort, dir, page, lang: locale },
	getCachedData: cachedData,
})

</script>

<template>
	<div>
		<BackButton :to="wikiHome" :label="wikiHome === '/' ? (locale === 'ru' ? 'Главная' : 'Home') : 'Wiki'" class="mb-3" />

		<div class="mb-6">
			<h1 class="font-display text-2xl font-bold uppercase tracking-wide text-default">
				{{ t('items.title') }}
			</h1>

			<p class="text-sm text-muted">
				{{ t('items.liveCount', { count: data?.total ?? 0 }) }}
			</p>
		</div>

		<!-- Category cards -->
		<div class="mb-6 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-7">
			<button
				v-for="c in catCards" :key="c.value"
				class="flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition"
				:class="type === c.value
					? 'border-primary bg-primary/10 text-primary'
					: 'border-default bg-default/40 text-muted hover:border-primary/40 hover:text-default'"
				@click="type = c.value"
			>
				<UIcon :name="c.icon" class="size-6 shrink-0" />

				<span class="text-xs font-medium leading-tight">{{ c.label }}</span>
			</button>
		</div>

		<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_250px]">
			<!-- Filters: right column, sticky on desktop, top on mobile -->
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

					<div class="flex gap-2">
						<USelect v-model="cls" :items="classOptions" icon="i-lucide-user" class="min-w-0 flex-1" />

						<div class="flex shrink-0 gap-1">
							<UButton
								:color="gender === 'male' ? 'primary' : 'neutral'" :variant="gender === 'male' ? 'soft' : 'subtle'"
								icon="i-lucide-mars" square :aria-label="t('gender.male')" :title="t('gender.male')"
								@click="gender = gender === 'male' ? 'all' : 'male'"
							/>

							<UButton
								:color="gender === 'female' ? 'primary' : 'neutral'" :variant="gender === 'female' ? 'soft' : 'subtle'"
								icon="i-lucide-venus" square :aria-label="t('gender.female')" :title="t('gender.female')"
								@click="gender = gender === 'female' ? 'all' : 'female'"
							/>
						</div>
					</div>
				</div>
			</aside>

			<!-- Items column -->
			<div class="lg:col-start-1 lg:row-start-1">
				<div v-if="data?.items?.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3">
			<NuxtLink
				v-for="item in data.items" :key="item.vnum" :to="`/items/${item.vnum}`"
			>
				<UCard class="cursor-pointer transition hover:ring-2 hover:ring-primary" :ui="{ body: 'p-3' }">
						<div class="flex items-center gap-3">
							<div class="flex size-16 shrink-0 items-center justify-center">
								<img
									v-if="item.icon" :src="`/icons/items/${item.icon}.webp`" :alt="item.name"
									class="max-h-full max-w-full object-contain" style="image-rendering: pixelated"
								/>

								<UIcon v-else name="i-lucide-package" class="size-7 text-dimmed" />
							</div>

							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium text-default">
									{{ item.name }}
								</p>

								<div class="mt-1 flex flex-wrap items-center gap-1">
									<UBadge size="sm" variant="subtle" color="neutral" :label="`#${item.vnum}`" />

									<UBadge size="sm" variant="subtle" :label="item.typeLabel" />

									<UBadge v-if="item.refine" size="sm" variant="subtle" color="warning" :label="`+0-${item.refine}`" />
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
