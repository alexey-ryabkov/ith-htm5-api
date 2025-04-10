// Stores synced with browser local storage

import { DEFAULT_USER_COORDS } from '$lib/constants';
import type { MapCoords } from '$lib/types';
import createStore from '$lib/core/createPersistentStore';

export const darkMode = createStore<boolean>('dark_mode', false);
export const userCoords = createStore<MapCoords>('user_coords', DEFAULT_USER_COORDS);
