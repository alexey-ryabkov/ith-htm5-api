<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { get } from 'svelte/store';
	import type { YMap, YMapListener } from 'ymaps3';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { nanoid } from 'nanoid';
	import Icon from '@iconify/svelte';

	import { isNewcomer as checkIsNewcomer, hasPlaces as checkHasPlaces } from '$lib/core/helpers';
	import YaMap from '$lib/components/YaMap.svelte';
	import AppIcon from '$lib/components/AppIcon.svelte';
	import Preloader from '$lib/components/Preloader.svelte';
	import { showError2user } from '$lib/utils';
	import { appInitialization, map, userCode, userLocation, userPoints } from '$lib/stores';
	import { DEFAULT_MAP_ZOOM, GEOCODE_RESULTS_LIMIT, GEOCODE_SEARCH_TEXT } from '$lib/constants';
	import type { MapCoords } from '$lib/types';

	$: isMapBuilt = !!$map;
	let mapListener: YMapListener | null = null;
	let mapListenerUnsubscribe: (() => void) | null = null;

	const isNewcomer = checkIsNewcomer();
	const hasPlaces = checkHasPlaces();

	let addingPointName = '';
	let isMarkersLoading = false;

	let geocodePermission: PermissionState = 'prompt';
	const { geolocation, permissions } = navigator;

	const modalStore = getModalStore();

	onMount(async () => {
		const result = await permissions.query({ name: 'geolocation' });
		geocodePermission = result.state;
		result.onchange = (event) => {
			geocodePermission = (event.target as PermissionStatus).state;
		};
		mapListenerUnsubscribe = map.subscribe((mapInstance) => {
			if (mapInstance && !mapListener) {
				const { YMapListener } = ymaps3;

				mapListener = new YMapListener({
					layer: 'any',
					onClick: (_, { coordinates }) => {
						if (addingPointName) {
							addUserPoint(mapInstance, coordinates as MapCoords);
						}
					}
				});
				mapInstance.addChild(mapListener);
			}
		});
	});

	onDestroy(() => {
		if (mapListener && get(map)) {
			get(map)?.removeChild(mapListener);
		}
		mapListenerUnsubscribe?.();
	});

	async function requestGeolocation() {
		return new Promise<void>((resolve) => {
			geolocation.getCurrentPosition(
				({ coords: { longitude, latitude } }) => {
					$map!.update({
						location: { center: [longitude, latitude], zoom: DEFAULT_MAP_ZOOM, duration: 300 }
					});
					userLocation.set([longitude, latitude]);
					resolve();
				},
				(error) => {
					let message;
					const { code } = error;
					switch (code) {
						case GeolocationPositionError.TIMEOUT:
							message =
								'Срок разрешения на получение геопозиции истек, обновите разрешение в настройках браузера';
							break;
						case GeolocationPositionError.POSITION_UNAVAILABLE:
							message = 'Ошибка получения геопозиции';
							break;
						case GeolocationPositionError.PERMISSION_DENIED:
							message = 'Задайте разрешение на получение геопозиции в настройках браузера';
							break;
					}
					showError2user(error, message);
					resolve();
				}
			);
		});
	}

	async function showMap() {
		isMarkersLoading = true;

		if (hasPlaces) {
			// TODO центровать по местам пользователя
		} else if (isNewcomer || geocodePermission === 'prompt') {
			await geolocationInterface();
		}

		const mapInstance = get(map)!;
		showUserlocation(mapInstance);
		showUserPoints(mapInstance);
		await showFoundCoffeePoints(mapInstance);

		isMarkersLoading = false;
		appInitialization.set(false);
		isNewcomer && userCode.set(nanoid()); // remembering the user
	}

	function showUserlocation(mapInstance: YMap) {
		const { YMapMarker } = ymaps3;
		// const mapInstance = $map!;

		const markerElement = document.createElement('div');
		markerElement.innerHTML = `<div class="user-location">
			<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
				<path fill="currentColor" d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2s-2-.9-2-2s.9-2 2-2m3.9 6.1c-.4-.4-1.1-1.1-2.4-1.1H11C8.2 7 6 4.8 6 2H4c0 3.2 2.1 5.8 5 6.7V22h2v-6h2v6h2V10.1l4 3.9l1.4-1.4z" />
			</svg>
		</div>`;
		// <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
		// 	<path fill="currentColor" d="M19 2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h4l3 3l3-3h4a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2m-7 3c1.727 0 3 1.272 3 3s-1.273 3-3 3c-1.726 0-3-1.272-3-3s1.274-3 3-3M7.177 16c.558-1.723 2.496-3 4.823-3s4.266 1.277 4.823 3z" />
		// </svg>
		const marker = new YMapMarker(
			{
				coordinates: get(userLocation),
				draggable: false
			},
			markerElement
		);

		mapInstance.addChild(marker);
	}

	function addUserPoint(mapInstance: YMap, coordinates: MapCoords) {
		const { YMapMarker } = ymaps3;
		// const mapInstance = $map!;

		const markerElement = document.createElement('div');
		markerElement.innerHTML = `<div class="user-marker">
			<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
				<path fill="currentColor" d="M14.102 2.664c.628-.416 1.692-.713 2.495.09l4.647 4.648c.806.804.508 1.868.091 2.495a2.95 2.95 0 0 1-.863.85c-.334.213-.756.374-1.211.35a9 9 0 0 1-.658-.071l-.068-.01a9 9 0 0 0-.707-.073c-.504-.025-.698.06-.76.12l-2.49 2.491c-.08.08-.18.258-.256.6c-.073.33-.105.736-.113 1.186c-.007.432.008.874.024 1.3l.001.047c.015.423.03.855.009 1.194c-.065 1.031-.868 1.79-1.658 2.141c-.79.35-1.917.437-2.7-.347l-2.25-2.25L3.53 21.53a.75.75 0 1 1-1.06-1.06l4.104-4.105l-2.25-2.25c-.783-.784-.697-1.91-.346-2.7c.35-.79 1.11-1.593 2.14-1.658c.34-.021.772-.006 1.195.009l.047.001c.426.015.868.031 1.3.024c.45-.008.856-.04 1.186-.113c.342-.076.52-.177.6-.257l2.49-2.49c.061-.061.146-.256.12-.76a9 9 0 0 0-.073-.707l-.009-.068a9 9 0 0 1-.071-.658c-.025-.455.136-.877.348-1.211c.216-.34.515-.64.851-.863" />
			</svg>		
		</div>`;
		// <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 16 16">
		// 		<path fill="currentColor" fill-rule="evenodd" d="M10.5 2.255v-.01c.003-.03.013-.157-.361-.35C9.703 1.668 8.967 1.5 8 1.5s-1.703.169-2.138.394c-.375.194-.365.32-.362.351v.01c-.003.03-.013.157.362.35C6.297 2.832 7.033 3 8 3s1.703-.169 2.139-.394c.374-.194.364-.32.361-.351M12 2.25c0 .738-.433 1.294-1.136 1.669l.825 2.31c1.553.48 2.561 1.32 2.561 2.52c0 1.854-2.402 2.848-5.5 2.985V15a.75.75 0 0 1-1.5 0v-3.266c-3.098-.136-5.5-1.131-5.5-2.984c0-1.2 1.008-2.04 2.561-2.52l.825-2.311C4.433 3.544 4 2.988 4 2.25C4 .75 5.79 0 8 0s4 .75 4 2.25" clip-rule="evenodd" />
		// 	</svg>
		const marker = new YMapMarker(
			{
				coordinates,
				draggable: false
			},
			markerElement
		);

		mapInstance.addChild(marker);
		addingPointName = '';
		userPoints.add({
			id: nanoid(),
			name: addingPointName,
			coordinates
		});
	}

	function showUserPoints(mapInstance: YMap) {
		const { YMapMarker } = ymaps3;
		// const mapInstance = $map!;

		get(userPoints).map(({ name, coordinates }) => {
			const markerElement = document.createElement('div');
			markerElement.innerHTML = `<div class="user-marker">
				<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
					<path fill="currentColor" d="M14.102 2.664c.628-.416 1.692-.713 2.495.09l4.647 4.648c.806.804.508 1.868.091 2.495a2.95 2.95 0 0 1-.863.85c-.334.213-.756.374-1.211.35a9 9 0 0 1-.658-.071l-.068-.01a9 9 0 0 0-.707-.073c-.504-.025-.698.06-.76.12l-2.49 2.491c-.08.08-.18.258-.256.6c-.073.33-.105.736-.113 1.186c-.007.432.008.874.024 1.3l.001.047c.015.423.03.855.009 1.194c-.065 1.031-.868 1.79-1.658 2.141c-.79.35-1.917.437-2.7-.347l-2.25-2.25L3.53 21.53a.75.75 0 1 1-1.06-1.06l4.104-4.105l-2.25-2.25c-.783-.784-.697-1.91-.346-2.7c.35-.79 1.11-1.593 2.14-1.658c.34-.021.772-.006 1.195.009l.047.001c.426.015.868.031 1.3.024c.45-.008.856-.04 1.186-.113c.342-.076.52-.177.6-.257l2.49-2.49c.061-.061.146-.256.12-.76a9 9 0 0 0-.073-.707l-.009-.068a9 9 0 0 1-.071-.658c-.025-.455.136-.877.348-1.211c.216-.34.515-.64.851-.863" />
				</svg>		
			</div>`;
			const marker = new YMapMarker(
				{
					coordinates,
					draggable: false
				},
				markerElement
			);
			mapInstance.addChild(marker);
		});
	}

	async function findCoffeePoints(mapInstance: YMap) {
		const { search } = ymaps3;
		// console.log('current map bounds, center', mapInstance.bounds, mapInstance.center);
		const found = await search({
			text: GEOCODE_SEARCH_TEXT,
			limit: GEOCODE_RESULTS_LIMIT,
			bounds: mapInstance.bounds
		});
		// console.log(found);
		return found;
	}

	async function showFoundCoffeePoints(mapInstance: YMap) {
		const { YMapMarker } = ymaps3;
		const coffeePoints = await findCoffeePoints(mapInstance);
		coffeePoints.map(({ geometry, properties: { name } }) => {
			const { coordinates } = geometry ?? {};
			// const  =
			if (coordinates) {
				const markerElement = document.createElement('div');
				markerElement.innerHTML = `<div class="coffee-marker">
					<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
						<path fill="currentColor" d="M7 22h10a1 1 0 0 0 .99-.858L19.867 8H21V6h-1.382l-1.724-3.447A1 1 0 0 0 17 2H7c-.379 0-.725.214-.895.553L4.382 6H3v2h1.133L6.01 21.142A1 1 0 0 0 7 22m10.418-11H6.582l-.429-3h11.693zm-9.551 9l-.429-3h9.123l-.429 3zM7.618 4h8.764l1 2H6.618z" />
					</svg>
				</div>`;
				const marker = new YMapMarker(
					{
						coordinates,
						draggable: false
					},
					markerElement
				);
				mapInstance.addChild(marker);
			}
		});

		// console.log(results);
	}

	async function geolocationInterface() {
		return new Promise<void>((resolve) => {
			modalStore.trigger({
				type: 'confirm',
				title: 'Разрешите запрос геопозиции?',
				body: 'Для того, чтобы полноценно пользоваться приложением, необходимо разрешить доступ к вашей геопозиции',
				buttonTextCancel: 'Нет',
				buttonTextConfirm: 'Ок',
				response: async (yes) => {
					if (yes) {
						await requestGeolocation();
					}
					resolve();
				}
			});
		});
	}

	function showAddMarkerModal() {
		modalStore.trigger({
			type: 'prompt',
			title: 'Добавление места',
			body: 'Кликните по точке на карте — появится метка места с заданным названием:',
			buttonTextCancel: 'Отменить',
			buttonTextSubmit: 'К карте',
			value: 'Новое место',
			valueAttr: { type: 'text', minlength: 3, maxlength: 25, required: true },
			response: (name: string) => {
				addingPointName = name;
			}
		});
	}
