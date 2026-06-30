<script setup lang="ts">
const { t, locale } = useI18n()

const CATS = [1, 2, 3, 5, 6, 9, 10, 17, 18, 23, 28, 29, 33, 34]
const categories = computed(() => [
	{ label: t('items.allCategories'), value: 'all' },
	...CATS.map(v => ({ label: t(`category.${v}`), value: v }))
])

// State is initialised from the URL query and synced back to it, so search/filters survive
// reloads, back/forward and are shareable.
const route = useRoute()
const router = useRouter()

const q = ref(String(route.query.q ?? ''))
const type = ref<number | 'all'>(route.query.type ? Number(route.query.type) : 'all')
const sort = ref(String(route.query.sort ?? 'id'))
const dir = ref<'asc' | 'desc'>(route.query.dir === 'desc' ? 'desc' : 'asc')
const page = ref(Number(route.query.page) || 1)

const debouncedQ = ref(q.value)
let timer: ReturnType<typeof setTimeout>
watch(q, (v) => {
	clearTimeout(timer)
	timer = setTimeout(() => { debouncedQ.value = v }, 300)
})

const sortOptions = computed(() => [
	{ label: t('sort.id'), value: 'id' },
	{ label: t('sort.name'), value: 'name' },
	{ label: t('sort.level'), value: 'level' }
])
watch([debouncedQ, type, sort, dir], () => { page.value = 1 })

// reflect state in the URL (replace, so we don't spam history); omit defaults to keep it clean
watch([q, type, sort, dir, page], () => {
	router.replace({
		query: {
			...(q.value ? { q: q.value } : {}),
			...(type.value !== 'all' ? { type: type.value } : {}),
			...(sort.value !== 'id' ? { sort: sort.value } : {}),
			...(dir.value !== 'asc' ? { dir: dir.value } : {}),
			...(page.value !== 1 ? { page: page.value } : {})
		}
	})
})

const { data, status } = await useFetch('/api/items', {
	query: { q: debouncedQ, type, sort, dir, page, lang: locale },
	// reuse already-fetched results for repeated queries instead of hitting the server again
	getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
})

// Item detail opens as a modal driven by ?v=<vnum> (shareable, back closes it). The full
// /items/[vnum] page stays as fallback for direct links / open-in-new-tab.
// Tooltip: always below the card, grow downward, never flip/shift up (avoidCollisions disables
// floating-ui flip+shift entirely — see reka PopperContent middleware).
const tooltipContent = { side: 'bottom' as const, sideOffset: 18, avoidCollisions: false }

const activeVnum = computed(() => route.query.v ? Number(route.query.v) : null)
// Keep the last opened vnum mounted through the modal's close animation (clearing it on close
// would empty the panel mid-shrink).
const shownVnum = ref<number | null>(activeVnum.value)
watch(activeVnum, (v) => { if (v) shownVnum.value = v })
const activeName = computed(() => data.value?.items?.find(i => i.vnum === shownVnum.value)?.name ?? '')
function openItem(e: MouseEvent, vnum: number) {
	if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return // let new-tab/middle-click hit the page
	e.preventDefault()
	router.push({ query: { ...route.query, v: vnum } })
}
function closeItem() {
	const { v, ...rest } = route.query
	router.push({ query: rest })
}
</script>

<template>
	<UContainer class="py-8">
		<div class="mb-6 flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold text-default">{{ t('items.title') }}</h1>
				<p class="text-sm text-muted">{{ t('items.liveCount', { count: data?.total ?? 0 }) }}</p>
			</div>
			<UButton to="/" variant="ghost" icon="i-lucide-arrow-left" :label="t('common.home')" />
		</div>

		<div class="mb-6 flex flex-col gap-3 sm:flex-row">
			<UInput v-model="q" icon="i-lucide-search" :placeholder="t('items.search')" class="flex-1"
				:loading="status === 'pending'" />
			<USelect v-model="type" :items="categories" class="w-full sm:w-48" />
			<div class="flex gap-2">
				<USelect v-model="sort" :items="sortOptions" icon="i-lucide-arrow-up-down" class="flex-1 sm:w-40" />
				<UButton color="neutral" variant="subtle"
					:icon="dir === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : 'i-lucide-arrow-down-wide-narrow'" :aria-label="dir"
					@click="dir = dir === 'asc' ? 'desc' : 'asc'" />
			</div>
		</div>

		<div v-if="data?.items?.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
			<NuxtLink v-for="item in data.items" :key="item.vnum" :to="`/items/${item.vnum}`" @click="openItem($event, item.vnum)">
				<UCard class="cursor-pointer transition hover:ring-2 hover:ring-primary" :ui="{ body: 'p-3' }">
					<UTooltip :delay-duration="150" :content="tooltipContent">
						<template #content>
							<div class="m2-board max-w-[280px]">
								<p class="text-sm font-semibold text-[#F2E7C1]">{{ item.name }}</p>
								<p v-if="item.desc" class="mt-1 text-xs leading-snug text-[#d4d4d4]">{{ item.desc }}</p>
							</div>
						</template>
						<div class="flex items-center gap-3">
							<div class="flex size-14 shrink-0 items-center justify-center">
								<NuxtImg v-if="item.icon" :src="`/icons/items/${item.icon}.webp`" :alt="item.name" height="56"
									class="max-h-full w-auto object-contain" style="image-rendering: pixelated" />
								<UIcon v-else name="i-lucide-package" class="size-7 text-dimmed" />
							</div>
							<div class="min-w-0 flex-1">
								<p class="truncate text-sm font-medium text-default">{{ item.name }}</p>
								<div class="mt-1 flex flex-wrap items-center gap-1">
									<UBadge size="sm" variant="subtle" color="neutral" :label="`#${item.vnum}`" />
									<UBadge size="sm" variant="subtle" :label="item.typeLabel" />
									<UBadge v-if="item.refine" size="sm" variant="subtle" color="warning" :label="`+0-${item.refine}`" />
								</div>
							</div>
						</div>
					</UTooltip>
				</UCard>
			</NuxtLink>
		</div>
		<p v-else class="py-12 text-center text-muted">{{ t('items.none') }}</p>

		<div v-if="data && data.total > data.limit" class="mt-6 flex justify-center">
			<UPagination v-model:page="page" :total="data.total" :items-per-page="data.limit" />
		</div>

		<UModal :open="!!activeVnum" :title="activeName" :content="{ onInteractOutside: (e: Event) => e.preventDefault() }" @update:open="(o: boolean) => { if (!o) closeItem() }">
			<template #body>
				<ItemDetail v-if="shownVnum" :key="shownVnum" :vnum="shownVnum" />
			</template>
		</UModal>
	</UContainer>
</template>
