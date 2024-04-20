import * as THREE from 'three';
import {OrbitControls} from './threejs/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from './threejs/examples/jsm/loaders/GLTFLoader.js';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const webglRenderer = new THREE.WebGLRenderer({canvas: document.querySelector('canvas')});
webglRenderer.setClearColor(new THREE.Color(0x002b36), 1);
webglRenderer.setPixelRatio(window.devicePixelRatio);
webglRenderer.toneMapping = THREE.ACESFilmicToneMapping;
webglRenderer.toneMappingExposure = 1;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
	60, // FOV
	window.innerWidth / window.innerHeight, // Aspect
	1, // Near
	400, // Far
);

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

let frameId = null;
function render() {
	if (frameId === null) {
		frameId = requestAnimationFrame(() => {
			composer.render();
			frameId = null;
		});
	}
}

const hemisphereLight = new THREE.HemisphereLight(0xe3f6ff, 0xfff5e9, 2.5);
scene.add(hemisphereLight);

const pointLight = new THREE.PointLight(0xffffff, .5);
pointLight.position.set(.3, .3, .3);
scene.add(pointLight);

const materials = {
	chrome:       new THREE.MeshStandardMaterial({color: 0xffffff, roughness: .01, metalness: .75}),
	aluminium:    new THREE.MeshStandardMaterial({color: 0xaaaaaa, roughness: .3, metalness: .6}),
	acrylic:      new THREE.MeshStandardMaterial({color: 0xaaaaaa, roughness: .6, metalness: 0}),
	plastic:      new THREE.MeshStandardMaterial({color: 0x000000, roughness: .6, metalness: 0}),
	polyurethane: new THREE.MeshStandardMaterial({color: 0x000000}),
}

const gltfLoader = new GLTFLoader();
const url = 'freeskate.glb';
gltfLoader.load(url, gltf => {
	scene.add(gltf.scene);
	console.log(`Loaded ${url}:`, gltf.scene);

	const box = new THREE.Box3().setFromObject(gltf.scene);
	const size = box.getSize(new THREE.Vector3()).length();
	const center = box.getCenter(new THREE.Vector3());

	gltf.scene.position.x += (gltf.scene.position.x - center.x);
	gltf.scene.position.y += (gltf.scene.position.y - center.y);
	gltf.scene.position.z += (gltf.scene.position.z - center.z);
	camera.near = size / 100;
	camera.far = size * 100;
	camera.updateProjectionMatrix();

	camera.position.copy(center);
	camera.position.x += size / 2.0;
	camera.position.y += size / 8.0;
	camera.position.z += size / 2.0;
	camera.lookAt(center);

	const orbitControls = new OrbitControls(camera, webglRenderer.domElement);
	orbitControls.maxDistance = size * 10;
	orbitControls.screenSpacePanning = true;
	orbitControls.addEventListener('change', render);

	const objects = [];
	gltf.scene.traverse(object => objects.push(object));

	const chassis = objects.find(object => object.name.startsWith('chassis'));
	chassis.material = materials.chrome;

	const plate = objects.find(object => object.name.startsWith('plate'));
	plate.material = materials.aluminium;

	const shockAbsorber = objects.find(object => object.name.startsWith('shock-absorber'));
	shockAbsorber.material = materials.acrylic;

	const edgeGuard = objects.find(object => object.name.startsWith('edge-guard'));
	edgeGuard.material = materials.plastic;

	const wheelFront = objects.find(object => object.name.startsWith('wheel-front'));
	const wheelBack  = objects.find(object => object.name.startsWith('wheel-back'));

	wheelFront.material = materials.polyurethane.clone();
	wheelBack.material  = materials.polyurethane.clone();

	const edgeGuardMenu = document.querySelector('.menu.edge-guard');
	const wheelFrontMenu = document.querySelector('.menu.wheel-front');
	const wheelBackMenu = document.querySelector('.menu.wheel-back');

	const colors = {
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

	wheelFront.material.color.setHex(colors.aqua);
	wheelBack.material.color.setHex(colors.aqua);

	const wheelColorsHtml = Object.entries(colors).map(([name, value]) => `
		<span data-color="${name}" style="background-color: #${value.toString(16).padStart(6, '0')}"></span>
	`).join('');

	edgeGuardMenu.querySelector('.items').insertAdjacentHTML('afterbegin', wheelColorsHtml);
	wheelFrontMenu.querySelector('.items').insertAdjacentHTML('afterbegin', wheelColorsHtml);
	wheelBackMenu.querySelector('.items').insertAdjacentHTML('afterbegin', wheelColorsHtml);

	edgeGuardMenu.onclick = event => {
		const color = event.target.closest('[data-color]')?.dataset.color;
		if (color) {
			edgeGuard.material.color.setHex(colors[color]);
			render();
		}
	}
	wheelFrontMenu.onclick = event => {
		const color = event.target.closest('[data-color]')?.dataset.color;
		if (color) {
			wheelFront.material.color.setHex(colors[color]);
			render();
		}
	}
	wheelBackMenu.onclick = event => {
		const color = event.target.closest('[data-color]')?.dataset.color;
		if (color) {
			wheelBack.material.color.setHex(colors[color]);
			render();
		}
	}

	document.body.addEventListener('pointerdown', event => {
		const menu = event.target.closest('.menu');
		const label = event.target.closest('label');
		if (menu && label) {
			menu.classList.toggle('open');
		}
	});

	render();
});

function handleWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	webglRenderer.setSize(window.innerWidth, window.innerHeight);
	composer.setSize(window.innerWidth/2, window.innerHeight/2);
	render();
}
handleWindowResize();
window.addEventListener('resize', handleWindowResize);
