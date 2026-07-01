<script setup lang="ts">
const props = defineProps<{ vnum: number | string }>()
const { locale } = useI18n()
const lang = computed(() => (locale.value === 'ru' ? 'ru' : 'en'))

// No explicit key: the auto-key includes the `lang` query, so switching language refetches
// (a fixed key would make getCachedData return the stale-language copy).
const { data: mob, error } = await useFetch(() => `/api/mobs/${props.vnum}`, {
	query: { lang: locale },
	getCachedData: cachedData,
})

useHead({ title: () => mob.value?.name || (lang.value === 'ru' ? 'Монстр' : 'Monster') })

const KIND_ICON: Record<string, string> = {
	monster: 'i-lucide-paw-print',
	boss: 'i-lucide-skull',
	npc: 'i-lucide-user-round',
	stone: 'i-lucide-hexagon',
}
const KIND_COLOR: Record<string, string> = { monster: 'neutral', boss: 'error', npc: 'info', stone: 'warning' }

const tr = (ru: string, en: string) => (lang.value === 'ru' ? ru : en)

// setImmuneFlag / setRaceFlag enum values -> localized labels (fall back to the raw tag).
const IMMUNE_LABEL: Record<string, { ru: string, en: string }> = {
	STUN: { ru: 'Оглушение', en: 'Stun' },
	SLOW: { ru: 'Замедление', en: 'Slow' },
	FALL: { ru: 'Сбивание', en: 'Knockdown' },
	CURSE: { ru: 'Проклятие', en: 'Curse' },
	POISON: { ru: 'Яд', en: 'Poison' },
	TERROR: { ru: 'Страх', en: 'Terror' },
}
const RACE_LABEL: Record<string, { ru: string, en: string }> = {
	ANIMAL: { ru: 'Животное', en: 'Animal' },
	UNDEAD: { ru: 'Нежить', en: 'Undead' },
	DEVIL: { ru: 'Демон', en: 'Devil' },
	HUMAN: { ru: 'Человек', en: 'Human' },
	ORC: { ru: 'Орк', en: 'Orc' },
	MILGYO: { ru: 'Мильгё', en: 'Milgyo' },
	INSECT: { ru: 'Насекомое', en: 'Insect' },
	FIRE: { ru: 'Огонь', en: 'Fire' },
	ICE: { ru: 'Лёд', en: 'Ice' },
	DESERT: { ru: 'Пустыня', en: 'Desert' },
	TREE: { ru: 'Дерево', en: 'Tree' },
	ATT_ELEC: { ru: 'Электричество', en: 'Electric' },
	ATT_FIRE: { ru: 'Огонь (атака)', en: 'Fire (att)' },
	ATT_ICE: { ru: 'Лёд (атака)', en: 'Ice (att)' },
	ATT_WIND: { ru: 'Ветер', en: 'Wind' },
	ATT_EARTH: { ru: 'Земля', en: 'Earth' },
	ATT_DARK: { ru: 'Тьма', en: 'Dark' },
}
const flagLabel = (map: Record<string, { ru: string, en: string }>, f: string) => map[f]?.[lang.value] ?? f

// Level-delta exp scaling (server constants.cpp: aiPercentByDeltaLev[ForBoss]).
// index = clamp((mobLevel + 15) - playerLevel, 0, 30); exp = base * pct/100.
const PCT_NORMAL = [1, 5, 10, 20, 30, 50, 70, 80, 85, 90, 92, 94, 96, 98, 100, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 180]
const PCT_BOSS = [1, 3, 5, 7, 15, 30, 60, 90, 91, 92, 93, 94, 95, 97, 99, 100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 180]

const imgFailed = ref(false)
const imgIdx = ref(0)
function nextDetailImg() {
	if ((imgIdx.value + 1) >= (mob.value?.images?.length ?? 0))
		imgFailed.value = true
	else
		imgIdx.value++
}
const maxLevel = Number(useRuntimeConfig().public.maxLevel) || 99

