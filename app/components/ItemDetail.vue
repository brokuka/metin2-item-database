<script setup lang="ts">
// Shared item detail body, used by both the standalone /items/[vnum] page and the list modal.
const props = defineProps<{ vnum: number | string }>()
const { t, locale } = useI18n()
const toast = useToast()

const { data: item, error } = await useFetch(() => `/api/items/${props.vnum}`, {
	query: { lang: locale },
	getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
})

const level = ref(0)
const current = computed(() => item.value?.levels.find(l => l.level === level.value) ?? item.value?.levels[0])
const levelItems = computed(() => item.value?.levels.map(l => ({ label: `+${l.level}`, value: l.level })) ?? [])
const showClasses = computed(() => item.value?.isEquip && (item.value?.classes?.length ?? 0) > 0)

function copyCommand() {
	if (!current.value)
		return
	navigator.clipboard.writeText(current.value.giveCommand)
	toast.add({ title: t('items.copied'), description: current.value.giveCommand, color: 'success' })
}
function signed(v: number, percent: boolean) {
	return `${v > 0 ? '+' : ''}${v}${percent ? '%' : ''}`
}
</script>

<template>
	<UAlert v-if="error" color="error" :title="error.statusMessage || t('items.none')" />

	<div v-else-if="!item || !current" class="py-8 text-center text-muted">
		{{ t('items.none') }}
	</div>

	<div v-else>
		<div class="flex items-start gap-4">
			<div class="flex size-20 shrink-0 items-center justify-center rounded-lg bg-elevated/50">
				<NuxtImg
					v-if="item.icon"
					:src="`/icons/items/${item.icon}.webp`"
					:alt="item.name"
					height="72"
					class="max-h-full w-auto object-contain"
					style="image-rendering: pixelated"
				/>

				<UIcon v-else name="i-lucide-package" class="size-10 text-dimmed" />
			</div>

			<div class="min-w-0 flex-1">
				<h1 class="text-xl font-bold text-default">
					{{ item.name }}
				</h1>

				<div class="mt-2 flex flex-wrap gap-1">
					<UBadge variant="subtle" color="neutral" :label="`#${current.vnum}`" />

					<UBadge variant="subtle" :label="item.typeLabel" />

					<template v-if="showClasses">
						<UBadge v-if="item.classes.length === 4" variant="subtle" color="success" :label="t('items.allClasses')" />

						<UBadge v-for="c in item.classes" v-else :key="c" variant="subtle" color="primary" :label="t(`class.${c}`)" />
					</template>

					<UBadge v-if="item.gender !== 'both' && item.gender !== 'none'" variant="subtle" color="info" :label="t(`gender.${item.gender}`)" />
				</div>
			</div>
		</div>

		<div class="mt-4 rounded-lg bg-elevated/40 p-3">
			<p class="mb-1 text-xs font-semibold uppercase text-muted">
				{{ t('items.description') }}
			</p>

			<p class="text-sm" :class="item.description ? 'text-default' : 'italic text-dimmed'">
				{{ item.description || t('items.noDescription') }}
			</p>
		</div>

		<div v-if="levelItems.length > 1" class="mt-4">
			<p class="mb-1 text-xs font-semibold uppercase text-muted">
				{{ t('items.refineLevel') }}
			</p>

			<USelect v-model="level" :items="levelItems" class="w-32" />
		</div>

		<div class="mt-4 flex items-center gap-2">
			<UInput :model-value="current.giveCommand" readonly class="flex-1 font-mono" />

			<UButton icon="i-lucide-copy" :label="t('items.copy')" @click="copyCommand" />
		</div>

		<div v-if="current.stats?.length" class="mt-4">
			<p class="mb-1 text-xs font-semibold uppercase text-muted">
				{{ t('items.stats') }}
			</p>

			<ul class="space-y-1 text-sm">
				<li v-for="(s, i) in current.stats" :key="i" class="text-default">
					{{ s.label }}: <span class="font-medium">{{ s.text }}</span>
				</li>
			</ul>
		</div>

		<div v-if="current.limits?.length" class="mt-4">
			<p class="mb-1 text-xs font-semibold uppercase text-muted">
				{{ t('items.requirements') }}
			</p>

			<ul class="space-y-1 text-sm">
				<li v-for="(l, i) in current.limits" :key="i" class="text-default">
					{{ l.label }}: {{ l.value }}
				</li>
			</ul>
		</div>

		<div v-if="item.bonuses?.length" class="mt-4">
			<p class="mb-1 text-xs font-semibold uppercase text-muted">
				{{ t('items.bonuses') }}
			</p>

			<ul class="space-y-1 text-sm">
				<li v-for="(a, i) in item.bonuses" :key="i" :class="a.value < 0 ? 'text-error' : 'text-success'">
					{{ signed(a.value, a.percent) }} <span class="text-default">{{ a.label }}</span>
				</li>
			</ul>
		</div>

		<div v-if="current.gold" class="mt-4 text-sm text-muted">
			{{ t('items.sellPrice') }}: {{ current.gold.toLocaleString() }} {{ t('items.yang') }}
		</div>
	</div>
</template>
