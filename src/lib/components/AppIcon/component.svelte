<script lang="ts">
	import { type AppIconName, DEFAULT_ICON_SIZE, icons } from './icons';

	export let name: AppIconName;
	export let size: [number, number | undefined] | number = DEFAULT_ICON_SIZE;
	export let viewbox: string | undefined = undefined;
	export let color = 'none';

	if (typeof size === 'number') {
		size = [size, undefined];
	}
</script>

{#if icons[name]}
	<svg
		xmlns:xlink="http://www.w3.org/1999/xlink"
		xmlns="http://www.w3.org/2000/svg"
		width={size[0]}
		height={size[1]}
		fill={color}
		viewBox={viewbox ?? icons[name].viewbox ?? `0 0 ${DEFAULT_ICON_SIZE} ${DEFAULT_ICON_SIZE}`}
		aria-hidden="true"
		{...$$restProps}
	>
		{@html icons[name].path}
	</svg>
{/if}
