import { writable } from 'svelte/store';

export * from './persistent';
export { default as map } from './map';

// TODO убрать после отладки
export const appInitialization = writable(true);
