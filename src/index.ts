// (c) 2025 metatable.dev, all rights reserved.
// Cloudflare Worker converting image URL into pixel matrix for Luau.
import { PhotonImage } from '@cf-wasm/photon';

export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const imageUrl = url.searchParams.get("url");

		if (!imageUrl) {
			return new Response(JSON.stringify({ error: "Missing ?url= parameter" }), {
				status: 400,
				headers: {
					"Content-Type": "application/json"
				},
			});
		}

		try {
			const imageRes = await fetch(imageUrl, {
				headers: {
					"Accept": "image/*",
					"User-Agent": "Mozilla/5.0 (compatible; CFWorker; +https://developers.cloudflare.com/workers/)"
				}
			});

			if (!imageRes.ok) throw new Error(`Image fetch failed with status ${imageRes.status}. Got response: ${imageRes.statusText}`);

			const inputBuffer = await imageRes.arrayBuffer();
			const inputBytes = new Uint8Array(inputBuffer);

			const photonImage = PhotonImage.new_from_byteslice(inputBytes);
			const width = photonImage.get_width();
			const height = photonImage.get_height();
			const rawPixels = photonImage.get_raw_pixels();

			const pixels: number[][][] = [];
			for (let y = 0; y < height; y++) {
				const row: number[][] = [];
				for (let x = 0; x < width; x++) {
					const idx = (y * width + x) * 4;

					const r = rawPixels[idx];
					const g = rawPixels[idx + 1];
					const b = rawPixels[idx + 2];

					const a = rawPixels[idx + 3] / 255;
					const rBlended = r * a + (1 - a) * 255;
					const gBlended = g * a + (1 - a) * 255;
					const bBlended = b * a + (1 - a) * 255;
					row.push([rBlended, gBlended, bBlended]);

				}
				pixels.push(row);
			}

			photonImage.free();

			const responseBody = {
				width,
				height,
				pixels,
			};

			return new Response(JSON.stringify(responseBody), {
				headers: { "Content-Type": "application/json" },
			});
		} catch (err) {
			console.error("/ error:", err);
			return new Response(JSON.stringify({ error: (err as Error).message || "Unknown error" }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}
	},
};
