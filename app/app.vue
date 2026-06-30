<script setup lang="ts">
const { locale, setLocale } = useI18n()
const langs = [{ code: 'en', label: 'EN' }, { code: 'ru', label: 'RU' }] as const

const colorMode = useColorMode()
const isDark = computed({
	get: () => colorMode.value === 'dark',
	set: (v) => { colorMode.preference = v ? 'dark' : 'light' },
})
</script>

<template>
	<UApp>
		<div class="fixed right-4 top-4 z-50 flex items-center gap-2">
			<div class="flex gap-0.5 rounded-full border border-default bg-default/80 p-0.5 shadow-sm backdrop-blur">
				<button
					v-for="l in langs"
					:key="l.code"
					class="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
					:class="locale === l.code ? 'bg-primary text-inverted' : 'text-muted hover:text-default'"
					@click="setLocale(l.code)"
				>
					{{ l.label }}
				</button>
			</div>

			<ClientOnly>
				<UButton
					:icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
					color="neutral"
					variant="outline"
					size="sm"
					class="rounded-full backdrop-blur"
					:aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
					@click="isDark = !isDark"
				/>

				<template #fallback>
					<div class="size-8" />
				</template>
			</ClientOnly>
		</div>

		<NuxtRouteAnnouncer />

		<NuxtPage />
	</UApp>
</template>
