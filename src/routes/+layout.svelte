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
	import AppIcon from '$lib/components/AppIcon/component.svelte';

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
				<h1 class="text-xl h-10 flex gap-x-0.5">
					<span class="self-start">coffee</span>
					<AppIcon name="coffe-cup-arrow" size={28} class="text-cappuccino self-center" />
					<span class="self-end">walker</span>
				</h1></svelte:fragment
			>
			<svelte:fragment slot="trail">
				<!-- <a class="btn btn-sm variant-ghost-surface"></a>				 -->
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>
	<svelte:fragment slot="pageFooter"
		><div class="flex justify-start p-2">
			<a href="https://github.com/alexey-ryabkov/ith-htm5-api?tab=readme-ov-file" class="text-xs"
				>О проекте</a
			>
		</div>
	</svelte:fragment>
	<slot />
</AppShell>
