import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { buildOtherRooms } from './rooms.js'

const ROOM = 8
const HALF = ROOM / 2
const WALL_H = 4
const CURTAIN_H = 3.4
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function rng(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const easeInOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)
const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3)
const easeOutBack = (p) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2)
}

function mat(color, roughness = 0.9, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, ...extra })
}

function shadowed(mesh, cast = true) {
  mesh.castShadow = cast
  mesh.receiveShadow = true
  return mesh
}

function box(w, h, d, m, cast = true) {
  return shadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m), cast)
}

function rbox(w, h, d, m, r = 0.06, seg = 4) {
  const radius = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)
  return shadowed(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, seg, radius), m))
}

function cyl(rt, rb, h, m, seg = 24, cast = true) {
  return shadowed(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m), cast)
}

function at(obj, x, y, z) {
  obj.position.set(x, y, z)
  return obj
}

function tag(obj, part) {
  obj.traverse((o) => {
    if (o.isMesh) o.userData.part = part
  })
  return obj
}

function canvasTexture(w, h, draw) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  draw(canvas.getContext('2d'), w, h)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

function glowTexture() {
  return canvasTexture(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
    g.addColorStop(0, 'rgba(255,224,170,1)')
    g.addColorStop(0.35, 'rgba(255,200,130,0.35)')
    g.addColorStop(1, 'rgba(255,190,110,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  })
}

/* ------------------------------------------------------------------ */
/* procedural textures                                                 */
/* ------------------------------------------------------------------ */

function floorTexture() {
  const tex = canvasTexture(1024, 1024, (ctx, w, h) => {
    const rnd = rng(11)
    const rows = 22
    const ph = h / rows
    for (let r = 0; r < rows; r++) {
      let x = -rnd() * w * 0.35
      while (x < w) {
        const len = w * (0.3 + rnd() * 0.3)
        const l = 228 + Math.floor(rnd() * 26)
        ctx.fillStyle = `rgb(${l},${l - 3},${l - 6})`
        ctx.fillRect(x, r * ph, len, ph)
        ctx.strokeStyle = 'rgba(70,45,25,0.07)'
        ctx.lineWidth = 1
        for (let i = 0; i < 6; i++) {
          const y = r * ph + rnd() * ph
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.bezierCurveTo(x + len * 0.3, y + (rnd() - 0.5) * 5, x + len * 0.6, y + (rnd() - 0.5) * 5, x + len, y)
          ctx.stroke()
        }
        ctx.strokeStyle = 'rgba(40,25,15,0.28)'
        ctx.lineWidth = 2
        ctx.strokeRect(x, r * ph, len, ph)
        x += len
      }
    }
  })
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

function rugTexture() {
  return canvasTexture(512, 362, (ctx, w, h) => {
    const rnd = rng(5)
    ctx.fillStyle = 'rgb(246,244,240)'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgb(176,172,166)'
    ctx.lineWidth = 6
    ctx.strokeRect(16, 16, w - 32, h - 32)
    ctx.lineWidth = 2
    ctx.strokeRect(34, 34, w - 68, h - 68)
    ctx.strokeStyle = 'rgb(214,210,204)'
    const s = 44
    for (let y = 56; y < h - 56 - s; y += s) {
      for (let x = 56; x < w - 56 - s; x += s) {
        ctx.beginPath()
        ctx.moveTo(x + s / 2, y)
        ctx.lineTo(x + s, y + s / 2)
        ctx.lineTo(x + s / 2, y + s)
        ctx.lineTo(x, y + s / 2)
        ctx.closePath()
        ctx.stroke()
      }
    }
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = `rgba(0,0,0,${rnd() * 0.05})`
      ctx.fillRect(rnd() * w, rnd() * h, 2, 2)
    }
  })
}

function artTexture(kind) {
  return canvasTexture(256, 320, (ctx, w, h) => {
    if (kind === 'arch') {
      ctx.fillStyle = '#efe6d6'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#c0785a'
      ctx.beginPath()
      ctx.moveTo(50, 270)
      ctx.lineTo(50, 140)
      ctx.arc(128, 140, 78, Math.PI, 0)
      ctx.lineTo(206, 270)
      ctx.fill()
      ctx.fillStyle = '#7d8b76'
      ctx.beginPath()
      ctx.arc(128, 160, 36, 0, Math.PI * 2)
      ctx.fill()
    } else if (kind === 'sun') {
      ctx.fillStyle = '#9fb0a0'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#f3e9d8'
      ctx.beginPath()
      ctx.arc(128, 130, 64, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#c9a45c'
      ctx.beginPath()
      ctx.arc(128, 250, 90, Math.PI, 0)
      ctx.fill()
    } else {
      ctx.fillStyle = '#d9a68c'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#f6ece0'
      ctx.lineWidth = 7
      for (let i = 0; i < 7; i++) {
        ctx.beginPath()
        for (let x = 0; x <= w; x += 8) {
          const y = 40 + i * 38 + Math.sin(x * 0.04 + i) * 14
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
    }
  })
}

/* ------------------------------------------------------------------ */
/* plants                                                              */
/* ------------------------------------------------------------------ */

const leafMats = [mat('#5f7662', 0.8), mat('#4f6a54', 0.8), mat('#6f8c6a', 0.8)]
const potMat = mat('#b5654a', 0.8)
const soilMat = mat('#3a2b22', 1)

function makePlant({ potR = 0.34, potH = 0.7, leaves = 12, minH = 0.6, maxH = 1.4, seed = 1 }) {
  const rnd = rng(seed)
  const group = new THREE.Group()
  const pot = cyl(potR, potR * 0.78, potH, potMat, 28)
  pot.position.y = potH / 2
  const soil = cyl(potR * 0.92, potR * 0.92, 0.04, soilMat, 24, false)
  soil.position.y = potH
  group.add(pot, soil)

  const swayers = []
  for (let i = 0; i < leaves; i++) {
    const pivot = new THREE.Group()
    pivot.position.y = potH
    pivot.rotation.y = (i / leaves) * Math.PI * 2 + rnd() * 0.6
    const tilt = new THREE.Group()
    const baseTilt = 0.15 + rnd() * 0.6
    tilt.rotation.x = baseTilt
    const h = minH + rnd() * (maxH - minH)
    const stalk = cyl(0.012, 0.018, h, leafMats[1], 6, false)
    stalk.position.y = h / 2
    const tip = new THREE.Group()
    tip.position.y = h
    tip.rotation.x = 0.5 + rnd() * 0.5
    const leaf = shadowed(new THREE.Mesh(new THREE.SphereGeometry(1, 14, 8), leafMats[i % 3]))
    leaf.scale.set(0.2 + rnd() * 0.08, 0.04, 0.4 + rnd() * 0.15)
    leaf.position.z = 0.3
    tip.add(leaf)
    tilt.add(stalk, tip)
    pivot.add(tilt)
    group.add(pivot)
    swayers.push({ tilt, baseTilt, phase: rnd() * Math.PI * 2, amp: 0.025 + rnd() * 0.03 })
  }
  return { group, swayers }
}

/* ------------------------------------------------------------------ */
/* room                                                                */
/* ------------------------------------------------------------------ */

// shared by the sun and the visible light shaft so they always agree
const SUN_DIR = new THREE.Vector3(8, -5, -1.5)

function buildRoom(scene) {
  const parts = {
    wall: mat('#efe8dc'),
        floor: pmat('#c8a98a', 0.6, { map: floorTexture(), clearcoat: 0.25, clearcoatRoughness: 0.45 }),
        sofa: pmat('#8a6f5a', 0.9, { sheen: 1, sheenRoughness: 0.55, sheenColor: new THREE.Color('#ffffff') }),
        wood: pmat('#6b4f3a', 0.55, { clearcoat: 0.4, clearcoatRoughness: 0.3 }),
    rug: mat('#d9cbb5', 1, { map: rugTexture() }),
        curtain: pmat('#ece4d6', 0.95, { side: THREE.DoubleSide, sheen: 1, sheenRoughness: 0.4, sheenColor: new THREE.Color('#ffffff') }),
    slab: mat('#dcd6cc', 0.35),
  }
  const trimMat = mat('#f7f2ea', 0.6)
  const brass = new THREE.MeshStandardMaterial({ color: '#c9a45c', metalness: 0.9, roughness: 0.28 })
  const ceramicMat = pmat('#efe6d6', 0.35, { clearcoat: 0.6, clearcoatRoughness: 0.2 })

  const entries = []
  const addEntry = (obj, opts = {}) => {
    entries.push({ obj, baseY: obj.position.y, parts: [], delay: 0, kind: 'drop', room: '*', ...opts })
    scene.add(obj)
    return obj
  }

  const anim = { swayers: [], curtains: [], steam: [], clockHands: null, lamps: [], toggles: [], pickables: [] }

  /* --- platform ----------------------------------------------------- */
  const base = new THREE.Group()
  const plinth = box(ROOM + 0.5, 0.3, ROOM + 0.5, mat('#e2d8c8', 0.9), false)
  plinth.position.set(0.25, -0.35, 0.25)
  const floor = box(ROOM, 0.2, ROOM, parts.floor, false)
  floor.position.y = -0.1
  tag(floor, 'floor')
  base.add(plinth, floor)
  addEntry(base, { kind: 'grow', delay: 0, dur: 0.9 })

  /* --- walls with a window cut-out ---------------------------------- */
  const shell = new THREE.Group()
  const back = box(ROOM, WALL_H, 0.2, parts.wall)
  back.position.set(0, WALL_H / 2, -HALF)
  const winY0 = 0.95
  const winY1 = 3.15
  const winZ0 = -1.8
  const winZ1 = 0.6
  const lowWall = at(box(0.2, winY0, ROOM, parts.wall), -HALF, winY0 / 2, 0)
  const highWall = at(box(0.2, WALL_H - winY1, ROOM, parts.wall), -HALF, winY1 + (WALL_H - winY1) / 2, 0)
  const sideA = at(box(0.2, winY1 - winY0, winZ0 + HALF, parts.wall), -HALF, (winY0 + winY1) / 2, (-HALF + winZ0) / 2)
  const sideB = at(box(0.2, winY1 - winY0, HALF - winZ1, parts.wall), -HALF, (winY0 + winY1) / 2, (HALF + winZ1) / 2)
  shell.add(back, lowWall, highWall, sideA, sideB)
  tag(shell, 'wall')

  const trim = new THREE.Group()
  const winZc = (winZ0 + winZ1) / 2
  trim.add(
    at(box(7.8, 0.16, 0.05, trimMat, false), 0.1, 0.08, -HALF + 0.125),
    at(box(0.05, 0.16, 7.8, trimMat, false), -HALF + 0.125, 0.08, 0.1),
    at(box(0.1, 0.07, 2.6, trimMat, false), -3.88, winY1 + 0.03, winZc),
    at(box(0.28, 0.07, 2.7, trimMat, false), -3.8, winY0 - 0.02, winZc),
    at(box(0.1, winY1 - winY0, 0.08, trimMat, false), -3.88, (winY0 + winY1) / 2, winZ0 - 0.02),
    at(box(0.1, winY1 - winY0, 0.08, trimMat, false), -3.88, (winY0 + winY1) / 2, winZ1 + 0.02),
    at(box(0.06, winY1 - winY0, 0.05, trimMat, false), -3.97, (winY0 + winY1) / 2, winZc),
    at(box(0.06, 0.05, winZ1 - winZ0, trimMat, false), -3.97, (winY0 + winY1) / 2, winZc),
  )
  shell.add(trim)
  addEntry(shell, { kind: 'rise', delay: 0.35, dur: 1.0 })

  /* --- the view outside --------------------------------------------- */
  const outside = new THREE.Group()
  const skyMat = new THREE.MeshBasicMaterial({ color: '#bfe0f5', toneMapped: false })
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.8), skyMat)
  sky.rotation.y = Math.PI / 2
  sky.position.set(-4.85, 1.8, winZc)
  outside.add(sky)
  const hill = new THREE.Mesh(new THREE.SphereGeometry(1.6, 24, 12), mat('#7b9a74', 1))
  hill.scale.set(0.22, 0.45, 1.5)
  hill.position.set(-4.6, 0.2, -0.4)
  outside.add(hill)
  for (const [x, y, z, r, c] of [
    [-4.5, 1.05, -1.5, 0.5, '#5f7f5c'],
    [-4.55, 1.45, 0.2, 0.6, '#6f8f68'],
    [-4.45, 0.95, -0.5, 0.4, '#58765a'],
  ]) {
    outside.add(at(new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat(c, 1)), x, y, z))
  }
  scene.add(outside)

  /* --- light shaft from the window ---------------------------------- */
  const startPts = [
    [-3.95, winY0, winZ0],
    [-3.95, winY0, winZ1],
    [-3.95, winY1, winZ1],
    [-3.95, winY1, winZ0],
  ].map((p) => new THREE.Vector3(...p))
  const endPts = startPts.map((p) => p.clone().addScaledVector(SUN_DIR, p.y / -SUN_DIR.y).setY(0.02))
  const beamPos = []
  const beamCol = []
  for (const [a, b] of [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
  ]) {
    const verts = [startPts[a], startPts[b], endPts[b], endPts[a]]
    const alphas = [0.5, 0.5, 0, 0]
    for (const i of [0, 1, 2, 0, 2, 3]) {
      beamPos.push(verts[i].x, verts[i].y, verts[i].z)
      beamCol.push(1, 0.93, 0.78, alphas[i])
    }
  }
  const beamGeo = new THREE.BufferGeometry()
  beamGeo.setAttribute('position', new THREE.Float32BufferAttribute(beamPos, 3))
  beamGeo.setAttribute('color', new THREE.Float32BufferAttribute(beamCol, 4))
  const beamMat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  })
  scene.add(new THREE.Mesh(beamGeo, beamMat))

  /* --- curtains ------------------------------------------------------ */
  const curtains = new THREE.Group()
  const rod = cyl(0.025, 0.025, 4.1, brass, 12, false)
  rod.rotation.x = Math.PI / 2
  rod.position.set(-3.72, 3.5, -0.4)
  curtains.add(rod)
  for (const z of [-2.45, 1.65]) {
    curtains.add(at(shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), brass), false), -3.72, 3.5, z))
  }
  for (const zc of [-2.1, 1.05]) {
    const geo = new THREE.PlaneGeometry(0.9, CURTAIN_H, 30, 8)
    const p = geo.attributes.position
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 14) * 0.045)
    geo.computeVertexNormals()
    const mesh = shadowed(new THREE.Mesh(geo, parts.curtain))
    mesh.rotation.y = Math.PI / 2
    mesh.position.set(-3.76, 3.4 - CURTAIN_H / 2, zc)
    curtains.add(mesh)
    anim.curtains.push({ geo, base: Float32Array.from(p.array), mesh, zOpen: zc })
  }
  tag(curtains, 'curtain')
  addEntry(curtains, { item: 'curtains', label: 'Curtains', parts: ['curtain'], delay: 1.0, drop: 0.8 })

  /* --- rug ----------------------------------------------------------- */
  const rug = at(box(3.6, 0.03, 2.55, parts.rug, false), 0, 0.016, -0.45)
  tag(rug, 'rug')
  addEntry(rug, { room: 'living', item: 'rug', label: 'Rug', parts: ['rug'], kind: 'grow', delay: 0.9, dur: 0.9 })

  /* --- sofa ---------------------------------------------------------- */
  const sofa = new THREE.Group()
  for (const [x, z] of [
    [-1.2, -0.38],
    [1.2, -0.38],
    [-1.2, 0.4],
    [1.2, 0.4],
  ]) {
    sofa.add(tag(at(cyl(0.035, 0.025, 0.14, parts.wood, 10), x, 0.07, z), 'wood'))
  }
  sofa.add(at(rbox(2.7, 0.28, 1.05, parts.sofa, 0.05), 0, 0.3, 0))
  sofa.add(at(rbox(2.7, 0.88, 0.3, parts.sofa, 0.1), 0, 0.76, -0.42))
  for (const s of [-1, 1]) {
    sofa.add(at(rbox(0.3, 0.64, 1.05, parts.sofa, 0.1), s * 1.2, 0.58, 0))
    sofa.add(at(rbox(1.18, 0.2, 0.82, parts.sofa, 0.09), s * 0.6, 0.55, 0.07))
    const backC = at(rbox(1.15, 0.58, 0.24, parts.sofa, 0.1), s * 0.6, 0.9, -0.28)
    backC.rotation.x = -0.14
    sofa.add(backC)
  }
  const pillowA = at(rbox(0.46, 0.46, 0.15, mat('#c0785a', 0.9), 0.07), -0.88, 0.92, -0.08)
  pillowA.rotation.set(-0.2, 0.35, 0.1)
  const pillowB = at(rbox(0.42, 0.42, 0.14, mat('#e6dccb', 0.9), 0.07), 0.9, 0.9, -0.08)
  pillowB.rotation.set(-0.2, -0.3, -0.12)
  const throwBlanket = at(rbox(0.5, 0.05, 0.95, mat('#cfc3ae', 1), 0.02), 1.2, 0.93, 0.06)
  throwBlanket.rotation.z = 0.05
  sofa.add(pillowA, pillowB, throwBlanket)
  sofa.traverse((o) => {
    if (o.isMesh && !o.userData.part) o.userData.part = 'sofa'
  })
  sofa.position.set(0, 0, -3.1)
  addEntry(sofa, { room: 'living', item: 'sofa', label: 'Sofa', parts: ['sofa'], delay: 1.15, drop: 2.2 })

  /* --- armchair + pouf ----------------------------------------------- */
  const chair = new THREE.Group()
  for (const [x, z] of [
    [-0.4, -0.35],
    [0.4, -0.35],
    [-0.4, 0.35],
    [0.4, 0.35],
  ]) {
    chair.add(tag(at(cyl(0.03, 0.022, 0.2, parts.wood, 10), x, 0.1, z), 'wood'))
  }
  chair.add(at(rbox(0.96, 0.24, 0.86, parts.sofa, 0.06), 0, 0.32, 0))
  chair.add(at(rbox(0.96, 0.72, 0.22, parts.sofa, 0.1), 0, 0.72, -0.34))
  chair.add(at(rbox(0.8, 0.18, 0.66, parts.sofa, 0.08), 0, 0.5, 0.06))
  for (const s of [-1, 1]) chair.add(at(rbox(0.16, 0.42, 0.78, parts.sofa, 0.07), s * 0.46, 0.55, 0.02))
  chair.traverse((o) => {
    if (o.isMesh && !o.userData.part) o.userData.part = 'sofa'
  })
  chair.position.set(2.65, 0, 0.45)
  chair.rotation.y = -1.86
  addEntry(chair, { room: 'living', item: 'chair', label: 'Armchair', parts: ['sofa'], delay: 1.5, drop: 2.2 })

  const pouf = new THREE.Group()
  pouf.add(at(rbox(0.62, 0.4, 0.62, parts.sofa, 0.18, 6), 0, 0.2, 0))
  tag(pouf, 'sofa')
  pouf.position.set(-2.2, 0, 0.5)
  pouf.rotation.y = 0.5
  addEntry(pouf, { room: 'living', item: 'pouf', label: 'Pouf', parts: ['sofa'], delay: 1.75, drop: 2 })

  /* --- coffee table + accessories ------------------------------------ */
  const table = new THREE.Group()
  table.add(at(box(1.4, 0.06, 0.8, parts.wood), 0, 0.42, 0))
  table.add(at(box(1.2, 0.04, 0.6, parts.wood), 0, 0.14, 0))
  for (const [x, z] of [
    [-0.62, -0.32],
    [0.62, -0.32],
    [-0.62, 0.32],
    [0.62, 0.32],
  ]) {
    table.add(at(box(0.07, 0.4, 0.07, parts.wood), x, 0.2, z))
  }
  tag(table, 'wood')

  const decor = new THREE.Group()
  const book1 = at(rbox(0.38, 0.05, 0.28, mat('#4f5f4b', 0.8), 0.01, 2), -0.4, 0.475, 0.05)
  book1.rotation.y = 0.15
  const book2 = at(rbox(0.32, 0.04, 0.24, mat('#d8cbb8', 0.8), 0.01, 2), -0.39, 0.52, 0.04)
  book2.rotation.y = -0.1
  const vase = new THREE.Group()
  vase.add(at(cyl(0.08, 0.1, 0.22, ceramicMat, 20), 0, 0.11, 0))
  vase.add(at(cyl(0.04, 0.07, 0.1, ceramicMat, 20), 0, 0.27, 0))
  for (let i = 0; i < 5; i++) {
    const sx = Math.sin(i * 1.3)
    const cz = Math.cos(i * 1.3)
    const stem = cyl(0.006, 0.006, 0.5, leafMats[1], 5, false)
    stem.position.set(sx * 0.07, 0.55, cz * 0.07)
    stem.rotation.set(cz * 0.3, 0, -sx * 0.3)
    const bloom = shadowed(new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), mat(i % 2 ? '#e8c6a6' : '#f3e9d8', 0.8)), false)
    bloom.position.set(sx * 0.16, 0.8, cz * 0.16)
    vase.add(stem, bloom)
  }
  vase.position.set(0.42, 0.45, -0.1)
  const mug = at(cyl(0.05, 0.045, 0.1, mat('#d9a68c', 0.5), 18), -0.05, 0.5, 0.22)
  const steam = []
  for (let i = 0; i < 4; i++) {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 8, 8),
      new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }),
    )
    steam.push({ mesh: puff, phase: i / 4, x: mug.position.x, y: mug.position.y + 0.07, z: mug.position.z })
  }
  anim.steam = steam
  decor.add(book1, book2, vase, mug, ...steam.map((s) => s.mesh))
  const tableGroup = new THREE.Group()
  tableGroup.add(table, decor)
  tableGroup.position.set(0, 0, -0.75)
  addEntry(tableGroup, { room: 'living', item: 'tableGroup', label: 'Coffee table', parts: ['wood'], delay: 1.35, drop: 2.2 })

  /* --- bookshelf ----------------------------------------------------- */
  const shelf = new THREE.Group()
  const shelfFrame = new THREE.Group()
  for (const s of [-1, 1]) shelfFrame.add(at(box(0.05, 2.85, 0.4, parts.wood), s * 0.675, 1.425, 0))
  for (const y of [0.1, 0.65, 1.2, 1.75, 2.3, 2.85]) shelfFrame.add(at(box(1.4, 0.05, 0.4, parts.wood), 0, y, 0))
  shelfFrame.add(at(box(1.3, 2.85, 0.02, parts.wood, false), 0, 1.425, -0.19))
  tag(shelfFrame, 'wood')
  shelf.add(shelfFrame)

  const brng = rng(21)
  const bookColors = ['#b5654a', '#7d8b76', '#d8cbb8', '#3b4a5c', '#c9a45c', '#8a4330', '#e8dfd2', '#4f5f4b'].map((c) => new THREE.Color(c))
  const bookList = []
  for (const lv of [
    { y: 0.125, from: -0.58, to: 0.58 },
    { y: 0.675, from: -0.58, to: 0.12 },
    { y: 1.225, from: -0.58, to: 0.58 },
    { y: 1.775, from: -0.58, to: -0.05 },
    { y: 2.325, from: -0.58, to: 0.1 },
  ]) {
    let x = lv.from
    while (x < lv.to - 0.06) {
      const w = 0.045 + brng() * 0.06
      const h = 0.28 + brng() * 0.18
      bookList.push({ x: x + w / 2, y: lv.y + h / 2, w, h, d: 0.24 + brng() * 0.08, c: bookColors[Math.floor(brng() * bookColors.length)] })
      x += w + 0.004
    }
  }
  const bookMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat('#ffffff', 0.85), bookList.length)
  const m4 = new THREE.Matrix4()
  bookList.forEach((b, i) => {
    m4.compose(new THREE.Vector3(b.x, b.y, 0.02), new THREE.Quaternion(), new THREE.Vector3(b.w, b.h, b.d))
    bookMesh.setMatrixAt(i, m4)
    bookMesh.setColorAt(i, b.c)
  })
  bookMesh.castShadow = true
  bookMesh.receiveShadow = true
  shelf.add(bookMesh)

  const shelfVase = at(cyl(0.07, 0.09, 0.3, ceramicMat, 20), 0.38, 0.675 + 0.15, 0.02)
  const shelfBasket = at(box(0.5, 0.3, 0.3, mat('#b89a6a', 1)), 0.3, 0.125 + 0.15, 0.02)
  const shelfPlant = makePlant({ potR: 0.1, potH: 0.2, leaves: 6, minH: 0.12, maxH: 0.26, seed: 9 })
  shelfPlant.group.position.set(0.38, 2.325, 0.02)
  const topPlant = makePlant({ potR: 0.12, potH: 0.22, leaves: 8, minH: 0.15, maxH: 0.34, seed: 17 })
  topPlant.group.position.set(-0.3, 2.875, 0.02)
  shelfPlant.group.scale.setScalar(0.5)
  topPlant.group.scale.setScalar(0.55)
  anim.swayers.push(...shelfPlant.swayers, ...topPlant.swayers)
  shelf.add(shelfVase, shelfBasket, shelfPlant.group, topPlant.group)
  shelf.position.set(3.1, 0, -3.68)
  addEntry(shelf, { room: 'living', item: 'shelf', label: 'Bookshelf', parts: ['wood'], delay: 1.55, drop: 2.6 })

  /* --- side table + table lamp --------------------------------------- */
  const side = new THREE.Group()
  side.add(at(cyl(0.32, 0.32, 0.05, parts.wood, 28), 0, 0.55, 0))
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2
    const leg = cyl(0.022, 0.016, 0.55, parts.wood, 8)
    leg.position.set(Math.cos(a) * 0.2, 0.275, Math.sin(a) * 0.2)
    leg.rotation.set(Math.sin(a) * 0.1, 0, -Math.cos(a) * 0.1)
    side.add(leg)
  }
  tag(side, 'wood')
  const tShadeMat = new THREE.MeshStandardMaterial({ color: '#f6e5c8', emissive: '#ffd9a0', emissiveIntensity: 0.5, side: THREE.DoubleSide, roughness: 0.9 })
  const tLamp = new THREE.Group()
  tLamp.add(at(cyl(0.07, 0.09, 0.05, brass, 16), 0, 0.025, 0))
  tLamp.add(at(cyl(0.015, 0.015, 0.22, brass, 8, false), 0, 0.16, 0))
  tLamp.add(at(shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 0.26, 28, 1, true), tShadeMat), false), 0, 0.36, 0))
  tLamp.position.set(0, 0.575, 0)
  tag(tLamp, 'lamp')
  side.add(tLamp)
  const tLight = new THREE.PointLight('#ffd7a1', 3, 4.5, 1.6)
  tLight.position.set(0, 0.95, 0.02)
  side.add(tLight)
  const tHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.3 }))
  tHalo.scale.set(1.2, 1.2, 1)
  tHalo.position.set(0, 0.95, 0.02)
  side.add(tHalo)
  side.position.set(-2.0, 0, -3.1)
  addEntry(side, { room: 'living', item: 'side', label: 'Side table & lamp', parts: ['wood'], delay: 1.8, drop: 2 })
  anim.lamps.push({ light: tLight, base: 3, shadeMat: tShadeMat, halo: tHalo })

  /* --- floor lamp ---------------------------------------------------- */
  const fLamp = new THREE.Group()
  fLamp.add(at(cyl(0.2, 0.22, 0.04, brass, 24), 0, 0.02, 0))
  fLamp.add(at(cyl(0.025, 0.025, 1.7, brass, 12), 0, 0.88, 0))
  const fShadeMat = new THREE.MeshStandardMaterial({ color: '#f6e5c8', emissive: '#ffd9a0', emissiveIntensity: 0.6, side: THREE.DoubleSide, roughness: 0.9 })
  fLamp.add(at(shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 0.45, 32, 1, true), fShadeMat), false), 0, 1.8, 0))
  tag(fLamp, 'lamp')
  const fLight = new THREE.PointLight('#ffd7a1', 6, 6, 1.6)
  fLight.position.set(0, 1.6, 0)
  fLamp.add(fLight)
  const fHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.3 }))
  fHalo.scale.set(2.2, 2.2, 1)
  fHalo.position.set(0, 1.75, 0)
  fLamp.add(fHalo)
  fLamp.position.set(2.0, 0, -3.05)
  addEntry(fLamp, { room: 'living', item: 'fLamp', label: 'Floor lamp', delay: 1.9, drop: 2.4 })
  anim.lamps.push({ light: fLight, base: 6, shadeMat: fShadeMat, halo: fHalo })

  /* --- plants -------------------------------------------------------- */
  const bigPlant = makePlant({ potR: 0.36, potH: 0.7, leaves: 15, minH: 0.7, maxH: 1.5, seed: 3 })
  bigPlant.group.position.set(-3.0, 0, -3.2)
  const midPlant = makePlant({ potR: 0.24, potH: 0.45, leaves: 9, minH: 0.35, maxH: 0.8, seed: 8 })
  midPlant.group.position.set(-3.3, 0, 2.1)
  anim.swayers.push(...bigPlant.swayers, ...midPlant.swayers)
  addEntry(bigPlant.group, { room: 'living', item: 'bigPlant', label: 'Large plant', delay: 1.7, drop: 2.4 })
  addEntry(midPlant.group, { room: 'living', item: 'midPlant', label: 'Small plant', delay: 2.0, drop: 2.2 })

  /* --- wall art + clock ---------------------------------------------- */
  const gallery = new THREE.Group()
  for (const f of [
    { x: -1.0, w: 0.75, h: 1.0, kind: 'sun' },
    { x: 0, w: 0.95, h: 1.3, kind: 'arch' },
    { x: 1.0, w: 0.75, h: 1.0, kind: 'lines' },
  ]) {
    const fr = new THREE.Group()
    fr.add(tag(box(f.w, f.h, 0.05, parts.wood), 'wood'))
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(f.w - 0.12, f.h - 0.12), new THREE.MeshStandardMaterial({ map: artTexture(f.kind), roughness: 0.8 }))
    pic.position.z = 0.03
    pic.receiveShadow = true
    fr.add(pic)
    fr.position.set(f.x, 2.45, -HALF + 0.125)
    gallery.add(fr)
  }
  addEntry(gallery, { room: 'living', item: 'gallery', label: 'Wall art', delay: 2.05, drop: 1.2 })

  const clock = new THREE.Group()
  const clockFace = cyl(0.3, 0.3, 0.05, mat('#f7f2ea', 0.6), 40)
  clockFace.rotation.x = Math.PI / 2
  const clockRim = cyl(0.32, 0.32, 0.04, brass, 40, false)
  clockRim.rotation.x = Math.PI / 2
  clockRim.position.z = -0.01
  clock.add(clockRim, clockFace)
  for (let i = 0; i < 12; i++) {
    const tick = box(0.015, i % 3 === 0 ? 0.06 : 0.035, 0.01, mat('#3b3733', 0.5), false)
    const a = (i / 12) * Math.PI * 2
    tick.position.set(Math.sin(a) * 0.24, Math.cos(a) * 0.24, 0.03)
    tick.rotation.z = -a
    clock.add(tick)
  }
  const mkHand = (len, w, color) => {
    const pivot = new THREE.Group()
    pivot.add(at(box(w, len, 0.008, mat(color, 0.5), false), 0, len / 2 - 0.02, 0))
    pivot.position.z = 0.04
    clock.add(pivot)
    return pivot
  }
  anim.clockHands = { hour: mkHand(0.14, 0.02, '#2a2622'), min: mkHand(0.21, 0.014, '#2a2622'), sec: mkHand(0.23, 0.006, '#b5654a') }
  clock.position.set(-2.4, 3.15, -HALF + 0.12)
  addEntry(clock, { room: 'living', item: 'clock', label: 'Wall clock', delay: 2.2, drop: 1 })

  buildOtherRooms({ box, rbox, cyl, at, tag, mat, parts, brass, addEntry, anim, makePlant, glowTexture, artTexture, canvasTexture })

  scene.traverse((o) => {
    if (o.isMesh && o.userData.part) anim.pickables.push(o)
  })

  return { parts, entries, anim, skyMat, beamMat }
}

