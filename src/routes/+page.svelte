<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { get, writable } from 'svelte/store';
	import type { YMap, YMapListener } from 'ymaps3';
	import { getModalStore, popup } from '@skeletonlabs/skeleton';
	import { nanoid } from 'nanoid';

	import {
		isNewcomer as checkIsNewcomer,
		hasPlaces as checkHasPlaces,
		addMapMarker
	} from '$lib/core/helpers';
	import YaMap from '$lib/components/YaMap.svelte';
	import AppIcon from '$lib/components/AppIcon.svelte';
	import Preloader from '$lib/components/Preloader.svelte';
	import { hashCoords, showError2user } from '$lib/utils';
	import {
		appInitialization,
		map,
		userCode,
		userCoffeePoints,
		userLocation,
		userPoints
	} from '$lib/stores';
	import {
		DEFAULT_MAP_ZOOM,
		GEOCODE_RESULTS_LIMIT,
		GEOCODE_SEARCH_TEXT,
		MAP_UPDATE_ANIMATION
	} from '$lib/constants';
	import type { CoffeePoint, MapCoords } from '$lib/types';
	import MapPopup from '$lib/components/MapPopup.svelte';
	import PopupBox from '$lib/components/PopupBox.svelte';

	$: isMapBuilt = !!$map;
	$: userCoffeePointIDs = $userCoffeePoints.map(({ id }) => id);
	let mapListener: YMapListener | null = null;
	let mapListenerUnsubscribe: (() => void) | null = null;

	const isNewcomer = checkIsNewcomer();
	const hasPlaces = checkHasPlaces();

	const coffeePoints = writable<CoffeePoint[]>([]);

	let addingPointName = '';
	let isMarkersLoading = false;
	let popupsContainer: HTMLElement | null = null;

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
						location: {
							center: [longitude, latitude],
							zoom: DEFAULT_MAP_ZOOM,
							duration: MAP_UPDATE_ANIMATION
						}
					});
					userLocation.set([longitude, latitude]);
					setTimeout(() => {
						resolve();
					}, 1_000);
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
		await showCoffeePoints(mapInstance);

		isMarkersLoading = false;
		appInitialization.set(false);
		isNewcomer && userCode.set(nanoid(6)); // remembering the user
	}

	function showUserlocation(mapInstance: YMap) {
		const { YMapMarker } = ymaps3;

		const markerElement = document.createElement('div');
		markerElement.innerHTML = `<div class="user-location">
			<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
				<path fill="currentColor" d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2s-2-.9-2-2s.9-2 2-2m3.9 6.1c-.4-.4-1.1-1.1-2.4-1.1H11C8.2 7 6 4.8 6 2H4c0 3.2 2.1 5.8 5 6.7V22h2v-6h2v6h2V10.1l4 3.9l1.4-1.4z" />
			</svg>
		</div>`;
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
		const id = nanoid(8);
		addMapMarker(mapInstance, id, 'user', coordinates, popupsContainer);
		userPoints.add({
			id,
			coordinates,
			title: addingPointName
		});
		addingPointName = '';
	}

	function showUserPoints(mapInstance: YMap) {
		get(userPoints).map(({ id, coordinates }) => {
			addMapMarker(mapInstance, id, 'user', coordinates, popupsContainer);
		});
	}

	async function findCoffeePoints(mapInstance: YMap) {
		const { search } = ymaps3;

		// console.log('current map bounds, center', mapInstance.bounds, mapInstance.center);

		const rawPoints = await search({
			text: GEOCODE_SEARCH_TEXT,
			limit: GEOCODE_RESULTS_LIMIT,
			center: mapInstance.center as MapCoords,
			bounds: mapInstance.bounds,
			strictBounds: true
		});

		const points = rawPoints
			.map(({ geometry, properties: { name: title, description } }) => {
				const { coordinates: [lon, lat] = [] } = geometry ?? {};
				const coordinates = [lon, lat] as MapCoords;
				return coordinates.length
					? {
							id: hashCoords(coordinates),
							title,
							description,
							coordinates
						}
					: null;
			})
			.filter((p) => p !== null);

		coffeePoints.set(points);
	}

	async function showCoffeePoints(mapInstance: YMap) {
		await findCoffeePoints(mapInstance);

		get(coffeePoints).map(({ coordinates }) => {
			const pointId = hashCoords(coordinates);
			addMapMarker(
				mapInstance,
				hashCoords(coordinates),
				userCoffeePointIDs.includes(pointId) ? 'user-coffee' : 'coffee',
				coordinates,
				popupsContainer
			);
		});
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
			buttonTextSubmit: 'Ок',
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
		<button
			on:click={requestGeolocation}
			use:popup={{
				event: 'hover',
				target: 'locationPopup',
				placement: 'bottom'
			}}
			type="button"
			class="btn-icon variant-filled [&>svg]:pointer-events-none"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="28"
				height="28"
				viewBox="0 0 24 24"
				{...$$props}
			>
				<path
					fill="currentColor"
					d="M12 1a2 2 0 0 0-2 2c0 1.11.89 2 2 2s2-.89 2-2a2 2 0 0 0-2-2m-2 5c-.27 0-.5.11-.69.28H9.3L4 11.59L5.42 13L9 9.41V22h2v-7h2v7h2V9.41L18.58 13L20 11.59l-5.3-5.31c-.2-.17-.43-.28-.7-.28"
				/>
			</svg>
		</button>
		<PopupBox variant="secondary" data-popup="locationPopup">
			<p>Мое местоположение</p>
		</PopupBox>
		<button
			on:click={() => {
				if (addingPointName) {
					addingPointName = '';
				} else {
					showAddMarkerModal();
				}
			}}
			use:popup={{
				event: 'hover',
				target: 'addPointPopup',
				placement: 'bottom'
			}}
			type="button"
			class="btn-icon variant-filled [&>svg]:pointer-events-none"
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
			{/if}
		</button>
		<PopupBox variant="secondary" data-popup="addPointPopup">
			<p>Добавить место</p>
		</PopupBox>
	</div>
	<!-- <MapPopup mapMakerId={nanoid(8)}>test!!!</MapPopup> -->
	<div bind:this={popupsContainer}>
		{#each $userPoints as { id, title, description, coordinates }}
			<MapPopup mapMakerId={id}>
				<div class="flex flex-col gap-3">
					<h3 class="h3">{title ?? id}</h3>
					{#if description}
						<p>{description}</p>
					{/if}
					<p>{coordinates}</p>
					<button
						class="btn variant-filled-error"
						on:click={() => {
							userPoints.remove(id);
							document.querySelector(`[data-marker-id="${id}"]`)?.remove();
						}}
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
							<path
								fill="currentColor"
								d="M12 4c-4.419 0-8 3.582-8 8s3.581 8 8 8s8-3.582 8-8s-3.581-8-8-8m3.707 10.293a.999.999 0 1 1-1.414 1.414L12 13.414l-2.293 2.293a.997.997 0 0 1-1.414 0a1 1 0 0 1 0-1.414L10.586 12L8.293 9.707a.999.999 0 1 1 1.414-1.414L12 10.586l2.293-2.293a.999.999 0 1 1 1.414 1.414L13.414 12z"
							/>
						</svg>
						<span>удалить</span>
					</button>
				</div>
			</MapPopup>
		{/each}
		{#each $coffeePoints as { id, title, description, coordinates }}
			<MapPopup mapMakerId={id} type={userCoffeePointIDs.includes(id) ? 'user' : 'coffee'}>
				<div class="flex flex-col gap-3">
					<h3 class="h3">{title ?? id}</h3>
					{#if description}
						<p>{description}</p>
					{/if}
					<p>{coordinates}</p>
					{#if !userCoffeePointIDs.includes(id)}
						<button
							class="btn variant-filled-primary"
							on:click={() => {
								userCoffeePoints.add({
									id,
									title,
									description,
									coordinates
								});
								document
									.querySelector(`[data-marker-id="${id}"]`)
									?.classList.replace('coffee-marker', 'user-coffee-marker');
							}}
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 448 512">
								<path
									fill="currentColor"
									d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32v144H48c-17.7 0-32 14.3-32 32s14.3 32 32 32h144v144c0 17.7 14.3 32 32 32s32-14.3 32-32V288h144c17.7 0 32-14.3 32-32s-14.3-32-32-32H256z"
								/>
							</svg>
							<span>в мои места</span>
						</button>
					{:else}
						<button
							class="btn variant-filled-error"
							on:click={() => {
								userCoffeePoints.remove(id);
								document
									.querySelector(`[data-marker-id="${id}"]`)
									?.classList.replace('user-coffee-marker', 'coffee-marker');
							}}
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
								<path
									fill="currentColor"
									d="M12 4c-4.419 0-8 3.582-8 8s3.581 8 8 8s8-3.582 8-8s-3.581-8-8-8m3.707 10.293a.999.999 0 1 1-1.414 1.414L12 13.414l-2.293 2.293a.997.997 0 0 1-1.414 0a1 1 0 0 1 0-1.414L10.586 12L8.293 9.707a.999.999 0 1 1 1.414-1.414L12 10.586l2.293-2.293a.999.999 0 1 1 1.414 1.414L13.414 12z"
								/>
							</svg>
							<span>из моих мест</span>
						</button>
					{/if}
				</div>
			</MapPopup>
		{/each}
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
		@apply text-cappuccino cursor-pointer;
	}
	:global(.user-marker) {
		@apply text-surface-900 cursor-pointer;
	}
	:global(.user-coffee-marker) {
		@apply text-surface-900 cursor-pointer;
	}
	:global(.user-location) {
		@apply text-tertiary-500;
	}
</style>
