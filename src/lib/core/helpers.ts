import { get } from 'svelte/store';
import { coffeePoints, userCode, userPoints } from '$lib/stores';

export const isNewcomer = () => get(userCode) === 'newcomer';
export const hasPlaces = () => get(coffeePoints).length + get(userPoints).length > 0;