/* ------------------------------------------------------------------ */
/* lighting moods                                                      */
/* ------------------------------------------------------------------ */

const MOODS = {
  day: { bg: '#f4efe7', sky: '#bfe0f5', hemiSky: '#fff6ea', hemiGround: '#8a7460', sun: '#fff4e0', hemi: 0.7, sunI: 1.9, fill: 0.6, exposure: 1.0, lamp: 0.7, beam: 0.55, dust: 0.65, env: 0.6, bloom: 0.1, bgGain: 1.55 },
  golden: { bg: '#f1dcc4', sky: '#ffb98a', hemiSky: '#ffd9b0', hemiGround: '#7a5a48', sun: '#ff9d54', hemi: 0.5, sunI: 2.4, fill: 0.35, exposure: 1.05, lamp: 1.3, beam: 0.85, dust: 0.9, env: 0.4, bloom: 0.3, bgGain: 1.4 },
  night: { bg: '#161b2b', sky: '#0f1730', hemiSky: '#6d7fb5', hemiGround: '#2a2530', sun: '#7d93d6', hemi: 0.25, sunI: 0.45, fill: 0.08, exposure: 1.0, lamp: 2.4, beam: 0, dust: 0.12, env: 0.14, bloom: 0.55, bgGain: 1 },
}
const COLOR_KEYS = ['bg', 'sky', 'hemiSky', 'hemiGround', 'sun']
const NUM_KEYS = ['env', 'bloom', 'bgGain', 'hemi', 'sunI', 'fill', 'exposure', 'lamp', 'beam', 'dust']