</script>

{#if $appInitialization}
	<div class="flex justify-center items-center absolute inset-0 z-20 size-full">
		<div class="w-80 mx-auto space-y-10 text-center flex flex-col items-center">
			<h2 class="h2">Взять кофе и прогуляться</h2>
			<figure>
				<section class="img-bg" aria-hidden="true" />
				<AppIcon name="coffee-cup-walking-big" size={275} />
			</figure>

			<div class="flex flex-col items-center space-y-1.5">
				<button
					on:click={showMap}
					disabled={!isMapBuilt || isMarkersLoading}
					class="btn variant-filled flex gap-x-2"
				>
					{#if isMarkersLoading}
						<Preloader name="tube-spinner" color="white" size={20} />
					{/if}
					{hasPlaces ? 'К моим местам!' : 'Начать!'}
				</button>
				<div class="flex gap-x-1 items-center{isMapBuilt ? ' invisible' : ''}">
					<Preloader name="tube-spinner" size={22} />
					<span class="text-sm">загрузка карты...</span>
				</div>
			</div>
		</div>
	</div>
	<div class="veil z-10"></div>
{:else}
	<div
		class="absolute top-0 px-4 h-[72px] z-40 w-full flex justify-end content-center items-center gap-4"
	>
		<button on:click={requestGeolocation} type="button" class="btn-icon variant-filled">
			<Icon icon="fluent:location-arrow-16-filled" width="28" height="28" />
		</button>
		<button
			on:click={() => {
				if (addingPointName) {
					addingPointName = '';
				} else {
					showAddMarkerModal();
				}
			}}
			type="button"
			class="btn-icon variant-filled"
		>
			{#if addingPointName}
				<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 512 512">
					<path
						fill="currentColor"
						d="m330.443 256l136.765-136.765c14.058-14.058 14.058-36.85 0-50.908l-23.535-23.535c-14.058-14.058-36.85-14.058-50.908 0L256 181.557L119.235 44.792c-14.058-14.058-36.85-14.058-50.908 0L44.792 68.327c-14.058 14.058-14.058 36.85 0 50.908L181.557 256L44.792 392.765c-14.058 14.058-14.058 36.85 0 50.908l23.535 23.535c14.058 14.058 36.85 14.058 50.908 0L256 330.443l136.765 136.765c14.058 14.058 36.85 14.058 50.908 0l23.535-23.535c14.058-14.058 14.058-36.85 0-50.908z"
					/>
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24">
					<path
						fill="currentColor"
						d="M14.102 2.664c.628-.416 1.692-.713 2.495.09l4.647 4.648c.806.804.508 1.868.091 2.495a2.95 2.95 0 0 1-.863.85c-.334.213-.756.374-1.211.35a9 9 0 0 1-.658-.071l-.068-.01a9 9 0 0 0-.707-.073c-.504-.025-.698.06-.76.12l-2.49 2.491c-.08.08-.18.258-.256.6c-.073.33-.105.736-.113 1.186c-.007.432.008.874.024 1.3l.001.047c.015.423.03.855.009 1.194c-.065 1.031-.868 1.79-1.658 2.141c-.79.35-1.917.437-2.7-.347l-2.25-2.25L3.53 21.53a.75.75 0 1 1-1.06-1.06l4.104-4.105l-2.25-2.25c-.783-.784-.697-1.91-.346-2.7c.35-.79 1.11-1.593 2.14-1.658c.34-.021.772-.006 1.195.009l.047.001c.426.015.868.031 1.3.024c.45-.008.856-.04 1.186-.113c.342-.076.52-.177.6-.257l2.49-2.49c.061-.061.146-.256.12-.76a9 9 0 0 0-.073-.707l-.009-.068a9 9 0 0 1-.071-.658c-.025-.455.136-.877.348-1.211c.216-.34.515-.64.851-.863"
					/>
				</svg>
				<!-- <Icon icon="material-symbols:add-location-rounded" width="28" height="28" /> -->
			{/if}
		</button>
	</div>
{/if}

<YaMap />

<style lang="postcss">
	figure {
		@apply flex relative flex-col;
	}
	.img-bg {
		@apply w-64 h-64 md:w-80 md:h-80;
		@apply absolute z-[-1] rounded-full blur-[50px] transition-all;
		animation:
			pulse 2s linear infinite,
			glow 6s ease-in-out infinite;
	}
	@keyframes glow {
		0% {
			@apply bg-primary-500/85;
		}
		33% {
			@apply bg-surface-400/75;
		}
		66% {
			@apply bg-tertiary-300/60;
		}
		100% {
			@apply bg-primary-500/85;
		}
	}
	@keyframes pulse {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.5);
		}
		100% {
			transform: scale(1);
		}
	}
	.veil {
		@apply bg-gradient-to-b from-seafoam-green to-lavender-blue opacity-85;
		@apply absolute inset-0;
		@apply size-full;
	}
	:global(.coffee-marker) {
		@apply text-cappuccino;
		/* @apply text-primary-600; */
	}
	:global(.user-marker) {
		@apply text-surface-900;
	}
	:global(.user-location) {
		@apply text-tertiary-500;
	}
</style>
