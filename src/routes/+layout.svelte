<script lang="ts">
	import '../app.postcss';
	import { initializeStores, storePopup, Modal, AppShell, AppBar } from '@skeletonlabs/skeleton';
	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import Icon from '@iconify/svelte';

	import YaMapLoader from '$lib/components/YaMapLoader.svelte';

	initializeStores();
	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });
</script>

<YaMapLoader />
<Modal />

<AppShell class="relative" slotHeader="z-30" slotPageFooter="relative z-30">
	<svelte:fragment slot="header">
		<AppBar background="none">
			<svelte:fragment slot="lead">
				<h1 class="h4 h-10 flex gap-x-0.5 text-cappuccino">
					<span class="self-start">coffee</span>
					<Icon icon="mdi:coffee-to-go" width="28" height="28" class="self-center" />
					<span class="self-end">walker</span>
				</h1></svelte:fragment
			>
			<!-- <svelte:fragment slot="trail">
				<a
					class="btn btn-sm variant-ghost-surface"
				>
				</a>				
			</svelte:fragment> -->
		</AppBar>
	</svelte:fragment>
	<svelte:fragment slot="pageFooter"
		><div class="flex justify-center py-1">
			<a href="https://github.com/alexey-ryabkov/ith-html5-api?tab=readme-ov-file" class="text-xs"
				>О проекте</a
			>
		</div></svelte:fragment
	>
	<slot />
</AppShell>
