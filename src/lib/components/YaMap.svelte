<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { userLocation } from '$lib/stores';
	import { initMap } from '$lib/stores/map';

	const center = get(userLocation);
	let container: HTMLDivElement;

	onMount(() => {
		initMap(container, center);
	});
</script>

<div bind:this={container} class="absolute inset-0 z-0"></div>
