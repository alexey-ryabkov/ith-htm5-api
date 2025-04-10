import { inErrorBoundary, jsonParse } from '$lib/utils';

/**
 * App localStorage wrapper singleton
 */
export default new (class LocalStorage {
	private static _instance: LocalStorage;
	protected static readonly _KEY_PREFIX = `cw-`;

	constructor() {
		if (LocalStorage._instance) {
			throw new Error('Use LocalStorage.instance for use LocalStorage singleton class object');
		}
		LocalStorage._instance = this;
	}

	static get instance() {
		if (!LocalStorage._instance) {
			LocalStorage._instance = new LocalStorage();
		}
		return LocalStorage._instance;
	}

	set<T>(key: string, value: T): void {
		inErrorBoundary(() =>
			localStorage.setItem(LocalStorage._KEY_PREFIX + key, JSON.stringify(value))
		);
	}

	get<T>(key: string, fallbackValue: T | null = null): T | null {
		return jsonParse<T>(localStorage.getItem(LocalStorage._KEY_PREFIX + key), fallbackValue);
	}

	remove(key: string): void {
		localStorage.removeItem(LocalStorage._KEY_PREFIX + key);
	}

	clear(): void {
		Object.keys(localStorage)
			.filter((key) => key.startsWith(LocalStorage._KEY_PREFIX))
			.forEach((key) => localStorage.removeItem(key));
	}
})();
