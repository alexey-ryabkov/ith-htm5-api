// Stores synced with browser local storage

import { DEFAULT_USER_COORDS } from '$lib/constants';
import type { CoffeePoint, MapCoords, UserPoint } from '$lib/types';
import { createPersistentStore, createCrudEntityStore } from '$lib/core/storeCreators';

// export const darkMode = createStore<boolean>('dark_mode', false);

export const userCode = createPersistentStore<string>('user_code', 'newcomer');
export const userLocation = createPersistentStore<MapCoords>('user_location', DEFAULT_USER_COORDS);
// export const userRoutes = createCrudEntityStore<UserRoute>('user_routes');
export const coffeePoints = createCrudEntityStore<CoffeePoint>('coffee_points');
export const userPoints = createCrudEntityStore<UserPoint>('user_points');
