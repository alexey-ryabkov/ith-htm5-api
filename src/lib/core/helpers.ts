import { get } from 'svelte/store';
import type { YMap } from 'ymaps3';
import { userCoffeePoints, userCode, userPoints } from '$lib/stores';
import type { MapCoords } from '$lib/types';

export const isNewcomer = () => get(userCode) === 'newcomer';
export const hasPlaces = () => get(userCoffeePoints).length + get(userPoints).length > 0;

export const addMapMarker = (
	mapInstance: YMap,
	id: string,
	type: 'user' | 'coffee' | 'user-coffee',
	coordinates: MapCoords,
	container: HTMLElement | null = null
) => {
	const { YMapMarker } = ymaps3;
	const markerElement = document.createElement('div');
	markerElement.className = `${type}-marker`;
	markerElement.innerHTML =
		type == 'user'
			? `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
					<path fill="currentColor" d="M14.102 2.664c.628-.416 1.692-.713 2.495.09l4.647 4.648c.806.804.508 1.868.091 2.495a2.95 2.95 0 0 1-.863.85c-.334.213-.756.374-1.211.35a9 9 0 0 1-.658-.071l-.068-.01a9 9 0 0 0-.707-.073c-.504-.025-.698.06-.76.12l-2.49 2.491c-.08.08-.18.258-.256.6c-.073.33-.105.736-.113 1.186c-.007.432.008.874.024 1.3l.001.047c.015.423.03.855.009 1.194c-.065 1.031-.868 1.79-1.658 2.141c-.79.35-1.917.437-2.7-.347l-2.25-2.25L3.53 21.53a.75.75 0 1 1-1.06-1.06l4.104-4.105l-2.25-2.25c-.783-.784-.697-1.91-.346-2.7c.35-.79 1.11-1.593 2.14-1.658c.34-.021.772-.006 1.195.009l.047.001c.426.015.868.031 1.3.024c.45-.008.856-.04 1.186-.113c.342-.076.52-.177.6-.257l2.49-2.49c.061-.061.146-.256.12-.76a9 9 0 0 0-.073-.707l-.009-.068a9 9 0 0 1-.071-.658c-.025-.455.136-.877.348-1.211c.216-.34.515-.64.851-.863" />
				</svg>`
			: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
						<path fill="currentColor" d="M7 22h10a1 1 0 0 0 .99-.858L19.867 8H21V6h-1.382l-1.724-3.447A1 1 0 0 0 17 2H7c-.379 0-.725.214-.895.553L4.382 6H3v2h1.133L6.01 21.142A1 1 0 0 0 7 22m10.418-11H6.582l-.429-3h11.693zm-9.551 9l-.429-3h9.123l-.429 3zM7.618 4h8.764l1 2H6.618z" />
					</svg>`;
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
	const marker = new YMapMarker(
		{
			coordinates,
			draggable: false
		},
		markerElement
	);
	mapInstance.addChild(marker);
};