/* ------------------------------------------------------------------ */
/* camera views + labels                                               */
/* ------------------------------------------------------------------ */

const VIEWS = {
  overview: { pos: [7.5, 4.6, 8.5], target: [0, 1.2, -0.8], lift: 0.8 },
  sofa: { pos: [2.4, 2.0, 2.4], target: [0, 0.9, -3.0], lift: 0.5 },
  table: { pos: [2.8, 2.5, 3.2], target: [0, 0.4, -0.8], lift: 0.6 },
  nook: { pos: [6.0, 2.3, 3.2], target: [2.9, 1.1, -1.6], lift: 0.6 },
  window: { pos: [2.6, 2.4, 3.0], target: [-3.6, 1.7, -0.8], lift: 0.4 },
  floor: { pos: [3.6, 3.6, 5.2], target: [0, 0, -0.6], lift: 0.5 },
}
const PART_VIEW = { wall: 'overview', floor: 'floor', sofa: 'sofa', wood: 'table', rug: 'floor', curtain: 'window' }
const LABELS = { slab: 'Counter slab', wall: 'Walls', floor: 'Floor', sofa: 'Sofa & seating', wood: 'Wood details', rug: 'Rug', curtain: 'Curtains' }
const ANCHORS = {
  wall: [-1.5, 2.6, -3.7],
  floor: [0.8, 0.15, 1.3],
  sofa: [0, 1.1, -3.0],
  wood: [0, 0.7, -0.75],
  rug: [0, 0.15, -0.45],
  curtain: [-3.6, 2.5, -2.1],
}

