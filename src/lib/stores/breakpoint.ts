import { writable } from 'svelte/store';

const breakpoints = {
	xs: 0,
	sm: 576,
	md: 768,
	lg: 992,
	xl: 1200
};

export const currentBreakpoint = writable(getCurrentBreakpoint());

function getCurrentBreakpoint() {
	const width = window.innerWidth;
	if (width < breakpoints.sm) return 'xs';
	if (width >= breakpoints.sm && width < breakpoints.md) return 'sm';
	if (width >= breakpoints.md && width < breakpoints.lg) return 'md';
	if (width >= breakpoints.lg && width < breakpoints.xl) return 'lg';
	return 'xl';
}

window.addEventListener('resize', () => {
	currentBreakpoint.set(getCurrentBreakpoint());
});
