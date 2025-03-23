self.addEventListener('install', event => {
	event.waitUntil(async function installWaitUntil() {
		// Cache everything the app should need to run offline
		const cache = await caches.open('static-assets-v1');
		await cache.addAll([
			'./index.html',
			'./main.css',
			'./main.mjs',
			'./freeskate.glb',
			'./manifest.webmanifest',
			'./icon/icon_64x64.png',
			'./icon/icon_192x192.png',
			'./icon/icon_512x512.png',
			'./threejs/build/three.module.js',
			'./threejs/examples/jsm/controls/OrbitControls.js',
			'./threejs/examples/jsm/loaders/GLTFLoader.js',
			'./threejs/examples/jsm/math/SimplexNoise.js',
			'./threejs/examples/jsm/postprocessing/EffectComposer.js',
			'./threejs/examples/jsm/postprocessing/GTAOPass.js',
			'./threejs/examples/jsm/postprocessing/MaskPass.js',
			'./threejs/examples/jsm/postprocessing/OutputPass.js',
			'./threejs/examples/jsm/postprocessing/Pass.js',
			'./threejs/examples/jsm/postprocessing/RenderPass.js',
			'./threejs/examples/jsm/postprocessing/ShaderPass.js',
			'./threejs/examples/jsm/shaders/CopyShader.js',
			'./threejs/examples/jsm/shaders/GTAOShader.js',
			'./threejs/examples/jsm/shaders/OutputShader.js',
			'./threejs/examples/jsm/shaders/PoissonDenoiseShader.js',
			'./threejs/examples/jsm/utils/BufferGeometryUtils.js',
		]);
	}());
});

self.addEventListener('fetch', event => {
	event.respondWith(async function fetchRespondWith() {
		// Try to fetch over the network, but if that fails get it from the cache.
		const cache = await caches.open('static-assets-v1');
		try {
			const networkResponse = await fetch(event.request);
			cache.put(event.request, networkResponse.clone());
			return networkResponse;
		} catch (error) {
			return cache.match(event.request);
		}
	}());
});
