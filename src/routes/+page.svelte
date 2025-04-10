<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import Preloader from '$lib/components/Preloader.svelte';
	import YaMap from '$lib/components/YaMap.svelte';

	let userCoords = JSON.parse(localStorage.getItem('position') ?? 'null');
	const isNewUser = !userCoords;

	let isMapBuilt = false;
</script>

{#if isNewUser}
	<div class="flex justify-center items-center absolute inset-0 z-20 size-full">
		<div class="w-80 mx-auto space-y-10 text-center flex flex-col items-center">
			<h2 class="h2">Взять кофе и прогуляться</h2>
			<figure>
				<section class="img-bg" aria-hidden="true" />
				<Icon name="coffee-cup-walking-big" size={275} />
			</figure>

			<div class="flex flex-col items-center space-y-1.5">
				<button
					on:click={() => console.log('!!!')}
					disabled={!isMapBuilt}
					class="btn variant-filled"
				>
					cоздать маршрут
				</button>
				<div class="flex gap-x-1 items-center{isMapBuilt ? ' invisible' : ''}">
					<Preloader name="tube-spinner" size={22} />
					<span class="text-sm">загрузка карты...</span>
				</div>
			</div>
		</div>
	</div>
{/if}

<div class="veil {isNewUser ? 'z-10' : 'hidden'}"></div>
<YaMap on:map-built={() => (isMapBuilt = true)} />

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
		background: linear-gradient(0deg, rgba(203, 221, 254, 1) 0%, rgba(163, 209, 206, 1) 100%);
		@apply absolute inset-0;
		@apply size-full;
	}
</style>