function pmat(color, roughness = 0.9, extra = {}) {
  return new THREE.MeshPhysicalMaterial({ color, roughness, metalness: 0, ...extra })
}

const V = (sofa, table, nook) => ({ ...VIEWS, sofa, table, nook })
const ROOMS = {
  living: { label: 'Living room', views: VIEWS, names: { sofa: 'Sofa', table: 'Table', nook: 'Reading nook', window: 'Window', fabric: 'Sofa fabric', wood: 'Wood details' } },
  bedroom: {
    label: 'Bedroom',
    views: V({ pos: [2.6, 2.2, 1.0], target: [0.3, 0.8, -2.8], lift: 0.5 }, { pos: [-0.5, 1.9, 0.0], target: [-2.9, 0.8, -3.6], lift: 0.5 }, { pos: [5.5, 2.4, 0.0], target: [3.1, 1.2, -3.5], lift: 0.5 }),
    names: { sofa: 'Bed', table: 'Dresser', nook: 'Wardrobe', window: 'Window', fabric: 'Bed fabric', wood: 'Bed & wood' },
    closed: true,
  },
  kitchen: {
    label: 'Kitchen',
    views: V({ pos: [1.5, 2.0, 1.5], target: [-0.6, 1.0, -3.6], lift: 0.5 }, { pos: [3.8, 2.2, 2.6], target: [0.2, 0.8, -0.6], lift: 0.5 }, { pos: [6.2, 2.4, 0.8], target: [3.4, 1.2, -3.5], lift: 0.5 }),
    names: { sofa: 'Cabinets', table: 'Island', nook: 'Fridge', window: 'Window', fabric: 'Stool seats', wood: 'Cabinets', slab: true },
  },
}