const toast = useToast()
const command = computed(() => (mob.value ? `/m ${mob.value.vnum}` : ''))
function copyCommand() {
	navigator.clipboard.writeText(command.value)
	toast.add({ title: tr('Скопировано', 'Copied'), description: command.value, color: 'success' })
}
const playerLevel = ref(Math.min(mob.value?.level || 1, maxLevel))
const expPercent = computed(() => {
	const m = mob.value
	if (!m)
		return 100
	const idx = Math.min(Math.max((m.level + 15) - playerLevel.value, 0), 30)
	// Cap at 100%: the under-levelled bonus (up to 180%) just confuses the reward readout.
	return Math.min((m.kind === 'boss' ? PCT_BOSS : PCT_NORMAL)[idx], 100)
})
// No exp at the level cap (server stops awarding it).
const actualExp = computed(() => (playerLevel.value >= maxLevel ? 0 : Math.floor((mob.value?.exp ?? 0) * expPercent.value / 100)))
// Gold uses the same level-delta percent (char_battle.cpp RewardGold: PERCENT_LVDELTA[_BOSS]).
const actualGoldMin = computed(() => Math.floor((mob.value?.goldMin ?? 0) * expPercent.value / 100))
const actualGoldMax = computed(() => Math.floor((mob.value?.goldMax ?? 0) * expPercent.value / 100))

// Reward efficiency = the level-delta multiplier surfaced as a gauge (0..180 -> bar %), so you
// can spot the level where this mob is worth farming. 100% = baseline; higher = under-levelled.
const effClass = computed(() => (expPercent.value >= 100
	? { text: 'text-success', bar: 'bg-success' }
	: expPercent.value >= 50 ? { text: 'text-warning', bar: 'bg-warning' } : { text: 'text-error', bar: 'bg-error' }))
const effWidth = computed(() => `${expPercent.value}%`)

// --- Drops -----------------------------------------------------------------
// Real per-kill chance, derived from the server roll (ITEM_MANAGER::CreateDropItem, iRandRange
// = 4,000,000, iDeltaPercent = PERCENT_LVDELTA reused here as `d`):
//   drop / common : pct(file %) * d / 400
//   kill          : group drops ~1/killDrop per kill -> d * share / (100 * killDrop)
//   limit         : pct as-is, no delta, gated by player level >= levelLimit
// Base rate only (ignores server mob_item_rate, premium, drop privs). Reactive to "your level".
function fmtPct(p: number): string {
	if (p <= 0)
		return '0%'
	if (p >= 1)
		return `${Number(p.toFixed(1))}%`
	return `${Number(p >= 0.01 ? p.toFixed(2) : p.toPrecision(1))}%`
}
// Server drop-rate multiplier (GetMobItemRate scales iDeltaPercent) — affects drop/common/kill,
// not limit. Lets you match your server's rate instead of the base 1x.
const dropRate = ref(1)
interface DropItemLike { pct: number, source: string, killDrop?: number, levelLimit?: number }
function effPct(it: DropItemLike): string {
	const d = expPercent.value * dropRate.value
	let p: number
	if (it.source === 'kill')
		p = it.killDrop ? d * it.pct / (100 * it.killDrop) : 0
	else if (it.source === 'limit')
		p = playerLevel.value >= (it.levelLimit ?? 0) ? it.pct : 0
	else
		p = it.pct * d / 400
	return fmtPct(Math.min(p, 100))
}
const hasDrops = computed(() => (mob.value?.dropCats?.length ?? 0) > 0 || (mob.value?.commonCats?.length ?? 0) > 0)

const stats = computed(() => {
	const m = mob.value
	if (!m || m.kind === 'npc')
		return []
	return [
		{ label: tr('Уровень', 'Level'), value: String(m.level) },
		{ label: tr('Здоровье', 'Health'), value: m.maxHp.toLocaleString(locale.value) },
		{ label: tr('Урон', 'Damage'), value: `${m.damageMin}–${m.damageMax}` },
		{ label: tr('Защита', 'Defense'), value: String(m.def) },
	]
})

// Compact stat columns: base stats + speeds (localized labels).
const baseStats = computed(() => {
	const m = mob.value
	if (!m || m.kind === 'npc')
		return []
	return [
		{ label: tr('Сила', 'STR'), value: m.st },
		{ label: tr('Подвижность', 'DEX'), value: m.dx },
		{ label: tr('Здоровье', 'VIT'), value: m.ht },
		{ label: tr('Интеллект', 'INT'), value: m.iq },
		{ label: tr('Скор. атаки', 'ASPD'), value: m.attackSpeed },
		{ label: tr('Скор. движ.', 'MSPD'), value: m.moveSpeed },
	]
})
</script>

