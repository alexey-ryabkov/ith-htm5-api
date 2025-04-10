// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ErrorHandler<T = void> = (e: unknown, ...args: any[]) => T;

export type MapCoords = [number, number];
