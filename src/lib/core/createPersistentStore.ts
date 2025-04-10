import { writable, type Writable } from 'svelte/store';
import appLocalStorage from './appLocalStorage';

/**
 * Create store synced with browser local storage
 */
export default function createPersistentStore<T>(key: string, initial: T): Writable<T> {
	const getValue = () => appLocalStorage.get<T>(key, initial)!;

	const store = writable<T>(getValue());
	store.subscribe((value) => appLocalStorage.set<T>(key, value));

	window.addEventListener('storage', (event) => {
		const { key: storageKey } = event;
		if (storageKey === key) {
			store.set(getValue());
		}
	});
	return store;
}
