<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	// import { getModalStore } from '@skeletonlabs/skeleton';
	import { writable } from 'svelte/store';
	import type { YMapLocationRequest } from 'ymaps3';

	import { DEFAULT_USER_COORDS, DEFAULT_MAP_ZOOM } from '../constants';
	import { wait4ymaps3 } from '../utils';

	const dispatch = createEventDispatcher();

	let mapContainer: HTMLDivElement;
	// const hasPermission = writable(false);
	// const modalStore = getModalStore();

	let usetCoords = JSON.parse(localStorage.getItem('position') ?? 'null') ?? DEFAULT_USER_COORDS;

	onMount(() => {
		buildMap();
	});

	function buildMap() {
		initMap(...usetCoords);
	}

	async function initMap(lat, lon): Promise<void> {
		await wait4ymaps3();

		const LOCATION: YMapLocationRequest = {
			center: [lon, lat],
			zoom: DEFAULT_MAP_ZOOM
		};

		const { YMap, YMapDefaultSchemeLayer } = ymaps3;

		const map = new YMap(mapContainer!, { location: LOCATION });
		map.addChild(new YMapDefaultSchemeLayer({}));

		dispatch('map-built');
	}
</script>

<div bind:this={mapContainer} class="absolute inset-0 z-0"></div>
