<script setup lang="ts">
const route = useRoute()
</script>

<template>
	<div>
		<BackButton fallback="/mobs" class="mb-6" />

		<UCard>
			<MobDetail :vnum="route.params.vnum as string" />
		</UCard>
	</div>
</template>
