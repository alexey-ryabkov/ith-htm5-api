<script lang="ts">
	import { popup } from '@skeletonlabs/skeleton';
	import PopupBox from './PopupBox.svelte';

	export let type: 'coffee' | 'user' = 'user';
	export let mapMakerId: string;
</script>

<div
	use:popup={{
		event: 'click',
		target: `${mapMakerId}Popup`,
		placement: 'top'
	}}
	class="absolute z-[-1]"
	data-popuped="{mapMakerId}Popup"
/>
<PopupBox
	class="z-50"
	variant={type == 'coffee' ? 'cappuccino' : 'surface'}
	data-popup="{mapMakerId}Popup"
>
	<slot />
</PopupBox>
