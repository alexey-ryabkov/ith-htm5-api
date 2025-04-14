<script lang="ts">
	import '../app.postcss';
	import {
		Toast,
		getToastStore,
		initializeStores,
		storePopup,
		Modal,
		AppShell,
		AppBar
	} from '@skeletonlabs/skeleton';
	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';

	import YaMapLoader from '$lib/components/YaMapLoader.svelte';
	import { setToastStore } from '$lib/utils/toaster';
	import { appInitialization } from '$lib/stores';

	initializeStores();

	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
	const toastStore = getToastStore();
	setToastStore(toastStore);
</script>

<YaMapLoader />
<Modal regionBackdrop="!bg-transparent" />
<Toast />

<AppShell class="relative" slotHeader="z-30" slotPageFooter="relative z-30">
	<svelte:fragment slot="header">
		<AppBar background={$appInitialization ? 'none' : 'bg-seafoam-green/85'}>
			<svelte:fragment slot="lead">
				<h1 class="text-xl h-10 flex gap-x-0.5 text-cappuccino">
					<span class="self-start">coffee</span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="28"
						height="28"
						class="self-center"
						viewBox="0 0 24 24"
					>
						<g
							fill="none"
							stroke="currentColor"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
						>
							<path
								fill="currentColor"
								d="M14 4v7c0 1.66 -1.34 3 -3 3h-4c-1.66 0 -3 -1.34 -3 -3v-7Z"
							/>
							<path d="M14 4h3c0.55 0 1 0.45 1 1v3c0 0.55 -0.45 1 -1 1h-3" />
							<path d="M4 18h15.5" />
							<path d="M19.5 18l-3 -3M19.5 18l-3 3" />
						</g>
					</svg>
					<span class="self-end">walker</span>
				</h1></svelte:fragment
			>
			<svelte:fragment slot="trail">
				<!-- <a class="btn btn-sm variant-ghost-surface"></a>				 -->
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<svelte:fragment slot="pageFooter"
		><div class="flex justify-center py-1">
			<a href="https://github.com/alexey-ryabkov/ith-htm5-api?tab=readme-ov-file" class="text-xs"
				>О проекте</a
			>
		</div>
	</svelte:fragment>
	<slot />
</AppShell>
