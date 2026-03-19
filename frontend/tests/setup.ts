import '@testing-library/jest-dom/vitest';

type StorageLike = {
	getItem: (key: string) => string | null;
	setItem: (key: string, value: string) => void;
	removeItem: (key: string) => void;
	clear: () => void;
};

const store = new Map<string, string>();

const storageMock: StorageLike = {
	getItem: (key) => (store.has(key) ? store.get(key)! : null),
	setItem: (key, value) => {
		store.set(key, value);
	},
	removeItem: (key) => {
		store.delete(key);
	},
	clear: () => {
		store.clear();
	},
};

Object.defineProperty(globalThis, 'localStorage', {
	value: storageMock,
	writable: true,
});
