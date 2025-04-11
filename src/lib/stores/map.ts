import { readable } from 'svelte/store';
import type { YMap, YMapLocationRequest } from 'ymaps3';
import { DEFAULT_MAP_ZOOM as zoom } from '$lib/constants';
import type { MapCoords } from '$lib/types';
import { wait4ymaps3 } from '$lib/utils';

let _set: ((value: YMap | null) => void) | null = null;
const map = readable<YMap | null>(null, (set) => {
	_set = set;
	return () => (_set = null);
});

export async function initMap(container: HTMLDivElement, center: MapCoords) {
	await wait4ymaps3();

	const { YMap, YMapDefaultSchemeLayer } = ymaps3;
	const location: YMapLocationRequest = { center, zoom };
	const mapInstance = new YMap(container, { location });
	mapInstance.addChild(new YMapDefaultSchemeLayer({}));

	if (_set) _set(mapInstance);
}

export default map;
