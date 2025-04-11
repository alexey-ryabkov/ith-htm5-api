<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import Icon from '@iconify/svelte';

	import { isNewcomer as checkIsNewcomer, hasPlaces as checkHasPlaces } from '$lib/core/helpers';
	import YaMap from '$lib/components/YaMap.svelte';
	import AppIcon from '$lib/components/AppIcon.svelte';
	import Preloader from '$lib/components/Preloader.svelte';
	import { showError2user } from '$lib/utils';
	import { map, userCode, userLocation } from '$lib/stores';
	import { nanoid } from 'nanoid';

	const modalStore = getModalStore();

	const isNewcomer = checkIsNewcomer();
	const hasPlaces = checkHasPlaces();

	let showLaunchScreen = true;

	$: isMapBuilt = !!$map;

	let geocodePermission: PermissionState = 'prompt';
	const { geolocation, permissions } = navigator;

	onMount(async () => {
		const result = await permissions.query({ name: 'geolocation' });

		geocodePermission = result.state;

		result.onchange = (event) => {
			geocodePermission = (event.target as PermissionStatus).state;
		};
	});

	async function requestGeolocation() {
		return new Promise<void>((resolve) => {
			geolocation.getCurrentPosition(
				({ coords: { longitude, latitude } }) => {
					$map!.update({ location: { center: [longitude, latitude], duration: 300 } });
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

	function showGeoPermissionModal() {
		modalStore.trigger({
			type: 'confirm',
			title: 'Разрешите запрос геопозиции?',
			body: 'Для того, чтобы полноценно пользоваться приложением, необходимо разрешить доступ к вашей геопозиции',
			buttonTextCancel: 'Нет',
			buttonTextConfirm: 'Да',
			response: async (yes) => {
				if (yes) {
					await requestGeolocation();
				}
				showLaunchScreen = false;
			}
		});
	}
</script>

{#if showLaunchScreen}
	<div class="flex justify-center items-center absolute inset-0 z-20 size-full">
		<div class="w-80 mx-auto space-y-10 text-center flex flex-col items-center">
			<h2 class="h2">Взять кофе и прогуляться</h2>
			<figure>
				<section class="img-bg" aria-hidden="true" />
				<AppIcon name="coffee-cup-walking-big" size={275} />
			</figure>

			<div class="flex flex-col items-center space-y-1.5">
				<button
					on:click={() => {
						// TODO  если hasPlaces то центруем по ним
						if (isNewcomer || (!hasPlaces && geocodePermission !== 'denied')) {
							isNewcomer && userCode.set(nanoid());
							showGeoPermissionModal();
						} else {
							showLaunchScreen = false;
						}
					}}
					disabled={!isMapBuilt}
					class="btn variant-filled"
				>
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
			on:click={() => requestGeolocation()}
			type="button"
			class="btn-icon variant-filled bg-cappuccino-400"
		>
			<Icon icon="fluent:location-arrow-16-filled" width="28" height="28" />
		</button>
		<button
			on:click={() => {
				console.log('add marker');
			}}
			type="button"
			class="btn-icon variant-filled bg-cappuccino-400"
		>
			<Icon icon="material-symbols:add-location-rounded" width="28" height="28" />
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
		opacity: 0.88;
		background: linear-gradient(0deg, #cbddfe 0%, #a3d1ce 100%);
		@apply absolute inset-0;
		@apply size-full;
	}
</style>
