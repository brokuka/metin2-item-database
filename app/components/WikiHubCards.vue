<script setup lang="ts">
// The two wiki section cards (Items / Monsters & NPC) with live DB counts.
// Shared by the home hero and the /wiki hub page.
const { locale } = useI18n()
const lang = computed(() => (locale.value === 'ru' ? 'ru' : 'en'))

const { data } = await useFetch('/api/items', { query: { limit: 1 }, getCachedData: cachedData })
const { data: mobsData } = await useFetch('/api/mobs', { query: { limit: 1 }, getCachedData: cachedData })

const sections = computed(() => [
	{
		to: '/items',
		icon: 'i-lucide-swords',
		title: lang.value === 'ru' ? 'Предметы' : 'Items',
		desc: lang.value === 'ru' ? 'Оружие, броня, расходники — статы, требования, команда выдачи.' : 'Weapons, armor, consumables — stats, requirements, give command.',
		count: data.value?.total ?? 0,
		unit: lang.value === 'ru' ? 'предметов' : 'items',
	},
	{
		to: '/mobs',
		icon: 'i-lucide-skull',
		title: lang.value === 'ru' ? 'Монстры и NPC' : 'Monsters & NPCs',
		desc: lang.value === 'ru' ? 'Мобы, боссы, NPC и камни духа — уровни, HP, урон, опыт, дроп.' : 'Mobs, bosses, NPCs and metin stones — levels, HP, damage, exp, drops.',
		count: mobsData.value?.total ?? 0,
		unit: lang.value === 'ru' ? 'существ' : 'creatures',
	},
])
</script>

<template>
	<section class="grid gap-4 sm:grid-cols-2">
		<NuxtLink
			v-for="s in sections" :key="s.to" :to="s.to"
			class="group flex flex-col gap-3 rounded-2xl border border-default bg-default/50 p-6 transition hover:border-primary/50 hover:bg-default"
		>
			<div class="flex items-center justify-between">
				<div class="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
					<UIcon :name="s.icon" class="size-7" />
				</div>

				<UIcon name="i-lucide-arrow-right" class="size-5 text-muted transition group-hover:translate-x-1 group-hover:text-primary" />
			</div>

			<h2 class="font-display text-xl font-semibold uppercase tracking-wide text-default">
				{{ s.title }}
			</h2>

			<p class="text-sm text-muted">
				{{ s.desc }}
			</p>

			<p class="mt-auto flex items-baseline gap-1.5 text-sm">
				<span class="font-display font-bold tabular-nums text-primary">{{ s.count.toLocaleString(locale) }}</span>

				<span class="text-muted">{{ s.unit }}</span>
			</p>
		</NuxtLink>
	</section>
</template>
