<script setup lang="ts">
// Shared "back" link, no background (variant=link). Two modes:
//   - `to`: plain navigation to a fixed route (e.g. list -> Wiki hub).
//   - `fallback` (no `to`): return to the previous page, or `fallback` if opened directly.
const props = defineProps<{ to?: string, fallback?: string, label?: string }>()
const router = useRouter()
const { locale } = useI18n()

const label = computed(() => props.label ?? (locale.value === 'ru' ? 'Назад' : 'Back'))

function goBack() {
	if (import.meta.client && window.history.state?.back)
		router.back()
	else
		router.push(props.fallback || '/')
}
</script>

<template>
	<UButton
		v-if="to" :to="to" variant="link" color="neutral"
		icon="i-lucide-arrow-left" :label="label" class="cursor-pointer"
	/>

	<UButton
		v-else variant="link" color="neutral"
		icon="i-lucide-arrow-left" :label="label" class="cursor-pointer" @click="goBack"
	/>
</template>
