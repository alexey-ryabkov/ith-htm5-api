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
