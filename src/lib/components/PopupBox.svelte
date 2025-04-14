<script lang="ts">
	export let variant:
		| 'primary'
		| 'secondary'
		| 'tertiary'
		| 'surface'
		| 'cappuccino'
		| 'success'
		| 'warning'
		| 'error' = 'primary';
	const { class: cls = '', $$slots: _, $$scope: __, ...attrs } = $$props;
</script>

<div
	class="card p-3 variant-filled-{variant == 'cappuccino' || variant == 'surface'
		? 'secondary'
		: variant} {variant == 'cappuccino'
		? ' bg-cappuccino'
		: variant == 'surface'
			? ' bg-surface-900 text-surface-50'
			: ''} {cls}"
	{...attrs}
>
	<slot />
	<div
		class="arrow variant-filled-{variant == 'cappuccino' || variant == 'surface'
			? 'secondary'
			: variant} {variant == 'cappuccino'
			? ' bg-cappuccino'
			: variant == 'surface'
				? ' bg-surface-900 text-surface-50'
				: ''}"
	/>
</div>
