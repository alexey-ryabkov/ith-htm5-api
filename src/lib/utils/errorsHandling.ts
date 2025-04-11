import AppError from '$lib/core/AppError';
import type { ErrorHandler } from '$lib/types';
import { ERR_TOAST_TIMEOUT } from '$lib/constants';
import { triggerToast } from '$lib/utils/toaster';

export const inNotificationBoundary = <T = unknown>(
	func: () => T,
	fallback?: () => T,
	message?: string
) => inErrorBoundary<T>(func, fallback, showError2user.bind(null, undefined, message));

export const inMuteErrorBoundary = <T = unknown>(func: () => T, fallback?: () => T) =>
	inErrorBoundary<T>(func, fallback, null);

export function inErrorBoundary<T = unknown>(
	func: () => T,
	fallback?: () => T,
	errorHandler: ErrorHandler | null = defaultErrorHandler,
	always?: () => void
): T | void | (typeof errorHandler extends ErrorHandler ? ReturnType<typeof errorHandler> : void) {
	let result: T | AppError | void = undefined;
	try {
		result = func();
	} catch (funcErr) {
		if (fallback) {
			try {
				result = fallback();
			} catch (fallbackErr) {
				if (errorHandler) {
					result = errorHandler(fallbackErr);
				}
			}
		}
		if (errorHandler) {
			result = errorHandler(funcErr);
		}
	} finally {
		always?.();
	}
	return result;
}

export const showError2user: ErrorHandler = (err, message?: string, autohide = true) => {
	const error = appErrorHandler(err, !!message);
	message ??= String(error);
	triggerToast({
		message,
		background: 'variant-filled-error',
		timeout: ERR_TOAST_TIMEOUT,
		hoverable: autohide,
		autohide
	});
	// return error;
};

export const defaultErrorHandler: ErrorHandler<void> = (err) => {
	appErrorHandler(err);
};

export const appErrorHandler: ErrorHandler<AppError> = (err, err2console = true) => {
	const error = AppError.from(err);
	if (err2console) {
		console.error(`App error occurs: ${error}`);
		console.dir(error);
	}
	return error;
};
