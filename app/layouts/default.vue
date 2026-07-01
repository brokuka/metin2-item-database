<script setup lang="ts">
// Standalone wiki layout (used when this layer runs on its own). The shell app has
// its own default layout with a sidebar/auth, which overrides this one.
const { locale, setLocale } = useI18n()

const colorMode = useColorMode()
const isDark = computed({
	get: () => colorMode.value === 'dark',
	set: (v) => { colorMode.preference = v ? 'dark' : 'light' },
})

const langs = [{ code: 'en', label: 'EN' }, { code: 'ru', label: 'RU' }] as const
</script>

<template>
	<div class="site-wiki text-default">
		<header class="flex items-center gap-4 rounded-xl border border-default bg-default/60 px-4 py-2.5 backdrop-blur">
			<NuxtLink to="/" class="font-display select-none text-2xl font-bold uppercase leading-none tracking-[0.25em]">
				<span class="bg-gradient-to-b from-primary-300 to-primary-600 bg-clip-text text-transparent">WIKI</span>
			</NuxtLink>

			<div class="ml-auto flex items-center gap-2">
				<div class="relative flex rounded-full border border-default p-0.5">
					<div
						class="absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-primary transition-transform duration-200 ease-out"
						:class="locale === 'ru' ? 'translate-x-full' : 'translate-x-0'"
					/>

					<button
						v-for="l in langs" :key="l.code"
						class="relative z-10 flex-1 rounded-full px-2.5 py-1 text-center text-xs font-semibold transition-colors"
						:class="locale === l.code ? 'text-inverted' : 'text-muted hover:text-default'"
						@click="setLocale(l.code)"
					>
						{{ l.label }}
					</button>
				</div>

				<UButton color="neutral" variant="ghost" size="sm" aria-label="Toggle theme" @click="isDark = !isDark">
					<UIcon name="i-lucide-sun" class="size-5 dark:hidden" />

					<UIcon name="i-lucide-moon" class="hidden size-5 dark:block" />
				</UButton>
			</div>
		</header>

		<main class="flex-1">
			<slot />
		</main>

		<footer class="flex flex-col items-center justify-between gap-2 border-t border-default pt-4 text-xs text-muted sm:flex-row">
			<p>© {{ new Date().getFullYear() }} Metin2</p>

			<p class="font-mono">metin2-item-database</p>
		</footer>
	</div>
</template>
