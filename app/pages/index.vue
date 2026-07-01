<script setup lang="ts">
const { locale } = useI18n()

useHead({ title: () => (locale.value === 'ru' ? 'Главная' : 'Home') })

const { data } = await useFetch('/api/items', { query: { limit: 1 }, getCachedData: cachedData })
const { data: mobsData } = await useFetch('/api/mobs', { query: { limit: 1 }, getCachedData: cachedData })
// (item/mob counts feed the hero total; the section cards live in <WikiHubCards>)

// Combined DB size: items + creatures.
const total = computed(() => (data.value?.total ?? 0) + (mobsData.value?.total ?? 0))

// Count-up on first client render. Starts at the real total (SSR/hydration match),
// then animates 0 -> total. Skipped when the user prefers reduced motion.
const displayTotal = ref(total.value)
onMounted(() => {
	const target = total.value
	if (target <= 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		displayTotal.value = target
		return
	}
	const duration = 1200
	let startTs = 0
	const tick = (ts: number) => {
		if (!startTs)
			startTs = ts
		const p = Math.min((ts - startTs) / duration, 1)
		displayTotal.value = Math.round(target * (1 - (1 - p) ** 3)) // easeOutCubic
		if (p < 1)
			requestAnimationFrame(tick)
	}
	displayTotal.value = 0
	requestAnimationFrame(tick)
})

const m = computed(() => locale.value === 'ru'
	? {
			eyebrow: 'Онлайн-база игрового мира',
			lead: 'Весь мир',
			sub: 'Предметы, монстры и NPC — статы, требования, дроп и команды, прямо из игровой базы.',
			items: 'записей в базе',
		}
	: {
			eyebrow: 'Online game database',
			lead: 'The whole world',
			sub: 'Items, monsters and NPCs — stats, requirements, drops and commands, straight from the game database.',
			items: 'entries in the database',
		})

</script>

<template>
	<div class="flex flex-col gap-12 py-6">
		<section class="flex flex-col items-start gap-5">
			<p class="font-display text-xs font-semibold uppercase tracking-[0.3em] text-primary/75">
				{{ m.eyebrow }}
			</p>

			<h1 class="font-display max-w-2xl text-5xl font-bold uppercase leading-[0.95] tracking-tight sm:text-6xl">
				{{ m.lead }}
				<span class="bg-gradient-to-br from-primary-300 to-primary-600 bg-clip-text text-transparent">Metin2</span>
			</h1>

			<p class="max-w-xl text-balance text-muted">
				{{ m.sub }}
			</p>

			<div class="mt-1 flex items-baseline gap-2">
				<span
					class="font-display inline-block text-right text-3xl font-bold tabular-nums text-primary"
					:style="{ minWidth: `${total.toLocaleString(locale).length}ch` }"
				>{{ displayTotal.toLocaleString(locale) }}</span>

				<span class="text-sm text-muted">{{ m.items }}</span>
			</div>
		</section>

		<WikiHubCards />
	</div>
</template>
