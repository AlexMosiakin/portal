import './style.css'
import * as dat from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

import fireFliesVertexShader from './shaders/fireFlies/vertex.glsl'
import fireFliesFragmentShader from './shaders/fireFlies/fragment.glsl'

import portalVertexShader from './shaders/portal/vertex.glsl'
import portalFragmentShader from './shaders/portal/fragment.glsl'

/**
 * Base
 */
// Debug
const gui = new dat.GUI({
    width: 400
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

const clearColor = '#201919'

/**
 * Textures
 */
//Baked
const bakedTexture = textureLoader.load('./baked.png')
bakedTexture.flipY = false
bakedTexture.encoding = THREE.sRGBEncoding

/**
 * Materials
 */

//Baked
const bakedMaterial = new THREE.MeshBasicMaterial({map: bakedTexture})

// Pole light 
const poleLightMaterial = new THREE.MeshBasicMaterial({color: 0xFF9365})

//Portal light
const portalLightMaterial = new THREE.ShaderMaterial({
    vertexShader: portalVertexShader,
    fragmentShader: portalFragmentShader,
    uniforms: {
        uTime: {value: 0},
        uColorStart: {value: new THREE.Color(0xffffff)},
        uColorEnd: {value: new THREE.Color(0x3C8DFF)},
    }
})

/**
 * Model
 */

gltfLoader.load('./portal.glb', (gltf) => {
    gltf.scene.traverse((child) => {
        child.material = bakedMaterial
    })

    const poleLightAMesh = gltf.scene.children.find(child => child.name === 'poleLightA')
    const poleLightBMesh = gltf.scene.children.find(child => child.name === 'poleLightB')
    const poleLightCMesh = gltf.scene.children.find(child => child.name === 'poleLightC')
    const poleLightDMesh = gltf.scene.children.find(child => child.name === 'poleLightD')

    const portalLightMesh = gltf.scene.children.find(child => child.name === 'portalLight')

    poleLightAMesh.material = poleLightMaterial
    poleLightBMesh.material = poleLightMaterial
    poleLightCMesh.material = poleLightMaterial
    poleLightDMesh.material = poleLightMaterial

    portalLightMesh.material = portalLightMaterial

    scene.add(gltf.scene)
})

/**
 * Fireflies
 */

const fireFliesGeometry = new THREE.BufferGeometry()
const fireFliesCount = 60
const positionArray = new Float32Array(fireFliesCount * 3)
const scaleArray = new Float32Array(fireFliesCount)

for (let i = 0; i < fireFliesCount; i++) {
    positionArray[i * 3 + 0] = (Math.random() - 0.5) * 4
    positionArray[i * 3 + 1] = (Math.random() * 1.5)
    positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4

    scaleArray[i] = Math.random()
}

fireFliesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3))
fireFliesGeometry.setAttribute('aScale', new THREE.BufferAttribute(scaleArray, 1))

//Material
const fireFliesMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uPixelRatio: {value: Math.min(window.devicePixelRatio, 2)},
        uSize: {value: 100},
        uTime: {value: 0},
    },
    vertexShader: fireFliesVertexShader,
    fragmentShader: fireFliesFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
})

//Points
const fireFlies = new THREE.Points(fireFliesGeometry, fireFliesMaterial)
scene.add(fireFlies)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    fireFliesMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0
camera.position.y = 0.75
camera.position.z = 3.2

scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

// controls.maxPolarAngle = 1.3
// controls.maxAzimuthAngle = 0
// controls.minDistance = 0.5
// controls.maxDistance = 3.5
// controls.enablePan = false

controls.target.y = 0.75


document.addEventListener('mouseup', () => {
    console.log(controls)
    console.log(camera)
})
/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding
renderer.setClearColor(clearColor)
/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)

    fireFliesMaterial.uniforms.uTime.value = elapsedTime
    portalLightMaterial.uniforms.uTime.value = elapsedTime
}

tick()