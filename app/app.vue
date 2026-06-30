<script setup lang="ts">
const { locale, setLocale } = useI18n()
const langs = [{ code: 'en', label: 'EN' }, { code: 'ru', label: 'RU' }] as const
</script>

<template>
	<UApp>
		<div class="fixed right-4 top-4 z-50 flex gap-0.5 rounded-full border border-default bg-default/80 p-0.5 shadow-sm backdrop-blur">
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

		<NuxtRouteAnnouncer />

		<NuxtPage />
	</UApp>
</template>
