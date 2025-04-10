import { writable } from 'svelte/store';

export * from './persistent';

export const mapIsReady = writable(false);
