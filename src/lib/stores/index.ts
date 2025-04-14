import { writable } from 'svelte/store';

export * from './persistent';
export { default as map } from './map';

export const appInitialization = writable(true);
