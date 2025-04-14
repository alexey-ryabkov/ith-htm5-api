import { get } from 'svelte/store';
import type { YMap } from 'ymaps3';
import { userCoffeePoints, userCode, userPoints } from '$lib/stores';
import type { MapCoords } from '$lib/types';
import AppIcon from '$lib/components/AppIcon/component.svelte';
import { type AppIconName } from '$lib/components/AppIcon/icons.ts';

export const isNewcomer = () => get(userCode) === 'newcomer';
export const hasPlaces = () => get(userCoffeePoints).length + get(userPoints).length > 0;

export const addLocationMarker = (
	mapInstance: YMap,
	coordinates: MapCoords,
	container: HTMLElement | null = null
) => {
	addMapMarker(mapInstance, '', 'location', 'human-greeting', 32, coordinates, container);
};

export const addUserPointMarker = (
	mapInstance: YMap,
	id: string,
	coordinates: MapCoords,
	container: HTMLElement | null = null
) => {
	addMapMarker(mapInstance, id, 'user', 'pin', 32, coordinates, container);
};

export const addCoffeeMarker = (
	mapInstance: YMap,
	id: string,
	userSaved = false,
	coordinates: MapCoords,
	container: HTMLElement | null = null
) => {
	addMapMarker(
		mapInstance,
		id,
		userSaved ? 'user-coffee' : 'coffee',
		'coffee-cup',
		32,
		coordinates,
		container
	);
	// addMapMarker(mapInstance, id, 'user', 'pin', 32, coordinates, container);
};

export const addMapMarker = (
	mapInstance: YMap,
	id: string,
	type: 'user' | 'coffee' | 'user-coffee' | 'location',
	iconName: AppIconName,
	iconSize: number,
	coordinates: MapCoords,
	container: HTMLElement | null = null,
	bindPopup = !!id
) => {
	const { YMapMarker } = ymaps3;
	const markerElement = document.createElement('div');
	markerElement.className = `${type}-marker`;

	new AppIcon({
		props: { name: iconName, size: iconSize },
		target: markerElement
	});

	if (bindPopup) {
		markerElement.addEventListener('click', (e) => {
			const marker = e.currentTarget as HTMLElement | SVGElement;
			const { width, height, top, left } = marker.getBoundingClientRect();
			marker.dataset.markerId = id;
			const popupTarget = (container ?? document).querySelector(
				`[data-popuped="${id}Popup"]`
			) as HTMLElement;
			if (popupTarget) {
				popupTarget.style.width = `${width}px`;
				popupTarget.style.height = `${height}px`;
				popupTarget.style.top = `${top}px`;
				popupTarget.style.left = `${left}px`;
				popupTarget.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
			}
		});
	}
	const marker = new YMapMarker(
		{
			coordinates,
			draggable: false
		},
		markerElement
	);
	mapInstance.addChild(marker);
};