ROOMS.office = {
  label: 'Office',
  views: V({ pos: [1.8, 1.7, -0.6], target: [0, 0.9, -3.4], lift: 0.5 }, { pos: [3.2, 2.2, 2.8], target: [-0.1, 0.8, 0.1], lift: 0.5 }, { pos: [0.6, 1.8, -0.2], target: [3.7, 1.1, -1.2], lift: 0.5 }),
  names: { sofa: 'Desk', table: 'Meeting table', nook: 'Bookshelf', window: 'Window', fabric: 'Chair fabric', wood: 'Desk & tables' },
}
ROOMS.dining = {
  label: 'Dining room',
  views: V({ pos: [3.4, 2.4, 2.6], target: [0.2, 0.7, -0.6], lift: 0.5 }, { pos: [2.2, 1.8, 0.0], target: [0.3, 0.9, -3.6], lift: 0.5 }, { pos: [5.5, 2.2, 2.8], target: [1.5, 0.6, -0.6], lift: 0.5 }),
  names: { sofa: 'Table', table: 'Sideboard', nook: 'Chairs', window: 'Window', fabric: 'Chair fabric', wood: 'Table & wood' },
}
const FIXED = new Set(['whiteboard', 'pinboard', 'switches', 'wallclock', 'wallmirror', 'ac', 'stove', 'cookware', 'exhaust', 'jars', 'dishrack', 'utensils', 'slab', 'lamps', 'lamp', 'floorlamp', 'mirror', 'wallpanel', 'wallmoulding', 'wallshelves', 'gallery', 'clock', 'art', 'upper', 'cabinets', 'sink', 'hob', 'pendants', 'pendant', 'washbasin', 'tiles', 'cove', 'fluted', 'arclamp', 'oven', 'airfryer', 'ro', 'bartanstand', 'mixer', 'kettle', 'toaster', 'board', 'spices', 'tv', 'photoframe'])
const lim = (v) => Math.max(-3.6, Math.min(3.6, v))

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

/* ------------------------------------------------------------------ */
/* viewer                                                              */
/* ------------------------------------------------------------------ */

