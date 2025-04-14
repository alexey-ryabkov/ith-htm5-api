import type { MapCoords } from '$lib/types';
import { inErrorBoundary } from './errorsHandling';

export * from './errorsHandling';

export async function wait4ymaps3(): Promise<void> {
	while (!('ymaps3' in window)) {
		await new Promise((r) => setTimeout(r, 50));
	}
	await ymaps3.ready;
}

export const jsonParse = <T>(value: string | null, fallbackValue: T | null = null) => {
	if (!value) return fallbackValue;
	return inErrorBoundary<T>(() => JSON.parse(value) as T) ?? fallbackValue;
};

export const hashCoords = ([x, y]: MapCoords) => simpleHash(`${x},${y}`).toString(36);

export const simpleHash = (value: string) => {
	let hash = 0;
	for (let i = 0; i < value.length; i++) {
		hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
	}
	return hash >>> 0;
};
