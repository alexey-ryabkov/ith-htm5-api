import type { ToastStore } from '@skeletonlabs/skeleton';

let toastStore: ToastStore | null = null;

export function setToastStore(store: ToastStore) {
	toastStore = store;
}

export function triggerToast(opts: Parameters<ToastStore['trigger']>[0]) {
	if (toastStore) {
		toastStore.trigger(opts);
	} else {
		alert(opts.message); // toast fallback if it`s not availiable yet
		console.warn('Toast store not set yet');
	}
}
