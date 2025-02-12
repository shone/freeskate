import * as THREE from 'three';
import {GLTFLoader    } from './threejs/examples/jsm/loaders/GLTFLoader.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass    } from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass      } from 'three/addons/postprocessing/GTAOPass.js';
import {OutputPass    } from 'three/addons/postprocessing/OutputPass.js';

const canvas = document.querySelector('canvas');

const webglRenderer = new THREE.WebGLRenderer({canvas});
webglRenderer.setPixelRatio(window.devicePixelRatio);
webglRenderer.toneMapping = THREE.ACESFilmicToneMapping;
webglRenderer.toneMappingExposure = 1;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x073642);

const hemisphereLight = new THREE.HemisphereLight(0xe3f6ff, 0xfff5e9, 2.5);
scene.add(hemisphereLight);

const pointLight = new THREE.PointLight(0xffffff, .5);
pointLight.position.set(.3, .3, .3);
scene.add(pointLight);

// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);

const camera = new THREE.PerspectiveCamera(
	60, // FOV
	window.innerWidth / window.innerHeight, // Aspect
	1, // Near
	400, // Far
);

const orbitRadius = .3;
const orbitPosition = {xRad: 0, yRad: Math.PI * -.1};
const orbitMomentum = {xRadPerMs: .008, yRadPerMs: .0025};
const orbitDamping = {xRadPerMs2: .000008, yRadPerMs2: .000004};

canvas.onpointerdown = downEvent => {
	if (canvas.onpointermove) {
		return;
	}
	downEvent.preventDefault();
	orbitMomentum.xRadPerMs = 0;
	orbitMomentum.yRadPerMs = 0;
	canvas.setPointerCapture(downEvent.pointerId);
	canvas.style.cursor = 'grabbing';
	let lastPointerEvent = downEvent;
	let lastPointerEventTimestampMs = performance.now();
	let pointerSpeedX = 0;
	let pointerSpeedY = 0;
	canvas.onpointermove = moveEvent => {
		if (moveEvent.pointerId !== downEvent.pointerId) {
			return;
		}
		const timestampNowMs = performance.now();
		const dt = timestampNowMs - lastPointerEventTimestampMs;
		const pointerMovementX = (moveEvent.clientX-lastPointerEvent.clientX) / window.innerWidth;
		const pointerMovementY = (moveEvent.clientY-lastPointerEvent.clientY) / window.innerHeight;
		pointerSpeedX = pointerMovementX / dt;
		pointerSpeedY = pointerMovementY / dt;
		orbitPosition.xRad -= pointerMovementX * 5;
		orbitPosition.yRad += pointerMovementY * 5;
		lastPointerEvent = moveEvent;
		lastPointerEventTimestampMs = timestampNowMs;
		render();
	}
	canvas.onlostpointercapture = upEvent => {
		if (upEvent.pointerId !== downEvent.pointerId) {
			return;
		}
		canvas.onpointermove = null;
		canvas.onlostpointercapture = null;
		canvas.style.cursor = 'grab';
		if ((performance.now()-lastPointerEventTimestampMs) < 100) {
			orbitMomentum.xRadPerMs = -pointerSpeedX * 2;
			orbitMomentum.yRadPerMs =  pointerSpeedY * 2;
		}
		render();
	}
}

const composer = new EffectComposer(webglRenderer);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const gtaoPass = new GTAOPass(
	scene, camera,
	window.innerWidth, window.innerHeight,
	null,
	{ // AO parameters
		radius: 0.01,
		distanceExponent: 1,
		thickness: 1,
		scale: 1,
		samples: 6,
		distanceFallOff: 1,
		screenSpaceRadius: false,
	},
	{ // PD parameters
		lumaPhi: 10,
		depthPhi: 2,
		normalPhi: 3,
		radius: 4,
		radiusExponent: 1,
		rings: 2,
		samples: 2,
	}
);
gtaoPass.output = GTAOPass.OUTPUT.Default;
composer.addPass(gtaoPass);

const outputPass = new OutputPass();
composer.addPass(outputPass);

const orbitCenter = new THREE.Vector3();

