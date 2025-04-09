<script lang="ts">
	const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY;
	const scriptSrc = `https://api-maps.yandex.ru/v3/?apikey=${apiKey}&lang=ru_RU`;
</script>

<svelte:head>
	<script src={scriptSrc} defer></script>
</svelte:head>
