import type { MapCoords } from './types';

export const DEFAULT_USER_COORDS: MapCoords = [37.618423, 55.751244];
export const DEFAULT_MAP_ZOOM = 16;
export const ERR_TOAST_TIMEOUT = 10_000;
export const GEOCODE_SEARCH_TEXT = ['кофейня', 'кофе на вынос'];
export const GEOCODE_RESULTS_LIMIT = 50;
export const MAP_UPDATE_ANIMATION = 300;
export const MAP_SEARCH_SPAN = 0.025; // в градусах широты/долготы: ~15-20мин пешком на широте/долготе Москвы