let frameId = null;
let lastFrameTimestampMs = performance.now();
function render() {
	if (frameId === null) {
		frameId = requestAnimationFrame(function callback() {
			const timestampNowMs = performance.now();
			const dt = timestampNowMs - lastFrameTimestampMs;
			lastFrameTimestampMs = timestampNowMs;

			orbitPosition.xRad = (orbitPosition.xRad + (orbitMomentum.xRadPerMs*dt)) % (Math.PI*2);
			orbitPosition.yRad = (orbitPosition.yRad + (orbitMomentum.yRadPerMs*dt)) % (Math.PI*2);
			if (orbitPosition.yRad >= Math.PI/2) {
				orbitPosition.yRad = Math.PI/2;
			} else if (orbitPosition.yRad <= -Math.PI/2) {
				orbitPosition.yRad = -Math.PI/2;
			}

			// Damping
			if (orbitMomentum.xRadPerMs !== 0) {
				orbitMomentum.xRadPerMs *= Math.max(Math.abs(orbitMomentum.xRadPerMs) - (orbitDamping.xRadPerMs2*dt), 0) / Math.abs(orbitMomentum.xRadPerMs);
			}
			if (orbitMomentum.yRadPerMs !== 0) {
				orbitMomentum.yRadPerMs *= Math.max(Math.abs(orbitMomentum.yRadPerMs) - (orbitDamping.yRadPerMs2*dt), 0) / Math.abs(orbitMomentum.yRadPerMs);
			}

			camera.position.z = Math.cos(orbitPosition.yRad) * orbitRadius;
			camera.position.y = Math.sin(orbitPosition.yRad) * orbitRadius;

			const r = camera.position.z;
			camera.position.x = Math.sin(orbitPosition.xRad) * r;
			camera.position.z = Math.cos(orbitPosition.xRad) * r;

			camera.lookAt(orbitCenter);

			composer.render();

			if (orbitMomentum.xRadPerMs!==0 || orbitMomentum.yRadPerMs!==0) {
				frameId = requestAnimationFrame(callback);
			} else {
				frameId = null;
			}
		});
	}
}

render();

function handleWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	webglRenderer.setSize(window.innerWidth, window.innerHeight);
	composer.setSize(window.innerWidth/2, window.innerHeight/2);
	render();
}
handleWindowResize();
window.addEventListener('resize', handleWindowResize);

// Setup fullscreen button
{
	// Note that the fullscreen API is only available on iOS for iPad, not iPhone.
	const isFullscreenApiAvailable = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
	// If the app is launched with the display-mode as fullscreen, it's probably because the app is installed as a PWA.
	const isDisplayModeFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
	if (isFullscreenApiAvailable && !isDisplayModeFullscreen) {
		const fullscreenButton = document.getElementById('fullscreen-button');
		function toggleFullscreen() {
			// Toggle fullscreen mode
			if (!(document.fullscreenElement || document.webkitFullscreenElement)) {
				if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen({navigationUI: "hide"});
				else if (document.documentElement.webkitRequestFullscreen) document.documentElement.webkitRequestFullscreen();
			} else {
				if (document.exitFullscreen) document.exitFullscreen();
				else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
			}
		}
		fullscreenButton.onclick = toggleFullscreen;
		fullscreenButton.classList.remove('hide');
		window.addEventListener('keydown', ({key}) => (key === 'f') && toggleFullscreen());
	}
}

const colors = {
	none:      0x000000,
	aqua:      0x0097D6,
	black:     0x2E2E2B,
	cyan:      0x00D8EB,
	darkGreen: 0x357C39,
	green:     0x49EA5F,
	lavender:  0xBD99C6,
	mint:      0x76EDB8,
	orange:    0xFF952E,
	pink:      0xFF7CAE,
	red:       0xFF554B,
	violet:    0x9A4C98,
	white:     0xCFCDC3,
	yellow:    0xFFEB03,
}

const materials = {
	chrome:       new THREE.MeshStandardMaterial({color: 0xffffff, roughness: .01, metalness: .75}),
	aluminium:    new THREE.MeshStandardMaterial({color: 0xaaaaaa, roughness: .3, metalness: .6}),
	acrylic:      new THREE.MeshStandardMaterial({color: 0xaaaaaa, roughness: .6, metalness: 0}),
	plastic:      new THREE.MeshStandardMaterial({color: 0x000000, roughness: .6, metalness: 0}),
	polyurethane: new THREE.MeshStandardMaterial({color: 0x000000}),
	griptape:     new THREE.MeshStandardMaterial({color: 0x000000, roughness: .6}),
}

const griptapeMenu  = document.querySelector('.menu.griptape');
const edgeGuardMenu  = document.querySelector('.menu.edge-guard');
const wheelFrontMenu = document.querySelector('.menu.wheel-front');
const wheelBackMenu  = document.querySelector('.menu.wheel-back');

const wheelColorsHtml = Object.entries(colors).map(([name, value]) => `
	<span data-color="${name}" style="background-color: #${value.toString(16).padStart(6, '0')}"></span>
`).join('');

