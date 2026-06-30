<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
	<div class="flex min-h-dvh flex-col items-center justify-center gap-6 p-4">
		<div class="text-center">
			<h1 class="text-3xl font-bold text-default">Metin2 Item Database</h1>
			<p class="mt-2 text-muted">{{ t('common.siteSubtitle') }}</p>
		</div>
		<UButton to="/items" size="lg" icon="i-lucide-book-open" :label="t('common.itemDatabase')" />
	</div>
</template>
