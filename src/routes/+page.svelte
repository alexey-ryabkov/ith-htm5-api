<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { get, writable } from 'svelte/store';
	import type { YMap, YMapListener, Feature as MapPointData } from 'ymaps3';
	import { getModalStore, popup } from '@skeletonlabs/skeleton';
	import { castArray, filter, map as arrMap, uniqBy } from 'lodash';
	import { nanoid } from 'nanoid';

	import {
		isNewcomer as checkIsNewcomer,
		hasPlaces as checkHasPlaces,
		addLocationMarker,
		addUserPointMarker,
		addCoffeeMarker
	} from '$lib/core/helpers';
	import YaMap from '$lib/components/YaMap.svelte';
	import AppIcon from '$lib/components/AppIcon/component.svelte';
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
		MAP_SEARCH_SPAN,
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
		addLocationMarker(mapInstance, get(userLocation), popupsContainer);
	}

	function addUserPoint(mapInstance: YMap, coordinates: MapCoords) {
		const id = nanoid(8);
		addUserPointMarker(mapInstance, id, coordinates, popupsContainer);
		userPoints.add({
			id,
			coordinates,
			title: addingPointName
		});
		addingPointName = '';
	}

	function showUserPoints(mapInstance: YMap) {
		get(userPoints).map(({ id, coordinates }) => {
			addUserPointMarker(mapInstance, id, coordinates, popupsContainer);
		});
	}

	async function findCoffeePoints(mapInstance: YMap) {
		const { search } = ymaps3;

		let rawPoints: MapPointData[] = [];
		for (const text of castArray(GEOCODE_SEARCH_TEXT)) {
			const response = await search({
				text,
				limit: GEOCODE_RESULTS_LIMIT,
				center: mapInstance.center as MapCoords,
				span: [MAP_SEARCH_SPAN, MAP_SEARCH_SPAN],
				// bounds: mapInstance.bounds,
				strictBounds: true
			});
			rawPoints = rawPoints.concat(response as MapPointData[]);
		}
		const points = uniqBy(
			filter(
				arrMap(rawPoints, ({ geometry, properties: { name: title, description } }) => {
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
			),
			'id'
		) as CoffeePoint[];
		coffeePoints.set(points);
	}

	async function showCoffeePoints(mapInstance: YMap) {
		await findCoffeePoints(mapInstance);
		get(coffeePoints).map(({ coordinates }) => {
			const pointId = hashCoords(coordinates);
			addCoffeeMarker(
				mapInstance,
				pointId,
				userCoffeePointIDs.includes(pointId),
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
			<AppIcon name="human" size={28} />
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
				<AppIcon name="cross" size={24} />
			{:else}
				<AppIcon name="pin" size={28} />
			{/if}
		</button>
		<PopupBox variant="secondary" data-popup="addPointPopup">
			{#if addingPointName}
				<p>Отменить добавление места</p>
			{:else}
				<p>Добавить место</p>
			{/if}
		</PopupBox>
	</div>
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
						<AppIcon name="cross-round" size={24} />
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
							<AppIcon name="plus" size={15} />
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
							<AppIcon name="cross-round" size={24} />
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
	:global(.location-marker) {
		@apply text-tertiary-500;
	}
</style>
