<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()
</script>

<template>
	<UContainer class="py-8">
		<UButton to="/items" variant="ghost" icon="i-lucide-arrow-left" :label="t('items.backToItems')" class="mb-6" />

		<UCard class="max-w-xl">
			<ItemDetail :vnum="route.params.vnum as string" />
		</UCard>
	</UContainer>
</template>
