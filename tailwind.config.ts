import { join } from 'path';
import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import { skeleton } from '@skeletonlabs/tw-plugin';

export default {
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}')
	],
	theme: {
		extend: {
			colors: {
				'seafoam-green': '#a3d1ce',
				'lavender-blue': '#cbddfe',
				cappuccino: {
					DEFAULT: '#6f4f37',
					50: '#F3ECE7',
					100: '#E9DCD3',
					200: '#D1B7A3',
					300: '#BB9477',
					400: '#9D704E',
					500: '#6F4F37',
					600: '#593F2C',
					700: '#443122',
					800: '#2C2016',
					900: '#18110C',
					950: '#0A0705'
				}
			}
		}
	},
	plugins: [
		forms,
		typography,
		skeleton({
			themes: {
				preset: [
					{
						name: 'seafoam',
						enhancements: true
					}
				]
			}
		})
	]
} satisfies Config;