export function createRoomViewer(container, options = {}) {
  if (!supportsWebGL()) {
    container.classList.remove('is-loading')
    container.classList.add('is-error')
    return null
  }

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  container.appendChild(renderer.domElement)
  const canvas = renderer.domElement

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(MOODS.day.bg)
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)
  camera.position.set(...(reduceMotion ? VIEWS.overview.pos : [14, 9, 15]))

  const controls = new OrbitControls(camera, canvas)
  controls.target.set(...VIEWS.overview.target)
  controls.enableDamping = true
  controls.dampingFactor = 0.06
  controls.enablePan = false
  controls.enableZoom = false // switched on after a click so page scrolling is never hijacked
  controls.minDistance = 3
  controls.maxDistance = 18
  controls.maxPolarAngle = Math.PI * 0.48
  controls.minAzimuthAngle = 0.1
  controls.maxAzimuthAngle = 1.45
  controls.autoRotate = !reduceMotion
  controls.autoRotateSpeed = 0.7

  const hemi = new THREE.HemisphereLight('#fff6ea', '#8a7460', 1.1)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight('#ffffff', 1.9)
  sun.position.set(-8, 5, 1)
  sun.target.position.set(0, 0, -0.5)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 0.5, far: 30 })
  sun.shadow.bias = -0.0004
  sun.shadow.normalBias = 0.02
  scene.add(sun, sun.target)
  const fill = new THREE.DirectionalLight('#fff3e6', 0.9)
  fill.position.set(6, 7, 9)
  scene.add(fill)

  const room = buildRoom(scene)
  const { parts, entries, anim } = room
  for (const en of entries) en.home = { x: en.obj.position.x, z: en.obj.position.z, r: en.obj.rotation.y, h: Boolean(en.hidden) }
  let editMode = false
  let sel = null
  let copyId = 0
  const selBox = new THREE.Box3Helper(new THREE.Box3(), 0xb5654a)
  selBox.visible = false
  scene.add(selBox)
  const notify = () => options.onEditSelect?.(sel ? sel.label : null)


  const envMats = new Set()
  scene.traverse((o) => {
    if (!o.isMesh) return
    for (const m of [].concat(o.material)) if ('envMapIntensity' in m) envMats.add(m)
  })

  /* post-processing: multisampled HDR target -> bloom -> tone mapping */
  const composerTarget = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 })
  const composer = new EffectComposer(renderer, composerTarget)
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.1, 0.55, 0.9)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())

  /* dust motes in the light */
  const DUST = 110
  const dustPos = new Float32Array(DUST * 3)
  const drng = rng(99)
  const dustSeed = Array.from({ length: DUST }, () => ({ x: -3.5 + drng() * 4.3, y: drng() * 3, z: -2.6 + drng() * 3.2, s: 0.2 + drng() * 0.5, p: drng() * 6.28 }))
  const dustGeo = new THREE.BufferGeometry()
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
  const dustMat = new THREE.PointsMaterial({ color: '#fff4dc', size: 0.045, transparent: true, opacity: 0.65, depthWrite: false, blending: THREE.AdditiveBlending })
  const dust = new THREE.Points(dustGeo, dustMat)
  dust.frustumCulled = false
  scene.add(dust)

  /* sparkle burst when a finish changes */
  const BURST = 40
  const burstPos = new Float32Array(BURST * 3)
  const burstVel = new Float32Array(BURST * 3)
  const burstGeo = new THREE.BufferGeometry()
  burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPos, 3))
  const burstMat = new THREE.PointsMaterial({ size: 0.12, transparent: true, opacity: 0, depthWrite: false })
  const burst = new THREE.Points(burstGeo, burstMat)
  burst.frustumCulled = false
  scene.add(burst)
  let burstLife = 0

  /* caption used by the guided tour */
  const caption = document.createElement('div')
  caption.className = 'room-caption'
  container.appendChild(caption)


  /* tooltip */
  const tip = document.createElement('div')
  tip.className = 'room-tip'
  tip.hidden = true
  container.appendChild(tip)

  /* state */
  const targets = new Map()
  const hover = {}
  const pulse = {}
  const pop = {}
  for (const [key, m] of Object.entries(parts)) {
    targets.set(key, m.color.clone())
    hover[key] = 0
    pulse[key] = 0
    pop[key] = { x: 0, v: 0 }
  }

  const cur = { ...MOODS.day }
  for (const k of COLOR_KEYS) cur[k] = new THREE.Color(MOODS.day[k])
  const moodTarget = {}
  for (const k of COLOR_KEYS) moodTarget[k] = new THREE.Color(MOODS.day[k])
  let moodNums = MOODS.day
  let moodName = 'day'
  const setMood = (name) => {
    const m = MOODS[name]
    if (!m) return
    moodName = name
    moodNums = m
    for (const k of COLOR_KEYS) moodTarget[k].set(m[k])
  }

  let curtainAmt = 0
  let curtainOverride = null
  let hoverToggle = null
  let hoverLamp = null
  let hoverPart = null
  let frame = 0
  const pointer = { x: 0, y: 0, cx: 0, cy: 0, inside: false, dragging: false, down: null }

  let views = VIEWS
  let roomName = 'living'

  /* camera tween */
  let clockTime = 0
  const tween = {
    active: false,
    t0: 0,
    dur: 1.6,
    lift: 0,
    fromPos: new THREE.Vector3(),
    toPos: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    toTarget: new THREE.Vector3(),
  }
  let resumeTimer = null
  const pauseAutoRotate = (ms = 6000) => {
    controls.autoRotate = false
    clearTimeout(resumeTimer)
    if (reduceMotion) return
    resumeTimer = setTimeout(() => {
      controls.autoRotate = true
    }, ms)
  }

  function flyTo(name, { duration = 1.8, quiet = false, lift } = {}) {
    const v = views[name]
    if (!v) return
    tween.fromPos.copy(camera.position)
    tween.fromTarget.copy(controls.target)
    tween.toPos.set(...v.pos)
    tween.toTarget.set(...v.target)
    tween.lift = lift ?? v.lift ?? 0.5
    tween.dur = reduceMotion ? 0.01 : duration
    tween.t0 = clockTime
    tween.active = true
    controls.enabled = false
    pauseAutoRotate(9000)
    if (!quiet) options.onViewChange?.(name)
  }

  controls.addEventListener('start', () => {
    if (tween.active) {
      tween.active = false
      controls.enabled = true
    }
    pauseAutoRotate(5000)
    stopTour()
    options.onViewChange?.(null)
  })

  /* intro: furniture builds in once the section scrolls into view */
  /* guided tour: a short camera + lighting story */
  const tourSteps = () => {
    const nm = ROOMS[roomName].names
    const lb = ROOMS[roomName].label.toLowerCase()
    return [
      { view: 'overview', mood: 'day', text: `A calm, light-filled ${lb}` },
      { view: 'sofa', mood: 'day', text: `${nm.sofa}, up close` },
      { view: 'table', mood: 'day', text: `${nm.table}: warm materials, small details` },
      { view: 'nook', mood: 'golden', text: `${nm.nook} at golden hour` },
      { view: 'window', mood: 'golden', text: 'Golden hour at the window' },
      { view: 'overview', mood: 'night', text: 'And when the sun goes down, the lamps take over' },
    ]
  }
  let touring = false
  let tourIndex = 0
  let tourTimer = null
  const showCaption = (text) => {
    caption.textContent = text
    caption.classList.remove('is-visible')
    void caption.offsetWidth
    caption.classList.add('is-visible')
  }
  function tourStep() {
    if (!touring) return
    const steps = tourSteps()
    const step = steps[tourIndex % steps.length]
    flyTo(step.view, { duration: 2.4, quiet: true })
    setMood(step.mood)
    options.onViewChange?.(step.view)
    options.onLightingChange?.(step.mood)
    showCaption(step.text)
    tourIndex += 1
    tourTimer = setTimeout(tourStep, 5400)
  }
  function stopTour() {
    if (!touring) return
    touring = false
    clearTimeout(tourTimer)
    caption.classList.remove('is-visible')
    options.onTourChange?.(false)
  }
  function startTour() {
    if (introStart === null) introStart = clockTime
    touring = true
    tourIndex = 0
    options.onTourChange?.(true)
    tourStep()
  }


  let introStart = reduceMotion ? -10 : null

  function resize() {
    const { clientWidth, clientHeight } = container
    renderer.setSize(clientWidth, clientHeight, false)
    composer.setSize(clientWidth, clientHeight)
    const aspect = clientWidth / Math.max(clientHeight, 1)
    camera.aspect = aspect
    camera.fov = aspect < 1.1 ? Math.min(64, 40 + (1.1 - aspect) * 40) : 40
    camera.updateProjectionMatrix()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(container)
  resize()

  let visible = true
  const intersection = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting
      if (entry.isIntersecting && entry.intersectionRatio > 0.1 && introStart === null) {
        introStart = clockTime
        flyTo('overview', { duration: 3.2, quiet: true, lift: 0 })
      }
    },
    { threshold: [0, 0.1, 0.4] },
  )
  intersection.observe(container)

  /* pointer interaction ------------------------------------------------ */
  const raycaster = new THREE.Raycaster()
  const ndc = new THREE.Vector2()

  const shown = (o) => {
    for (let n = o; n; n = n.parent) if (!n.visible) return false
    return true
  }

  function pickHit(x, y) {
    ndc.set(x, y)
    raycaster.setFromCamera(ndc, camera)
    const hits = raycaster.intersectObjects(anim.pickables.filter(shown), false)
    return hits.length ? hits[0] : null
  }

  /* edit layout: drag furniture across the floor */
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  const hitPt = new THREE.Vector3()
  let drag = null
  const entryOf = (o) => {
    for (let n = o; n; n = n.parent) {
      const en = entries.find((e) => e.obj === n)
      if (en) return en
    }
    return null
  }
  canvas.addEventListener(
    'pointerdown',
    (e) => {
      if (!editMode) return
      const r = canvas.getBoundingClientRect()
      const h = pickHit(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      const en = h && entryOf(h.object)
      if (!en || en.room === '*' || FIXED.has(en.item.split('-')[0])) {
        sel = null
        notify()
        return
      }
      sel = en
      notify()
      controls.enabled = false
      if (raycaster.ray.intersectPlane(floorPlane, hitPt)) drag = { dx: hitPt.x - en.obj.position.x, dz: hitPt.z - en.obj.position.z }
    },
    true,
  )

  function triggerPulse(part) {
    pulse[part] = 1
    pop[part].v = 9
  }

  const lampOf = (obj) => {
    for (let n = obj; n; n = n.parent) {
      const lp = anim.lamps.find((l) => l.light.parent === n)
      if (lp) return lp
    }
    return null
  }
  const lampIsOn = (lp) => lp.on !== false

  const curtainTarget = () => (curtainOverride !== null ? curtainOverride : !!ROOMS[roomName].closed)
  const toggleOf = (obj) => {
    for (let n = obj; n; n = n.parent) {
      const tg = anim.toggles.find((x) => x.root === n)
      if (tg) return tg
    }
    return null
  }

  function selectPart(part, obj) {
    stopTour()
    if (part === 'curtain') {
      curtainOverride = !curtainTarget()
      return
    }
    if (part === 'toggle') {
      const tg = toggleOf(obj)
      if (tg) {
        tg.on = !tg.on
        tg.offAt = tg.on && tg.autoOff ? clockTime + tg.autoOff : 0
      }
      return
    }
    if (part === 'lamp') {
      const lp = lampOf(obj)
      if (lp) lp.on = !lampIsOn(lp)
      else {
        const next = !anim.lamps.every(lampIsOn)
        anim.lamps.forEach((l) => { l.on = next })
      }
      return
    }
    triggerPulse(part)
    flyTo(PART_VIEW[part], { duration: 1.5 })
    options.onSelect?.(part)
  }

  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect()
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    pointer.cx = e.clientX - rect.left
    pointer.cy = e.clientY - rect.top
    pointer.inside = true
    pointer.dragging = e.buttons > 0
    if (drag && sel) {
      raycaster.setFromCamera(ndc.set(pointer.x, pointer.y), camera)
      if (raycaster.ray.intersectPlane(floorPlane, hitPt)) {
        sel.obj.position.x = lim(hitPt.x - drag.dx)
        sel.obj.position.z = lim(hitPt.z - drag.dz)
      }
    }
  })
  canvas.addEventListener('pointerleave', () => {
    pointer.inside = false
    hoverPart = null
    tip.hidden = true
    canvas.style.cursor = ''
    controls.enableZoom = false
  })
  canvas.addEventListener('pointerdown', (e) => {
    pointer.down = { x: e.clientX, y: e.clientY }
    pointer.dragging = true
    controls.enableZoom = true
  })
  canvas.addEventListener('pointerup', (e) => {
    pointer.dragging = false
    if (drag) {
      drag = null
      controls.enabled = true
    }
    if (!pointer.down) return
    const moved = Math.hypot(e.clientX - pointer.down.x, e.clientY - pointer.down.y)
    pointer.down = null
    if (moved > 5) return
    const rect = canvas.getBoundingClientRect()
    const h = pickHit(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
    const hit = h ? h.object.userData.part : null
    if (hit && !editMode) selectPart(hit, h.object)
  })

  function spawnBurst(part, color) {
    const o = ANCHORS[part] || [0, 1, 0]
    for (let i = 0; i < BURST; i++) {
      burstPos[i * 3] = o[0] + (Math.random() - 0.5) * 0.6
      burstPos[i * 3 + 1] = o[1] + (Math.random() - 0.5) * 0.3
      burstPos[i * 3 + 2] = o[2] + (Math.random() - 0.5) * 0.6
      const a = Math.random() * Math.PI * 2
      const sp = 0.6 + Math.random() * 1.6
      burstVel[i * 3] = Math.cos(a) * sp
      burstVel[i * 3 + 1] = 1 + Math.random() * 2
      burstVel[i * 3 + 2] = Math.sin(a) * sp
    }
    burstMat.color.set(color).lerp(new THREE.Color('#ffffff'), 0.25)
    burstLife = 1
  }

  /* main loop --------------------------------------------------------- */
  const clockObj = new THREE.Clock()
  const half = CURTAIN_H / 2

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clockObj.getDelta(), 0.05)
    clockTime += dt
    if (!visible) return
    const t = clockTime
    frame++

    /* hover picking (every few frames, so it also tracks the auto-rotation) */
    if (pointer.inside && !pointer.dragging && !tween.active && frame % 3 === 0) {
      const hh = pickHit(pointer.x, pointer.y)
      const hit = hh ? hh.object.userData.part : null
      hoverLamp = hit === 'lamp' ? lampOf(hh.object) : null
      hoverToggle = hit === 'toggle' ? toggleOf(hh.object) : null
      if (hit !== hoverPart) {
        hoverPart = hit
        canvas.style.cursor = hit ? 'pointer' : ''
      }
      if (hit) {
        tip.hidden = false
        tip.textContent = hit === 'curtain' ? `Curtains · click to ${curtainTarget() ? 'open' : 'close'}` : hit === 'toggle' ? (hoverToggle ? hoverToggle.tip(hoverToggle.on) : '') : hit === 'lamp' ? (!hoverLamp || lampIsOn(hoverLamp) ? 'Light · click to switch off' : 'Light · click to switch on') : `${LABELS[hit]} · ${editMode ? 'drag to move' : 'click to restyle'}`
        tip.style.transform = `translate(${pointer.cx + 14}px, ${pointer.cy + 14}px)`
      } else {
        tip.hidden = true
      }
    } else if (pointer.dragging || tween.active) {
      hoverPart = null
      tip.hidden = true
    }

    /* camera */
    if (tween.active) {
      const p = clamp01((t - tween.t0) / tween.dur)
      const e = easeInOutCubic(p)
      camera.position.lerpVectors(tween.fromPos, tween.toPos, e)
      camera.position.y += Math.sin(Math.PI * e) * tween.lift
      controls.target.lerpVectors(tween.fromTarget, tween.toTarget, e)
      camera.lookAt(controls.target)
      if (p >= 1) {
        tween.active = false
        controls.enabled = true
        controls.update()
      }
    } else {
      if (controls.autoRotate) {
        const az = controls.getAzimuthalAngle()
        if (az >= controls.maxAzimuthAngle - 0.03) controls.autoRotateSpeed = -Math.abs(controls.autoRotateSpeed)
        else if (az <= controls.minAzimuthAngle + 0.03) controls.autoRotateSpeed = Math.abs(controls.autoRotateSpeed)
      }
      controls.update()
    }

    /* intro build-in + spring pop */
    const introT = introStart === null ? -1 : t - introStart
    for (const en of entries) {
      const dur = en.dur ?? 0.95
      const p = en.t0 !== undefined ? clamp01((t - en.t0) / dur) : introStart === null ? 0 : clamp01((introT - en.delay) / dur)
      const s = p <= 0 ? 0 : en.kind === 'drop' ? easeOutBack(p) : easeOutCubic(p)
      let popS = 1
      for (const part of en.parts) popS += pop[part].x * 0.045
      const o = en.obj
      const vis = Math.max(s, 0.0001)
      if (en.kind === 'rise') {
        o.scale.set(1, vis, 1)
      } else {
        o.scale.setScalar(vis * popS)
        if (en.kind === 'drop') o.position.y = en.baseY + (1 - Math.min(p * 1.4, 1)) * (en.drop ?? 1.5)
      }
      o.visible = p > 0 && (en.room === '*' || en.room === roomName) && !en.hidden
    }

    /* colour easing, pulses, hover glow */
    const kc = 1 - Math.exp(-dt * 6)
    for (const [key, m] of Object.entries(parts)) {
      const st = pop[key]
      st.v += (-140 * st.x - 10 * st.v) * dt
      st.x += st.v * dt
      pulse[key] = Math.max(0, pulse[key] - dt * 1.3)
      hover[key] += ((hoverPart === key ? 1 : 0) - hover[key]) * (1 - Math.exp(-dt * 10))
      m.color.lerp(targets.get(key), kc)
      m.emissive.copy(m.color)
      m.emissiveIntensity = hover[key] * 0.1 + pulse[key] * 0.35
    }

    /* mood easing (morning / golden hour / night) */
    const km = 1 - Math.exp(-dt * 2.6)
    for (const k of COLOR_KEYS) cur[k].lerp(moodTarget[k], km)
    for (const k of NUM_KEYS) cur[k] += (moodNums[k] - cur[k]) * km
    scene.background.copy(cur.bg).multiplyScalar(cur.bgGain)
    room.skyMat.color.copy(cur.sky)
    hemi.color.copy(cur.hemiSky)
    hemi.groundColor.copy(cur.hemiGround)
    hemi.intensity = cur.hemi
    sun.color.copy(cur.sun)
    sun.intensity = cur.sunI
    fill.intensity = cur.fill
    renderer.toneMappingExposure = cur.exposure
    bloom.strength = cur.bloom
    for (const m of envMats) m.envMapIntensity = cur.env
    room.beamMat.opacity = cur.beam * (1 - 0.85 * curtainAmt)
    dustMat.opacity = cur.dust
    for (let i = 0; i < anim.lamps.length; i++) {
      const lp = anim.lamps[i]
      if (lp.amt === undefined) lp.amt = 1
      lp.amt += ((lampIsOn(lp) ? 1 : 0) - lp.amt) * (1 - Math.exp(-dt * 6))
      const lampHover = hoverLamp === lp ? 0.35 : 0
      const level = cur.lamp * lp.amt
      lp.light.intensity = lp.base * level * (1 + Math.sin(t * 1.7 + i) * 0.025)
      lp.shadeMat.emissiveIntensity = 0.08 + Math.min(level, 2.2) * 0.55 + lampHover
      lp.halo.material.opacity = Math.min(level / 1.6, 1) * 0.55
    }

    /* tap-to-toggle fixtures (bed net, wash basin tap ...) */
    for (const tg of anim.toggles) {
      if (tg.on && tg.offAt && clockTime > tg.offAt) tg.on = false
      tg.amt += ((tg.on ? 1 : 0) - tg.amt) * (1 - Math.exp(-dt * (tg.rate || 3)))
      tg.apply(tg.amt, t)
    }

    /* plants sway */
    for (const s of anim.swayers) {
      s.tilt.rotation.x = s.baseTilt + Math.sin(t * 1.1 + s.phase) * s.amp
      s.tilt.rotation.z = Math.sin(t * 0.8 + s.phase * 1.7) * s.amp * 0.8
    }

    /* curtains breathe (and close in the bedroom) */
    curtainAmt += ((curtainTarget() ? 1 : 0) - curtainAmt) * (1 - Math.exp(-dt * 2.5))
    for (const cu of anim.curtains) {
      cu.mesh.scale.x = 1 + 0.45 * curtainAmt
      cu.mesh.position.z = cu.zOpen + ((cu.zOpen < 0 ? -1.2 : 0) - cu.zOpen) * curtainAmt
      const p = cu.geo.attributes.position
      const arr = p.array
      for (let i = 0; i < p.count; i++) {
        const lower = (half - cu.base[i * 3 + 1]) / CURTAIN_H
        arr[i * 3 + 2] = cu.base[i * 3 + 2] + Math.sin(t * 0.9 + cu.base[i * 3] * 3) * 0.02 * lower * lower
      }
      p.needsUpdate = true
    }

    /* steam */
    for (const s of anim.steam) {
      const life = (t * 0.35 + s.phase) % 1
      s.mesh.position.set(s.x + Math.sin(life * 6 + s.phase * 9) * 0.02, s.y + life * 0.35, s.z)
      s.mesh.material.opacity = Math.sin(life * Math.PI) * 0.35
      s.mesh.scale.setScalar(0.7 + life * 1.6)
    }

    /* real-time clock */
    const d = new Date()
    const sec = d.getSeconds() + d.getMilliseconds() / 1000
    const min = d.getMinutes() + sec / 60
    const hr = (d.getHours() % 12) + min / 60
    anim.clockHands.sec.rotation.z = -(sec / 60) * Math.PI * 2
    anim.clockHands.min.rotation.z = -(min / 60) * Math.PI * 2
    anim.clockHands.hour.rotation.z = -(hr / 12) * Math.PI * 2
    if (anim.officeClock) {
      anim.officeClock.sec.rotation.z = -(sec / 60) * Math.PI * 2
      anim.officeClock.min.rotation.z = -(min / 60) * Math.PI * 2
      anim.officeClock.hour.rotation.z = -(hr / 12) * Math.PI * 2
    }

    /* dust */
    for (let i = 0; i < DUST; i++) {
      const ds = dustSeed[i]
      dustPos[i * 3] = ds.x + Math.sin(t * ds.s + ds.p) * 0.25
      dustPos[i * 3 + 1] = 0.3 + ((ds.y + t * ds.s * 0.12) % 3)
      dustPos[i * 3 + 2] = ds.z + Math.cos(t * ds.s * 0.8 + ds.p) * 0.25
    }
    dustGeo.attributes.position.needsUpdate = true

    /* sparkle burst */
    if (burstLife > 0) {
      burstLife -= dt * 1.1
      for (let i = 0; i < BURST; i++) {
        burstVel[i * 3 + 1] -= 3.2 * dt
        burstPos[i * 3] += burstVel[i * 3] * dt
        burstPos[i * 3 + 1] += burstVel[i * 3 + 1] * dt
        burstPos[i * 3 + 2] += burstVel[i * 3 + 2] * dt
      }
      burstGeo.attributes.position.needsUpdate = true
      burstMat.opacity = Math.max(burstLife, 0)
    }

    selBox.visible = Boolean(editMode && sel && sel.obj.visible && !sel.hidden)
    if (selBox.visible) selBox.box.setFromObject(sel.obj)

    composer.render()
  })

  container.classList.remove('is-loading')

  return {
    setColor(key, hex) {
      if (!targets.has(key)) return
      targets.get(key).set(hex)
      if (introStart === null) return
      triggerPulse(key)
      spawnBurst(key, hex)
      if (PART_VIEW[key] && !tween.active) flyTo(PART_VIEW[key], { duration: 1.4 })
    },
    setLighting(name) {
      stopTour()
      setMood(name)
    },
    startTour,
    stopTour,
    isTouring: () => touring,
    snapshot() {
      composer.render()
      return canvas.toDataURL('image/png')
    },
    setView(name) {
      stopTour()
      flyTo(name, { duration: 1.8, quiet: true })
    },
    getLighting: () => moodName,
    rooms: Object.entries(ROOMS).map(([id, r]) => ({ id, label: r.label, names: r.names })),
    setRoom(name) {
      const r = ROOMS[name]
      if (!r) return
      stopTour()
      roomName = name
      curtainOverride = null
      sel = null
      notify()
      views = r.views
      let i = 0
      for (const en of entries) if (en.room === name) en.t0 = clockTime + i++ * 0.12
      flyTo('overview', { duration: 1.6, quiet: true, lift: 0.4 })
    },
    getItems: () => entries.filter((e) => e.item && (e.room === '*' || e.room === roomName)).map((e) => ({ id: `${e.room}:${e.item}`, label: e.label, on: !e.hidden })),
    setEdit(on) {
      editMode = on
      if (!on) {
        sel = null
        notify()
      }
      pauseAutoRotate(on ? 1e9 : 1500)
    },
    editAction(act) {
      if (act === 'reset') {
        for (let i = entries.length - 1; i >= 0; i--) {
          const en = entries[i]
          if (en.room !== roomName) continue
          if (en.extra) {
            en.obj.visible = false
            scene.remove(en.obj)
            entries.splice(i, 1)
            continue
          }
          en.obj.position.x = en.home.x
          en.obj.position.z = en.home.z
          en.obj.rotation.y = en.home.r
          en.hidden = en.home.h
        }
        sel = null
        notify()
      } else if (!sel) return
      else if (act === 'rotate') sel.obj.rotation.y += Math.PI / 4
      else if (act === 'remove') {
        sel.hidden = true
        sel = null
        notify()
      } else if (act === 'duplicate') {
        const c = sel.obj.clone(true)
        c.position.x = lim(c.position.x + 0.7)
        c.position.z = lim(c.position.z + 0.5)
        scene.add(c)
        c.traverse((o) => {
          if (o.isMesh && o.userData.part) anim.pickables.push(o)
        })
        const ne = { ...sel, obj: c, item: `${sel.item}-${++copyId}`, label: `${sel.label} copy`, extra: true, hidden: false, t0: clockTime }
        ne.home = { x: c.position.x, z: c.position.z, r: c.rotation.y }
        entries.push(ne)
        sel = ne
        notify()
      }
    },
    setItem(id, on) {
      const en = entries.find((e) => `${e.room}:${e.item}` === id)
      if (!en) return
      en.hidden = !on
      if (on) en.t0 = clockTime
    },
  }
}
