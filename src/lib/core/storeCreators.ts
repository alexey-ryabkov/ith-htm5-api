import { get, writable, type Writable } from 'svelte/store';
import appLocalStorage from './appLocalStorage';
import type { CrudEntityItem, CrudEntityStore } from '$lib/types';

/**
 * Create store synced with browser local storage
 */
export function createPersistentStore<T>(name: string, initial: T): Writable<T> {
	const getValue = () => appLocalStorage.get<T>(name, initial)!;

	const store = writable<T>(getValue());
	store.subscribe((value) => appLocalStorage.set<T>(name, value));

	window.addEventListener('storage', (event) => {
		const { key: storageKey } = event;
		if (storageKey === name) {
			store.set(getValue());
		}
	});
	return store;
}

/**
 * Create store with CRUD opts, synced with browser local storage
 */
export function createCrudEntityStore<T extends CrudEntityItem>(
	name: string,
	initial: T[] = []
): CrudEntityStore<T> {
	const store = createPersistentStore<T[]>(name, initial);
	return makeCrudEntityStore<T>(store);
}

function makeCrudEntityStore<T extends CrudEntityItem>(store: Writable<T[]>): CrudEntityStore<T> {
	return {
		subscribe: store.subscribe,
		add(item) {
			store.update((items) => [...items, item]);
		},
		edit(id, changes) {
			store.update((items) =>
				items.map((item) => (item.id === id ? { ...item, ...changes } : item))
			);
		},
		remove(id) {
			store.update((items) => items.filter((item) => item.id !== id));
		},
		clear() {
			store.set([]);
		},
		get(id) {
			return get(store).find((item) => item.id === id);
		}
	};
}
