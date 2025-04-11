import { get } from 'svelte/store';
import appLocalStorage from '$lib/core/appLocalStorage';
import { coffeePoints, userPoints } from '$lib/stores';

export const isNewcomer = () => appLocalStorage.get<boolean>('user_location', false)!;

export const hasPlaces = () => get(coffeePoints).length + get(userPoints).length > 0;