<template>
	<UAlert v-if="error" color="error" :title="error.statusMessage || 'Not found'" />

	<div v-else-if="!mob" class="py-8 text-center text-muted">
		…
	</div>

	<div v-else class="lg:grid lg:grid-cols-[24rem_minmax(0,1fr)] lg:items-start lg:gap-6">
		<div class="min-w-0">
			<div class="flex items-start gap-4">
			<div class="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-elevated/50">
				<img
					v-if="mob.images?.length && !imgFailed" :src="mob.images[imgIdx]" :alt="mob.name"
					class="size-full object-contain" @error="nextDetailImg"
				>

				<UIcon v-else :name="KIND_ICON[mob.kind]" class="size-9 text-muted" />
			</div>

			<div class="min-w-0 flex-1">
				<h1 class="text-xl font-bold text-default">
					{{ mob.name }}
				</h1>

				<div class="mt-2 flex flex-wrap gap-1">
					<UBadge variant="subtle" color="neutral" :label="`#${mob.vnum}`" />

					<UBadge variant="subtle" :color="KIND_COLOR[mob.kind]" :label="mob.kindLabel" />

					<UBadge v-if="mob.rankLabel && mob.kind !== 'npc' && mob.rankLabel !== mob.kindLabel" variant="subtle" color="primary" :label="mob.rankLabel" />
				</div>
			</div>
		</div>

		<div class="mt-4">
			<p class="mb-1 text-xs font-semibold uppercase text-muted">
				{{ tr('Команда призыва', 'Spawn command') }}
			</p>

			<div class="flex items-center gap-2">
				<UInput :model-value="command" readonly class="flex-1 font-mono" />

				<UButton icon="i-lucide-copy" color="neutral" variant="subtle" :label="tr('Копировать', 'Copy')" @click="copyCommand" />
			</div>
		</div>

		<div v-if="mob.kind !== 'npc'" class="mt-4">
			<p class="mb-1 text-xs font-semibold uppercase text-muted">
				{{ tr('Награда с моба', 'Reward per kill') }}
			</p>

			<div class="overflow-hidden rounded-lg border border-accented bg-elevated">
				<!-- level control + efficiency gauge (the reward scales by your level delta) -->
				<div class="flex items-center justify-between gap-3 border-b border-accented px-3 py-2.5">
					<div class="flex items-center gap-2">
						<span class="text-xs text-muted">{{ tr('Ваш уровень', 'Your level') }}</span>

						<UInputNumber v-model="playerLevel" :min="1" :max="maxLevel" size="sm" :ui="{ base: 'text-center' }" class="w-24" />
					</div>

					<UTooltip
						:text="tr('Множитель награды за ваш уровень.\n100% — базовый, ниже при перекачке.', 'Reward multiplier for your level.\n100% is baseline, lower when over-levelled.')"
						:ui="{ content: 'h-auto max-w-64 px-2.5 py-1.5', text: 'whitespace-pre-line text-center' }"
					>
						<div class="flex flex-col items-end gap-1">
							<span class="font-display text-sm font-bold leading-none tabular-nums" :class="effClass.text">{{ expPercent }}%</span>

							<div class="h-1 w-16 overflow-hidden rounded-full bg-default">
								<div class="h-full rounded-full transition-all duration-300 ease-out" :class="effClass.bar" :style="{ width: effWidth }" />
							</div>
						</div>
					</UTooltip>
				</div>

				<!-- reward readouts -->
				<div class="grid grid-cols-2 divide-x divide-accented">
					<div class="flex items-center gap-2.5 px-3 py-2.5">
						<div class="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
							<!-- in-game Experience Ring icon stands in for Exp -->
							<img src="/icons/items/70005.webp" alt="" class="size-6 object-contain" style="image-rendering: pixelated">
						</div>

						<div class="min-w-0">
							<p class="text-[10px] font-semibold uppercase tracking-wide text-muted">
								{{ tr('Опыт', 'Exp') }}
							</p>

							<p class="font-display text-lg font-bold leading-tight tabular-nums text-primary">
								{{ actualExp.toLocaleString(locale) }}
							</p>
						</div>
					</div>

					<div class="flex items-center gap-2.5 px-3 py-2.5">
						<div class="flex size-8 shrink-0 items-center justify-center rounded-md bg-yellow-400/10">
							<!-- in-game money icon (item vnum 1) for Yang -->
							<img src="/icons/items/money.webp" alt="" class="size-6 object-contain" style="image-rendering: pixelated">
						</div>

						<div class="min-w-0">
							<p class="text-[10px] font-semibold uppercase tracking-wide text-muted">
								{{ tr('Янг', 'Yang') }}
							</p>

							<p class="font-display text-lg font-bold leading-tight tabular-nums text-yellow-600 dark:text-yellow-300">
								{{ actualGoldMin.toLocaleString(locale) }}–{{ actualGoldMax.toLocaleString(locale) }}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div v-if="mob.raceFlags?.length || mob.immuneFlags?.length" class="mt-4 flex flex-wrap gap-x-8 gap-y-3">
			<div v-if="mob.raceFlags?.length">
				<p class="mb-1 text-xs font-semibold uppercase text-muted">
					{{ tr('Раса', 'Race') }}
				</p>

				<div class="flex flex-wrap gap-1">
					<UBadge v-for="f in mob.raceFlags" :key="f" size="sm" variant="soft" color="neutral" :label="flagLabel(RACE_LABEL, f)" />
				</div>
			</div>

			<div v-if="mob.immuneFlags?.length">
				<p class="mb-1 text-xs font-semibold uppercase text-muted">
					{{ tr('Иммунитет', 'Immunity') }}
				</p>

				<div class="flex flex-wrap gap-1">
					<UBadge v-for="f in mob.immuneFlags" :key="f" size="sm" variant="soft" color="info" :label="flagLabel(IMMUNE_LABEL, f)" />
				</div>
			</div>
		</div>

		<div v-if="stats.length" class="mt-4">
			<p class="mb-1 text-xs font-semibold uppercase text-muted">
				{{ tr('Характеристики', 'Stats') }}
			</p>

			<ul class="divide-y divide-accented rounded-lg bg-elevated px-3">
				<li v-for="s in stats" :key="s.label" class="flex items-center justify-between py-2 text-sm">
					<span class="text-muted">{{ s.label }}</span>

					<span class="font-medium text-default">{{ s.value }}</span>
				</li>
			</ul>
		</div>

		<div v-if="baseStats.length" class="mt-4">
			<p class="mb-1 text-xs font-semibold uppercase text-muted">
				{{ tr('Атрибуты', 'Attributes') }}
			</p>

			<div class="grid grid-cols-3 gap-2">
				<div v-for="s in baseStats" :key="s.label" class="rounded-lg bg-elevated p-2 text-center">
					<p class="text-xs text-muted">
						{{ s.label }}
					</p>

					<p class="font-display font-bold tabular-nums text-default">
						{{ s.value }}
					</p>
				</div>
			</div>
		</div>

		</div>

		<aside class="mt-6 lg:mt-0">
			<div class="mb-3 flex items-center justify-between gap-3">
				<h2 class="font-display text-sm font-semibold uppercase tracking-widest text-muted">
					{{ tr('Дроп', 'Drops') }}
				</h2>

				<div v-if="hasDrops" class="flex items-center gap-1.5">
					<span class="text-xs text-muted">{{ tr('рейт ×', 'rate ×') }}</span>

					<UInputNumber v-model="dropRate" :min="1" :max="1000" :step="1" size="sm" :ui="{ base: 'text-center' }" class="w-24" />
				</div>
			</div>

			<div v-if="!hasDrops" class="flex flex-col items-center justify-center rounded-lg border border-dashed border-accented px-4 py-16 text-center">
				<UIcon name="i-lucide-package-open" class="size-8 text-dimmed" />

				<p class="mt-2 text-sm text-muted">
					{{ tr('Нет данных о дропе', 'No drop data') }}
				</p>
			</div>

			<div v-for="cat in mob.dropCats" :key="cat.key" class="mb-4">
				<h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-dimmed">
					{{ cat.label }}
				</h3>

				<div class="grid grid-cols-3 gap-2 sm:grid-cols-5 2xl:grid-cols-7">
					<UTooltip
						v-for="it in cat.items" :key="`${it.source}:${it.vnum}`"
						:text="it.name" :delay-duration="150"
					>
						<NuxtLink
							:to="`/items/${it.vnum}`"
							class="relative flex aspect-square items-center justify-center rounded-lg border border-accented bg-elevated p-2 transition hover:border-primary/60 hover:bg-default"
						>
							<UBadge v-if="it.refine" color="primary" variant="subtle" :label="`+${it.refine}`" :ui="{ base: 'text-[10px] font-bold px-1 py-0.5' }" class="absolute left-1 top-1 z-10" />

							<UBadge v-else-if="it.count > 1" color="warning" variant="subtle" :label="`×${it.count}`" :ui="{ base: 'text-[10px] font-bold px-1 py-0.5' }" class="absolute left-1 top-1 z-10" />

							<UBadge
								v-if="it.source === 'limit' && it.levelLimit" variant="subtle" color="warning"
								:label="tr(`ур.${it.levelLimit}`, `Lv ${it.levelLimit}`)" :ui="{ base: 'text-[10px] font-bold px-1 py-0.5' }" class="absolute right-1 top-1 z-10"
							/>

							<img
								v-if="it.icon" :src="`/icons/items/${it.icon}.webp`" :alt="it.name"
								class="max-h-full max-w-full object-contain" style="image-rendering: pixelated"
							>

							<UIcon v-else name="i-lucide-package" class="size-12 text-dimmed" />

							<UBadge color="primary" variant="subtle" :label="effPct(it)" :ui="{ base: 'text-[10px] font-bold px-1 py-0.5' }" class="absolute bottom-1 right-1 z-10 tabular-nums" />
						</NuxtLink>
					</UTooltip>
				</div>
			</div>

			<details v-if="mob.commonCats?.length" class="group mt-2 rounded-lg border border-accented bg-elevated/50">
				<summary class="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-xs">
					<span class="font-semibold uppercase tracking-wide text-muted">{{ tr('Общий дроп', 'Common drops') }} · {{ tr('ур.', 'Lv') }} {{ mob.level }}</span>

					<span class="flex items-center gap-1 text-dimmed">
						{{ mob.commonShown }}<template v-if="mob.commonTotal > mob.commonShown"> / {{ mob.commonTotal }}</template>

						<UIcon name="i-lucide-chevron-down" class="size-4 transition group-open:rotate-180" />
					</span>
				</summary>

				<div class="border-t border-accented p-3">
					<div v-for="cat in mob.commonCats" :key="cat.key" class="mb-3 last:mb-0">
						<h3 class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-dimmed">
							{{ cat.label }}
						</h3>

						<div class="grid grid-cols-3 gap-2 sm:grid-cols-5 2xl:grid-cols-7">
							<UTooltip v-for="it in cat.items" :key="it.vnum" :text="it.name" :delay-duration="150">
								<NuxtLink
									:to="`/items/${it.vnum}`"
									class="relative flex aspect-square items-center justify-center rounded-lg border border-accented bg-default/40 p-1.5 transition hover:border-primary/60 hover:bg-default"
								>
									<UBadge v-if="it.refine" color="primary" variant="subtle" :label="`+${it.refine}`" :ui="{ base: 'text-[10px] font-bold px-1 py-0.5' }" class="absolute left-0.5 top-0.5 z-10" />

									<img
										v-if="it.icon" :src="`/icons/items/${it.icon}.webp`" :alt="it.name"
										class="max-h-full max-w-full object-contain" style="image-rendering: pixelated"
									>

									<UIcon v-else name="i-lucide-package" class="size-9 text-dimmed" />

									<UBadge color="primary" variant="subtle" :label="effPct(it)" :ui="{ base: 'text-[10px] font-bold px-1 py-0.5' }" class="absolute bottom-0.5 right-0.5 z-10 tabular-nums" />
								</NuxtLink>
							</UTooltip>
						</div>
					</div>
				</div>
			</details>
		</aside>
	</div>
</template>
