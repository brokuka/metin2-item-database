<script setup lang="ts">
const route = useRoute()
</script>

<template>
	<UContainer class="py-8">
		<BackButton fallback="/items" class="mb-6" />

		<UCard class="max-w-xl">
			<ItemDetail :vnum="route.params.vnum as string" />
		</UCard>
	</UContainer>
</template>
