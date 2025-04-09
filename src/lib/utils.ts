export async function wait4ymaps3(): Promise<void> {
	while (!('ymaps3' in window)) {
		await new Promise((r) => setTimeout(r, 50));
	}
	await ymaps3.ready;
}
