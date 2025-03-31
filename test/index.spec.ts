// (c) 2025 metatable.dev, all rights reserved.

import { describe, it, expect } from 'vitest';

const PROD_URL = 'https://image-parser.tyrannizerdev.workers.dev';
const TEST_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png';

describe('Live Worker Integration', () => {
	it('GET /?url should return Luau-readable pixel matrix', async () => {
		const url = `${PROD_URL}/?url=${encodeURIComponent(TEST_IMAGE)}&resize=8`;
		const res = await fetch(url);

		expect(res.status).toBe(200);

		const json = await res.json() as { width: number; height: number; pixels: number[][][] };
		expect(json.width).toBe(8);
		expect(json.height).toBe(8);
		expect(Array.isArray(json.pixels)).toBe(true);
		expect(json.pixels.length).toBe(8);
		expect(json.pixels[0].length).toBe(8);
		expect(Array.isArray(json.pixels[0][0])).toBe(true);
		expect(json.pixels[0][0].length).toBe(3); // [r,g,b]
		expect(typeof json.pixels[0][0][0]).toBe('number');

		console.log(json);
	});
});
