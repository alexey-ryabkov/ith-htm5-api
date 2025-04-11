import type { Readable } from 'svelte/store';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ErrorHandler<T = void> = (e: unknown, ...args: any[]) => T;

type MapLongitude = number;
type MapLatitude = number;
export type MapCoords = [MapLongitude, MapLatitude];
// [lon: number, lat: number];

export type CrudEntityItem = {
	id: string | number;
	name: string;
};
interface CrudEntity<T extends CrudEntityItem> {
	add(item: T): void;
	get(id: T['id']): T | undefined;
	edit(id: T['id'], changes: Partial<T>): void;
	remove(id: T['id']): void;
	clear?(): void;
}
export type CrudEntityStore<T extends CrudEntityItem> = Readable<T[]> & CrudEntity<T>;

export type MapPoint = {
	coordinates: MapCoords;
	description?: string;
};
export type CoffeePoint = CrudEntityItem &
	MapPoint & {
		rating?: number;
	};
export type UserPoint = CrudEntityItem & MapPoint;
// export type UserRoute = CrudEntityItem & {
// 	data: unknown;
// };