griptapeMenu.querySelector('.items').insertAdjacentHTML('afterbegin', wheelColorsHtml);
edgeGuardMenu.querySelector('.items').insertAdjacentHTML('afterbegin', wheelColorsHtml);
wheelFrontMenu.querySelector('.items').insertAdjacentHTML('afterbegin', wheelColorsHtml);
wheelBackMenu.querySelector('.items').insertAdjacentHTML('afterbegin', wheelColorsHtml);

const freeskate = await new Promise((resolve, reject) => {
	const gltfLoader = new GLTFLoader();
	const url = 'freeskate.glb';
	gltfLoader.load(
		url,
		function onload(gltf) {
			const freeskate = gltf.scene.children.find(obj => obj.name === 'freeskate');
			if (freeskate) {
				resolve(freeskate);
			} else {
				reject(`Failed to find object named "freeskate" in glTF model ${url}`);
			}
		},
		function onprogress() { },
		function onerror(error) {
			reject('Error while loading glTF at "${url}"');
		}
	);
});
scene.add(freeskate);

const sceneBounds = new THREE.Box3().setFromObject(freeskate);
const sceneSize = sceneBounds.getSize(new THREE.Vector3()).length();
const sceneCenter = sceneBounds.getCenter(new THREE.Vector3());

freeskate.position.x += (freeskate.position.x - sceneCenter.x);
freeskate.position.y += (freeskate.position.y - sceneCenter.y);
freeskate.position.z += (freeskate.position.z - sceneCenter.z);
camera.near = sceneSize / 100;
camera.far  = sceneSize * 100;
camera.updateProjectionMatrix();

camera.position.copy(sceneCenter);
camera.position.x += sceneSize / 2.0;
camera.position.y += sceneSize / 8.0;
camera.position.z += sceneSize / 2.0;
camera.lookAt(sceneCenter);

const objects = [];
freeskate.traverse(object => objects.push(object));

const chassis = objects.find(object => object.name.startsWith('chassis'));
chassis.material = materials.chrome;

const deck = objects.find(object => object.name.startsWith('deck'));
deck.material = materials.aluminium;

const griptape = objects.find(object => object.name.startsWith('grip-tape'));
griptape.material = materials.griptape;
griptape.visible = false;

const shockAbsorber = objects.find(object => object.name.startsWith('shock-absorber'));
shockAbsorber.material = materials.acrylic;

const edgeGuard = objects.find(object => object.name.startsWith('edge-guard'));
edgeGuard.material = materials.plastic;

const wheelFront = objects.find(object => object.name.startsWith('wheel-front'));
const wheelBack  = objects.find(object => object.name.startsWith('wheel-back'));

wheelFront.material = materials.polyurethane.clone();
wheelBack.material  = materials.polyurethane.clone();
wheelFront.material.color.setHex(colors.aqua);
wheelBack.material.color.setHex(colors.aqua);

function onMenuSelect(menu, callback) {
	menu.onclick = event => {
		const colorEl = event.target.closest('[data-color]:not(.selected)');
		if (colorEl) {
			const previouslySelected = menu.querySelector('.selected');
			if (previouslySelected) {
				previouslySelected.classList.remove('selected');
			}
			colorEl.classList.add('selected');
			callback(colorEl.dataset.color);
		}
	}
}
onMenuSelect(griptapeMenu,  color => {
	griptape.visible = color !== 'none';
	griptape.material.color.setHex(colors[color]);
	render();
});
onMenuSelect(edgeGuardMenu,  color => {
	edgeGuard.visible = color !== 'none';
	edgeGuard.material.color.setHex(colors[color]);
	render();
});
onMenuSelect(wheelFrontMenu, color => {
	wheelFront.visible = color !== 'none';
	wheelFront.material.color.setHex(colors[color]);
	render();
});
onMenuSelect(wheelBackMenu,  color => {
	wheelBack.visible = color !== 'none';
	wheelBack.material.color.setHex(colors[color]);
	render();
});

document.body.addEventListener('pointerdown', event => {
	const menu = event.target.closest('.menu');
	const label = event.target.closest('label');
	if (menu && label) {
		menu.classList.toggle('open');
	} else if (!menu && !label) {
		[...document.querySelectorAll('.menu')].forEach(menu => menu.classList.remove('open'));
	}
});

// window.addEventListener('devicemotion', ({rotationRate}) => {
// 	const orientationAngleRad = (screen.orientation.angle / 360) * Math.PI*2;
// 	// Rotate the device motion coordinates to match the orientation of the page, e.g. portrait or landscape modes.
// 	const rotateRate = .00005;
// 	// freeskate.rotateY(rotationRate.beta  * rotateRate);
// 	freeskate.rotateOnAxis(camera.position -rotationRate.alpha * rotateRate);
// 	// freeskate.rotateZ(rotationRate.gamma  * rotateRate);
// 	render();
// });
