import * as THREE from 'three'

// Bedroom + kitchen furniture. Every put() call is one furniture item that the UI can switch on/off.
export function buildOtherRooms(c) {
  const { box, rbox, cyl, at, tag, mat, parts, brass, addEntry, anim, makePlant, glowTexture, artTexture, canvasTexture } = c
  const grp = (...k) => { const g = new THREE.Group(); if (k.length) g.add(...k); return g }
  const put = (room, id, label, obj, x, y, z, o = {}) => {
    obj.position.set(x, y, z)
    return addEntry(obj, { room, item: id, label, drop: 2, ...o })
  }
  const dark = mat('#2a2825', 0.5)
  const steel = new THREE.MeshStandardMaterial({ color: '#c9ccd0', metalness: 0.7, roughness: 0.35 })
  const stone = parts.slab
  const linen = mat('#ece4d6', 0.95)
  const wh = mat('#f6f3ee', 0.3)
  const glassM = mat('#cfe6ee', 0.05, { transparent: true, opacity: 0.25, depthWrite: false })
  const mirrorM = mat('#dfe8ec', 0.08, { metalness: 0.5 })
  const gold = brass
  const ball = (r, m) => new THREE.Mesh(new THREE.SphereGeometry(r, 14, 12), m)
  const torus = (R, r, m, arc = Math.PI * 2) => new THREE.Mesh(new THREE.TorusGeometry(R, r, 8, 28, arc), m)
  const flat = (obj, sx, sy, sz) => { obj.scale.set(sx, sy, sz); return obj }
  const waterMat = mat('#9ad0e8', 0.1, { transparent: true, opacity: 0.7, depthWrite: false })
  const makeWater = (parent, x, yTop, z, yBot) => {
    const len = yTop - yBot
    const stream = cyl(0.006, 0.006, len, waterMat, 8, false)
    stream.position.set(x, yBot + len / 2, z)
    stream.visible = false
    const rings = [0, 1].map(() => {
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.002, 6, 24), new THREE.MeshBasicMaterial({ color: '#dff3fb', transparent: true, opacity: 0, depthWrite: false }))
      r.rotation.x = Math.PI / 2
      r.position.set(x, yBot + 0.003, z)
      r.visible = false
      return r
    })
    parent.add(stream, ...rings)
    return (amt, t) => {
      const run = amt > 0.04
      stream.visible = run
      const wob = 1 + 0.25 * Math.sin(t * 45)
      stream.scale.set(wob, Math.max(amt, 0.01), wob)
      stream.position.y = yTop - (len / 2) * amt
      rings.forEach((r, i) => {
        r.visible = run
        const ph = (t * 1.3 + i * 0.5) % 1
        r.scale.setScalar(0.4 + ph * 3.2)
        r.material.opacity = (1 - ph) * 0.7 * Math.min(1, amt * 2)
      })
    }
  }
  const lightToggle = (root, label, mats, light, lightMax) => {
    const apply = (amt) => { mats.forEach(([m, mx]) => { m.emissiveIntensity = mx * amt }); if (light) light.intensity = lightMax * amt }
    apply(0)
    anim.toggles.push({ root, on: false, amt: 0, rate: 8, tip: (on) => `${label} light · click to switch ${on ? 'off' : 'on'}`, apply })
  }
  const scenery = (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h * 0.68)
    sky.addColorStop(0, '#2a2f6b'); sky.addColorStop(0.55, '#e07a5f'); sky.addColorStop(1, '#f2cc8f')
    g.fillStyle = sky; g.fillRect(0, 0, w, h)
    g.fillStyle = '#fff3c4'; g.beginPath(); g.arc(w * 0.68, h * 0.5, h * 0.09, 0, 7); g.fill()
    g.fillStyle = '#5b4b8a'; g.beginPath(); g.moveTo(0, h * 0.68); g.lineTo(w * 0.2, h * 0.38); g.lineTo(w * 0.38, h * 0.6); g.lineTo(w * 0.55, h * 0.42); g.lineTo(w * 0.8, h * 0.64); g.lineTo(w, h * 0.5); g.lineTo(w, h * 0.68); g.fill()
    g.fillStyle = '#2f2a55'; g.beginPath(); g.moveTo(0, h * 0.68); g.lineTo(w * 0.15, h * 0.55); g.lineTo(w * 0.3, h * 0.68); g.fill()
    const lake = g.createLinearGradient(0, h * 0.68, 0, h)
    lake.addColorStop(0, '#e9a26b'); lake.addColorStop(1, '#2b3a67')
    g.fillStyle = lake; g.fillRect(0, h * 0.68, w, h * 0.32)
    g.fillStyle = 'rgba(255,243,196,0.5)'
    for (let i = 0; i < 6; i++) g.fillRect(w * 0.68 - (60 - i * 8), h * 0.72 + i * 9, 120 - i * 16, 3)
  }
  const sph = (r, color) => new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), mat(color, 0.7))
  const shadeMat = () => new THREE.MeshStandardMaterial({ color: '#f6e5c8', emissive: '#ffd9a0', emissiveIntensity: 0.5, side: THREE.DoubleSide, roughness: 0.9 })
  const glow = (y, s) => {
    const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.3 }))
    h.position.y = y
    h.scale.set(s, s, 1)
    return h
  }
  const lampG = (base) => {
    const shade = shadeMat()
    const light = new THREE.PointLight('#ffd7a1', base, 4, 1.6)
    light.position.y = 0.5
    const halo = glow(0.5, 0.9)
    anim.lamps.push({ light, base, shadeMat: shade, halo })
    return tag(grp(at(cyl(0.06, 0.08, 0.05, brass, 16), 0, 0.025, 0), at(cyl(0.015, 0.015, 0.2, brass, 8, false), 0, 0.15, 0), at(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.17, 0.22, 24, 1, true), shade), 0, 0.32, 0), light, halo), 'lamp')
  }
  const plant = (seed, r, h) => {
    const p = makePlant({ potR: r, potH: h, leaves: 12, minH: h, maxH: h * 2, seed })
    anim.swayers.push(...p.swayers)
    return p.group
  }

  /* ---------------- bedroom ---------------- */
  const B = 'bedroom'
  /* modern luxury bed: floating platform with LED glow, arched channel-tufted headboard, slim gold canopy + net */
  const ledM = new THREE.MeshStandardMaterial({ color: '#ffe9c4', emissive: '#ffb866', emissiveIntensity: 1.6, transparent: true, opacity: 0.85 })
  const bedG = grp(
    tag(at(rbox(2.2, 0.16, 2.2, parts.wood, 0.04), 0, 0.26, 0), 'wood'),
    at(box(2.0, 0.12, 2.0, dark, false), 0, 0.1, 0),
    at(box(2.36, 0.004, 2.36, ledM, false), 0, 0.012, 0),
    tag(at(box(2.2, 1.15, 0.12, parts.wood), 0, 0.775, -1.04), 'wood'),
    tag(at(flat((() => { const d = cyl(1.1, 1.1, 0.12, parts.wood, 40); d.rotation.x = Math.PI / 2; return d })(), 1, 1, 0.4), 0, 1.35, -1.04), 'wood'),
    tag(at(rbox(2.1, 0.3, 2.05, parts.sofa, 0.1), 0, 0.5, 0.02), 'sofa'),
    at(rbox(2.14, 0.1, 1.3, linen, 0.05), 0, 0.7, 0.42),
    at(rbox(2.16, 0.05, 0.5, mat('#b08d57', 0.7), 0.02, 2), 0, 0.73, 0.9),
    at(rbox(0.85, 0.18, 0.45, linen, 0.08), -0.5, 0.72, -0.72),
    at(rbox(0.85, 0.18, 0.45, linen, 0.08), 0.5, 0.72, -0.72),
    at(rbox(0.6, 0.14, 0.3, mat('#8fa38a', 0.85), 0.07), -0.45, 0.82, -0.42),
    at(rbox(0.6, 0.14, 0.3, mat('#d9a08c', 0.85), 0.07), 0.45, 0.82, -0.42),
    at(rbox(0.36, 0.12, 0.24, mat('#b08d57', 0.6), 0.06), 0, 0.84, -0.3),
  )
  for (let i = 0; i < 11; i++) {
    const x = -0.95 + i * 0.19
    const top = 1.35 + 0.44 * Math.sqrt(Math.max(0, 1 - (x / 1.1) ** 2)) - 0.06
    bedG.add(tag(at(rbox(0.16, top - 0.25, 0.09, parts.sofa, 0.06), x, (top + 0.25) / 2, -0.97), 'sofa'))
  }
  for (const [px, pz] of [[-1.1, -1.07], [1.1, -1.07], [-1.1, 1.07], [1.1, 1.07]]) bedG.add(at(cyl(0.018, 0.018, 2.45, gold, 10, false), px, 1.225, pz))
  for (const z of [-1.07, 1.07]) bedG.add(at(box(2.2, 0.03, 0.03, gold, false), 0, 2.44, z))
  for (const x of [-1.1, 1.1]) bedG.add(at(box(0.03, 0.03, 2.14, gold, false), x, 2.44, 0))

  const netM = new THREE.MeshStandardMaterial({ color: '#fffaf2', transparent: true, opacity: 0.34, side: THREE.DoubleSide, roughness: 1, depthWrite: false })
  const netG = new THREE.Group()
  const mkPanel = (w, axis, fixed, rotY, c0, c1) => {
    const geo = new THREE.PlaneGeometry(w, 2.0, 28, 4)
    const pa = geo.attributes.position
    for (let i = 0; i < pa.count; i++) pa.setZ(i, Math.sin(pa.getX(i) * 18) * 0.025)
    geo.computeVertexNormals()
    const m = new THREE.Mesh(geo, netM)
    m.rotation.y = rotY
    m.position.y = 1.35
    m.position[axis === 'x' ? 'z' : 'x'] = fixed
    netG.add(m)
    return { m, axis, c0, c1 }
  }
  const netPanels = [
    mkPanel(1.1, 'x', 1.1, 0, -0.55, -1.03), mkPanel(1.1, 'x', 1.1, 0, 0.55, 1.03),
    mkPanel(2.2, 'x', -1.05, 0, 0, -0.97),
    mkPanel(2.1, 'z', -1.1, Math.PI / 2, 0.03, -0.92), mkPanel(2.1, 'z', 1.1, Math.PI / 2, 0.03, -0.92),
  ]
  const netApply = (amt) => {
    for (const q of netPanels) { q.m.scale.x = 0.12 + 0.88 * amt; q.m.position[q.axis] = q.c1 + (q.c0 - q.c1) * amt }
  }
  tag(netG, 'toggle')
  bedG.add(netG)
  netApply(0)
  anim.toggles.push({ root: netG, on: false, amt: 0, rate: 2.2, tip: (on) => (on ? 'Bed net · click to open' : 'Bed net · click to close'), apply: netApply })
  put(B, 'bed', 'Fancy bed with net', bedG, 0.3, 0, -2.8, { parts: ['sofa', 'wood'] })
  const stand = (x) => grp(
    at(rbox(0.5, 0.4, 0.4, parts.wood, 0.06), x, 0.42, 0), at(box(0.2, 0.015, 0.02, gold, false), x, 0.46, 0.205), at(box(0.2, 0.01, 0.01, dark, false), x, 0.38, 0.205),
    ...[-0.18, 0.18].map((dx) => at(cyl(0.012, 0.01, 0.22, gold, 8, false), x + dx, 0.11, 0)),
  )
  put(B, 'stands', 'Bedside tables', tag(grp(stand(-1.05), stand(1.65)), 'wood'), 0, 0, -3.62, { parts: ['wood'] })
  put(B, 'lamps', 'Bedside lamps', grp(at(lampG(2.2), -1.05, 0.62, 0), at(lampG(2.2), 1.65, 0.62, 0)), 0, 0, -3.62)
  /* fancy wardrobe: fluted doors, gold mirror panel, LED plinth - tap to open / close the doors */
  const wd = grp(
    tag(grp(
      at(box(1.8, 2.9, 0.03, parts.wood), 0, 1.45, -0.285),
      at(box(0.03, 2.9, 0.6, parts.wood), -0.885, 1.45, 0), at(box(0.03, 2.9, 0.6, parts.wood), 0.885, 1.45, 0),
      at(box(1.8, 0.04, 0.6, parts.wood), 0, 2.88, 0), at(box(1.8, 0.04, 0.6, parts.wood), 0, 0.12, 0),
      at(box(0.03, 2.74, 0.58, parts.wood), -0.3, 1.5, 0), at(box(0.03, 2.74, 0.58, parts.wood), 0.3, 1.5, 0),
    ), 'wood'),
    at(box(1.74, 0.1, 0.52, dark, false), 0, 0.05, -0.02),
    at(box(1.74, 0.012, 0.012, ledM, false), 0, 0.105, 0.28),
    at(box(1.86, 0.05, 0.64, gold, false), 0, 2.93, 0),
  )
  const garment = ['#3b4a5c', '#d9c3a0', '#8a6f5a', '#f2ece1', '#5f7662', '#b5654a', '#2a2825', '#d9a08c']
  const rod = cyl(0.012, 0.012, 0.55, gold, 8, false)
  rod.rotation.z = Math.PI / 2
  wd.add(at(rod, -0.59, 2.4, 0))
  garment.forEach((c, i) => wd.add(at(rbox(0.05, 0.9, 0.36, mat(c, 0.85), 0.02, 2), -0.84 + i * 0.068, 1.92, 0)))
  wd.add(at(box(0.55, 0.025, 0.5, parts.wood, false), -0.59, 0.85, 0))
  garment.slice(0, 3).forEach((c, i) => wd.add(at(rbox(0.4, 0.07, 0.3, mat(c, 0.9), 0.02, 2), -0.59, 0.9 + i * 0.075, 0)))
  ;[0.5, 0.95, 1.4, 1.85, 2.3].forEach((y, k) => {
    wd.add(at(box(0.55, 0.025, 0.5, parts.wood, false), 0.59, y, 0))
    wd.add(at(rbox(0.42, 0.12, 0.32, mat(garment[(k * 3) % 8], 0.9), 0.02, 2), 0.59, y + 0.075, 0), at(rbox(0.3, 0.1, 0.3, mat(garment[(k * 3 + 2) % 8], 0.9), 0.02, 2), 0.59, y + 0.2, 0))
  })
  // shoe racks, hanger hooks and LED strips inside (visible when the doors open)
  ;[0.3, 0.58].forEach((y) => {
    wd.add(at(box(0.55, 0.025, 0.5, parts.wood, false), -0.59, y, 0))
    ;['#2a2825', '#b5654a', '#d9c3a0'].forEach((c, i) => wd.add(at(rbox(0.12, 0.07, 0.26, mat(c, 0.6), 0.03, 2), -0.78 + i * 0.17, y + 0.05, 0.02)))
  })
  garment.forEach((c, i) => wd.add(at(box(0.012, 0.05, 0.012, gold, false), -0.84 + i * 0.068, 2.4, 0)))
  wd.add(at(box(0.5, 0.01, 0.01, ledM, false), -0.59, 2.82, 0.24), at(box(0.5, 0.01, 0.01, ledM, false), 0.59, 2.82, 0.24))
  // gold-framed mirror panel on top, two drawers underneath
  wd.add(at(box(0.58, 1.95, 0.03, gold, false), 0, 1.87, 0.3), at(box(0.5, 1.85, 0.03, mirrorM, false), 0, 1.87, 0.318))
  ;[0.31, 0.69].forEach((y) => {
    wd.add(tag(at(box(0.54, 0.36, 0.03, parts.wood), 0, y, 0.3), 'wood'), at(box(0.2, 0.016, 0.022, gold, false), 0, y + 0.09, 0.325))
    for (let i = 0; i < 5; i++) wd.add(tag(at(box(0.018, 0.3, 0.012, parts.wood), -0.2 + i * 0.1, y, 0.322), 'wood'))
  })
  // hinged fluted doors
  const hinged = (hx, dir) => {
    const pv = new THREE.Group()
    pv.position.set(hx, 0, 0.3)
    const door = tag(grp(at(box(0.585, 2.74, 0.03, parts.wood), dir * 0.2925, 1.5, 0)), 'toggle')
    for (let i = 0; i < 8; i++) door.add(tag(at(box(0.035, 2.64, 0.016, parts.wood), dir * (0.045 + i * 0.07), 1.5, 0.022), 'toggle'))
    door.add(tag(at(box(0.016, 0.55, 0.02, gold, false), dir * 0.52, 1.35, 0.045), 'toggle'))
    pv.add(door)
    wd.add(pv)
    return pv
  }
  const doorL = hinged(-0.885, 1)
  const doorR = hinged(0.885, -1)
  const wdApply = (amt) => { doorL.rotation.y = -amt * 1.75; doorR.rotation.y = amt * 1.75 }
  wdApply(0)
  anim.toggles.push({ root: wd, on: false, amt: 0, rate: 3, tip: (on) => (on ? 'Wardrobe · click to close the doors' : 'Wardrobe · click to open the doors'), apply: wdApply })
  put(B, 'wardrobe', 'Fancy wardrobe (tap to open)', wd, 2.95, 0, -3.58, { parts: ['wood'] })

  /* dressing table + chair, set up and ready to use */
  const ovalMirror = grp(at(cyl(0.44, 0.44, 0.05, brass, 40, false), 0, 0, 0), at(cyl(0.4, 0.4, 0.06, mirrorM, 40, false), 0, 0, 0))
  ovalMirror.rotation.x = Math.PI / 2
  const ovalW = grp(ovalMirror)
  ovalW.scale.set(0.9, 1.35, 1)
  const dt = grp(
    tag(grp(
      at(box(1.3, 0.05, 0.52, parts.wood), 0, 0.775, 0),
      at(box(1.2, 0.12, 0.46, parts.wood), 0, 0.69, 0),
      ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].flatMap(([a, b]) => [at(cyl(0.035, 0.02, 0.65, parts.wood, 12), a * 0.58, 0.33, b * 0.19), at(ball(0.03, gold), a * 0.58, 0.02, b * 0.19)]),
    ), 'wood'),
    at(box(1.34, 0.012, 0.56, gold, false), 0, 0.748, 0),
    at(box(0.012, 0.1, 0.02, dark, false), 0, 0.69, 0.235),
    ...[-0.3, 0.3].map((x) => at(ball(0.025, gold), x, 0.69, 0.245)),
    at(rbox(0.5, 0.012, 0.28, brass, 0.01, 2), -0.28, 0.806, 0.02),
    ...[[-0.4, '#f3b6c8'], [-0.28, '#cfe6ee'], [-0.16, '#e8c6a6']].flatMap(([x, c]) => [at(cyl(0.03, 0.03, 0.09, mat(c, 0.15, { transparent: true, opacity: 0.85 }), 16, false), x, 0.857, 0.02), at(ball(0.018, gold), x, 0.915, 0.02)]),
    at(rbox(0.24, 0.1, 0.16, mat('#f4efe6', 0.4), 0.02), 0.3, 0.85, -0.08),
    at(box(0.25, 0.012, 0.17, gold, false), 0.3, 0.9, -0.08),
    at(cyl(0.025, 0.025, 0.07, gold, 14, false), 0.12, 0.835, 0.12),
  )
  const dtShade = mat('#f6e6d0', 0.7, { emissive: '#ffd9a0', emissiveIntensity: 0 })
  const dtLamp = grp(at(cyl(0.06, 0.07, 0.02, gold, 20), 0, 0.01, 0), at(cyl(0.012, 0.016, 0.26, gold, 10, false), 0, 0.15, 0), at(ball(0.045, mat('#efe6d6', 0.3)), 0, 0.12, 0), at(cyl(0.07, 0.12, 0.15, dtShade, 24, false), 0, 0.34, 0))
  const dtLight = new THREE.PointLight('#ffcf8a', 0, 3.2)
  dtLight.position.set(0, 0.34, 0.05)
  dtLamp.add(dtLight)
  tag(dtLamp, 'toggle')
  lightToggle(dtLamp, 'Dressing table lamp', [[dtShade, 1.8]], dtLight, 0.9)
  dt.add(at(dtLamp, -0.58, 0.8, -0.17))
  for (let i = 0; i < 4; i++) dt.add(at(cyl(0.003, 0.003, 0.12, dark, 6, false), 0.12 + (i - 1.5) * 0.008, 0.9, 0.12))
  const miniV = grp(at(cyl(0.04, 0.03, 0.1, mat('#2f5d7a', 0.35), 16), 0, 0.05, 0))
  for (const [c, x, y] of [['#e58fa5', -0.03, 0.18], ['#f3d36b', 0.03, 0.2], ['#f7f2ea', 0, 0.23]]) miniV.add(at(cyl(0.003, 0.003, y - 0.1, mat('#4f7a4a', 0.8), 6, false), x * 0.6, 0.1 + (y - 0.1) / 2, 0), at(ball(0.025, mat(c, 0.6)), x, y, 0))
  dt.add(at(miniV, 0.5, 0.8, 0.12))
  put(B, 'dresser', 'Dressing table, lamp (tap) & makeup', dt, -2.9, 0, -3.62, { parts: ['wood'] })
  const wallMirror = grp(
    at(rbox(0.98, 1.42, 0.04, brass, 0.08), 0, 0, 0), at(rbox(0.86, 1.3, 0.045, mirrorM, 0.06), 0, 0, 0.012),
    at(box(0.9, 0.014, 0.01, ledM, false), 0, 0.67, 0.035), at(box(0.9, 0.014, 0.01, ledM, false), 0, -0.67, 0.035),
    at(box(0.014, 1.3, 0.01, ledM, false), -0.45, 0, 0.035), at(box(0.014, 1.3, 0.01, ledM, false), 0.45, 0, 0.035),
  )
  put(B, 'wallmirror', 'Wall mirror (LED frame)', wallMirror, -2.9, 1.75, -3.86)
  const vc = grp(
    tag(at(cyl(0.27, 0.27, 0.09, parts.sofa, 32), 0, 0.46, 0), 'sofa'),
    tag(at(cyl(0.285, 0.285, 0.03, parts.wood, 32), 0, 0.405, 0), 'wood'),
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => tag(at(cyl(0.028, 0.016, 0.4, parts.wood, 10, false), a * 0.17, 0.2, b * 0.17), 'wood')),
    tag(at(rbox(0.46, 0.3, 0.07, parts.sofa, 0.05), 0, 0.82, -0.27), 'sofa'),
    ...[-0.2, 0.2].map((x) => tag(at(cyl(0.015, 0.015, 0.5, parts.wood, 8, false), x, 0.66, -0.27), 'wood')),
    ...[[0, 0], [0.12, 0.08], [-0.12, 0.08], [0.1, -0.1], [-0.1, -0.1]].map(([x, z]) => at(ball(0.014, gold), x, 0.51, z)),
  )
  vc.rotation.y = Math.PI
  put(B, 'dresschair', 'Dressing chair', vc, -2.9, 0, -2.95, { parts: ['sofa', 'wood'] })
  const frame = (x, k) => at(grp(
    tag(box(0.8, 1.0, 0.05, parts.wood), 'wood'),
    at(new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.88), new THREE.MeshStandardMaterial({ map: artTexture(k), roughness: 0.8 })), 0, 0, 0.03),
  ), x, 0, 0)
  put(B, 'art', 'Wall art', grp(frame(-0.55, 'sun'), frame(0.55, 'lines')), 0.3, 2.5, -3.875)
  put(B, 'bench', 'Bench', tag(rbox(1.4, 0.4, 0.42, parts.sofa, 0.08), 'sofa'), 0.3, 0.2, -1.3, { parts: ['sofa'] })
  put(B, 'rug', 'Rug', tag(box(3.4, 0.03, 2.6, parts.rug, false), 'rug'), 0.3, 0.016, -1.9, { kind: 'grow', parts: ['rug'] })
  /* ---- trending floor tiles (turn one on, it covers the others) ---- */
  const lcg = (seed) => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)]
  const tileMesh = (draw, rep, top, rough, seed) => {
    const tex = canvasTexture(512, 512, (g, w, h) => draw(g, w, h, lcg(seed)))
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(rep, rep)
    const m = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.02, 7.8), new THREE.MeshStandardMaterial({ map: tex, roughness: rough, metalness: 0.03 }))
    m.receiveShadow = true
    return [m, top - 0.01]
  }
  const travertine = (g, w, h, r) => {
    g.fillStyle = '#e4d5bd'; g.fillRect(0, 0, w, h)
    for (let i = 0; i < 70; i++) { g.fillStyle = r() > 0.5 ? 'rgba(170,140,100,0.09)' : 'rgba(255,250,240,0.14)'; g.fillRect(0, r() * h, w, 1 + r() * 6) }
    for (let i = 0; i < 90; i++) { g.fillStyle = 'rgba(190,165,125,0.5)'; g.beginPath(); g.ellipse(r() * w, r() * h, 1 + r() * 4, 0.6 + r() * 1.4, 0, 0, 7); g.fill() }
    g.strokeStyle = '#d3c3a6'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4)
  }
  const chevron = (g, w, h, r) => {
    const pal = ['#b88a5a', '#a97c4d', '#c19564', '#9c7143', '#b58557']
    const pw = 128, ph = 64, sl = 32
    for (let ro = -1; ro <= h / ph + 1; ro++) for (let c = -1; c <= w / pw; c++) {
      const x = c * pw, y = ro * ph
      for (const side of [0, 1]) {
        g.fillStyle = pick(r, pal); g.beginPath()
        if (side === 0) { g.moveTo(x, y + sl); g.lineTo(x + pw / 2, y); g.lineTo(x + pw / 2, y + ph); g.lineTo(x, y + sl + ph) }
        else { g.moveTo(x + pw / 2, y); g.lineTo(x + pw, y + sl); g.lineTo(x + pw, y + sl + ph); g.lineTo(x + pw / 2, y + ph) }
        g.closePath(); g.fill(); g.strokeStyle = 'rgba(50,30,15,0.45)'; g.lineWidth = 1.5; g.stroke()
      }
    }
  }
  const terrazzo = (g, w, h, r) => {
    g.fillStyle = '#ece5da'; g.fillRect(0, 0, w, h)
    const pal = ['#c27a5a', '#8fa38a', '#3e3a38', '#f7f3ec', '#d9a08c', '#b9a98d']
    for (let i = 0; i < 340; i++) {
      const cx = r() * w, cy = r() * h, rad = 3 + r() * 11
      g.fillStyle = pick(r, pal); g.beginPath()
      for (let k = 0; k < 5; k++) { const an = (k / 5) * 6.283, rr = rad * (0.6 + r() * 0.6); g[k ? 'lineTo' : 'moveTo'](cx + Math.cos(an) * rr, cy + Math.sin(an) * rr) }
      g.closePath(); g.fill()
    }
  }
  const calacatta = (g, w, h, r) => {
    g.fillStyle = '#f4f1ec'; g.fillRect(0, 0, w, h)
    for (let i = 0; i < 16; i++) {
      g.strokeStyle = i % 4 === 0 ? 'rgba(201,164,92,0.5)' : 'rgba(120,120,125,0.32)'; g.lineWidth = 0.8 + r() * 2.6
      const x = r() * w, y = r() * h
      g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 80 * r(), y + 60, x - 70, y + 120 * r(), x + 90 * (r() - 0.5), y + 200); g.stroke()
    }
    g.strokeStyle = '#e1dbd0'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3)
    g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke()
  }
  const tileSets = [
    ['tiles', 'Floor tiles · travertine (trending)', tileMesh(travertine, 6, 0.02, 0.45, 11), false],
    ['tiles-oak', 'Floor tiles · chevron oak', tileMesh(chevron, 5, 0.022, 0.5, 12), true],
    ['tiles-terrazzo', 'Floor tiles · terrazzo', tileMesh(terrazzo, 4, 0.024, 0.3, 13), true],
    ['tiles-marble', 'Floor tiles · Calacatta marble', tileMesh(calacatta, 4, 0.026, 0.12, 14), true],
  ]
  for (const [id, label, [mesh, y], hid] of tileSets) put(B, id, label, mesh, 0, y, 0, { kind: 'grow', hidden: hid })

  /* ---- trending bedroom pieces ---- */
  const arm = grp(
    tag(at(rbox(0.82, 0.3, 0.78, parts.sofa, 0.12), 0, 0.37, 0), 'sofa'),
    tag(at(rbox(0.82, 0.62, 0.2, parts.sofa, 0.12), 0, 0.68, -0.31), 'sofa'),
    tag(at(rbox(0.18, 0.32, 0.72, parts.sofa, 0.08), -0.43, 0.56, 0), 'sofa'),
    tag(at(rbox(0.18, 0.32, 0.72, parts.sofa, 0.08), 0.43, 0.56, 0), 'sofa'),
    tag(at(rbox(0.62, 0.1, 0.6, parts.sofa, 0.06), 0, 0.56, 0.06), 'sofa'),
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => at(cyl(0.025, 0.015, 0.2, gold, 10, false), a * 0.34, 0.1, b * 0.3)),
  )
  arm.rotation.y = -2.2
  put(B, 'armchair', 'Boucle armchair', arm, 2.6, 0, -1.1, { parts: ['sofa'] })
  const sideT = grp(
    at(cyl(0.27, 0.27, 0.035, stone, 32), 0, 0.52, 0), at(cyl(0.035, 0.035, 0.5, gold, 12, false), 0, 0.26, 0), at(cyl(0.17, 0.17, 0.03, gold, 24, false), 0, 0.015, 0),
    at(cyl(0.04, 0.03, 0.12, mat('#c27a5a', 0.5), 16), 0.06, 0.6, 0),
    ...[[-0.01, 0.2, '#d9c3a0'], [0.03, 0.26, '#cdb68f'], [0.08, 0.22, '#d9c3a0']].map(([x, y, c]) => at(flat(ball(0.025, mat(c, 0.9)), 0.8, 2.4, 0.8), 0.06 + x, 0.6 + y, 0)),
  )
  put(B, 'sidetable', 'Marble side table & pampas', sideT, 3.3, 0, -1.8)
  const arcShade = shadeMat()
  const arcLight = new THREE.PointLight('#ffd7a1', 3, 5, 1.6)
  arcLight.position.set(0.6, 1.95, 0)
  const arcHalo = glow(2.0, 1.3)
  arcHalo.position.x = 0.6
  anim.lamps.push({ light: arcLight, base: 3, shadeMat: arcShade, halo: arcHalo })
  const arcBar = torus(0.6, 0.012, gold, Math.PI / 2)
  arcBar.rotation.z = Math.PI / 2
  const arcL = tag(grp(at(cyl(0.2, 0.22, 0.05, stone, 28), 0, 0.025, 0), at(cyl(0.015, 0.015, 1.6, gold, 8, false), 0, 0.85, 0), at(arcBar, 0.6, 1.6, 0), at(ball(0.16, arcShade), 0.6, 2.05, 0), arcLight, arcHalo), 'lamp')
  arcL.rotation.y = Math.PI
  put(B, 'arclamp', 'Arc floor lamp', arcL, 3.6, 0, -1.2)
  const disc = (r, h, m, y) => { const d = cyl(r, r, h, m, 32, false); d.rotation.x = Math.PI / 2; return at(d, 0, y, 0) }
  const archM = grp(
    at(box(0.84, 1.2, 0.05, brass, false), 0, 0.65, 0), disc(0.42, 0.05, brass, 1.25),
    at(box(0.74, 1.15, 0.06, mirrorM, false), 0, 0.675, 0.005), disc(0.37, 0.06, mirrorM, 1.25),
  )
  archM.rotation.y = -Math.PI / 2
  put(B, 'archmirror', 'Arched floor mirror', archM, 3.84, 0, -0.3)
  const flutes = grp()
  for (let i = 0; i < 25; i++) flutes.add(at(box(0.07, 3.0, 0.03, parts.wood, false), -1.44 + i * 0.12, 0, 0))
  put(B, 'fluted', 'Fluted wood wall panel', tag(flutes, 'wood'), 0.3, 1.65, -3.885, { parts: ['wood'] })
  const coveM = new THREE.MeshStandardMaterial({ color: '#fff3da', emissive: '#ffd9a0', emissiveIntensity: 1.2, roughness: 0.6 })
  const coveL = new THREE.PointLight('#ffd7a1', 2.5, 7, 1.6)
  coveL.position.set(0, -0.3, -2.8)
  const coveH = glow(-0.2, 3)
  anim.lamps.push({ light: coveL, base: 2.5, shadeMat: coveM, halo: coveH })
  put(B, 'cove', 'LED cove ceiling light', tag(grp(at(box(7.6, 0.06, 0.1, coveM, false), 0, 0, -3.84), at(box(0.1, 0.06, 7.6, coveM, false), 3.84, 0, 0), coveL, coveH), 'lamp'), 0, 3.9, 0)
  const photoTex = canvasTexture(256, 340, (g, w, h) => scenery(g, w, h))
  const pf = grp(
    tag(at(box(0.95, 1.25, 0.05, parts.wood), 0, 0, 0), 'wood'), at(box(0.99, 0.03, 0.06, gold, false), 0, 0.64, 0), at(box(0.99, 0.03, 0.06, gold, false), 0, -0.64, 0),
    at(box(0.84, 1.14, 0.01, mat('#f7f3ee', 0.8), false), 0, 0, 0.028),
    at(new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.0), new THREE.MeshStandardMaterial({ map: photoTex, roughness: 0.5 })), 0, 0, 0.036),
    at(box(0.5, 0.025, 0.025, gold, false), 0, 0.7, 0.06),
  )
  pf.rotation.y = Math.PI / 2
  put(B, 'photoframe', 'Photo frame', pf, -3.87, 1.75, 2.8, { parts: ['wood'] })
  put(B, 'plant', 'Plant', plant(4, 0.3, 0.6), 3.3, 0, 0.6)
  put(B, 'ac', 'Air conditioner', grp(
    at(rbox(1.0, 0.28, 0.2, wh, 0.06), 0, 0, 0), at(box(0.88, 0.02, 0.02, dark, false), 0, -0.1, 0.1),
    at(new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), new THREE.MeshBasicMaterial({ color: '#5ad17a' })), 0.4, 0.04, 0.1),
  ), 2.2, 3.25, -3.78)

  /* ---------------- kitchen ---------------- */
  const K = 'kitchen'
  const run = grp(at(box(6.6, 0.82, 0.6, parts.wood), 0, 0.41, 0), at(box(6.6, 0.08, 0.55, dark, false), 0, 0.04, 0.02))
  for (let i = 0; i < 11; i++) {
    const x = -3.0 + i * 0.6
    run.add(at(box(0.012, 0.7, 0.02, dark, false), x - 0.3, 0.45, 0.31), at(box(0.14, 0.02, 0.02, brass, false), x, 0.72, 0.32))
  }
  put(K, 'cabinets', 'Base cabinets & counter', tag(run, 'wood'), -0.6, 0, -3.6, { parts: ['wood'] })
  put(K, 'upper', 'Wall cabinets', tag(grp(
    at(box(2.5, 0.8, 0.35, parts.wood), -2.65, 2.3, 0), at(box(1.7, 0.8, 0.35, parts.wood), 1.85, 2.3, 0),
    at(box(0.012, 0.7, 0.02, dark, false), -2.65, 2.3, 0.18), at(box(0.012, 0.7, 0.02, dark, false), 1.85, 2.3, 0.18),
  ), 'wood'), 0, 0, -3.72, { parts: ['wood'] })
  const sinkBasin = mat('#8f9aa3', 0.3, { metalness: 0.6 })
  const sinkG = grp(at(box(0.7, 0.02, 0.45, dark, false), 0, 0.875, 0.02), tag(at(box(0.62, 0.01, 0.37, sinkBasin, false), 0, 0.887, 0.02), 'toggle'),
    tag(grp(at(cyl(0.02, 0.02, 0.3, steel, 10, false), 0, 1.0, -0.2), at(box(0.02, 0.02, 0.2, steel, false), 0, 1.15, -0.1)), 'toggle'))
  const sinkHit = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.45, 0.4), new THREE.MeshBasicMaterial({ visible: false }))
  sinkHit.position.set(0, 1.05, -0.08)
  sinkHit.userData.part = 'toggle'
  sinkG.add(sinkHit)
  const sinkWater = makeWater(sinkG, 0, 1.14, -0.01, 0.892)
  sinkWater(0, 0)
  anim.toggles.push({ root: sinkG, on: false, amt: 0, rate: 7, autoOff: 8, tip: (on) => (on ? 'Kitchen tap · click to turn the water off' : 'Kitchen tap · click to run the water'), apply: sinkWater })
  put(K, 'sink', 'Sink & tap (tap to run water)', sinkG, -1.8, 0, -3.6)
  const fWhite = mat('#eef1f3', 0.4)
  const fLed = new THREE.MeshStandardMaterial({ color: '#fffbe8', emissive: '#ffffff', emissiveIntensity: 0.9 })
  const fr = grp(
    at(box(0.9, 2.1, 0.03, steel), 0, 1.05, -0.36), at(box(0.03, 2.1, 0.75, steel), -0.435, 1.05, 0), at(box(0.03, 2.1, 0.75, steel), 0.435, 1.05, 0),
    at(box(0.9, 0.03, 0.75, steel), 0, 2.085, 0), at(box(0.9, 0.05, 0.75, steel), 0, 0.025, 0),
    at(box(0.84, 0.03, 0.7, fWhite, false), 0, 1.45, 0), at(box(0.84, 2.0, 0.01, fWhite, false), 0, 1.05, -0.34), at(box(0.02, 1.9, 0.01, fLed, false), 0.4, 1.05, -0.3),
  )
  for (const y of [0.45, 0.85, 1.2]) fr.add(at(box(0.82, 0.012, 0.66, glassM, false), 0, y, 0))
  fr.add(at(rbox(0.7, 0.2, 0.5, mat('#8fb56a', 0.5), 0.02, 2), 0, 0.16, 0))
  ;[['#f5f5f5', -0.3], ['#d9534f', -0.15]].forEach(([c, x]) => fr.add(at(box(0.09, 0.2, 0.09, mat(c, 0.6), false), x, 1.31, 0)))
  ;[-0.3, -0.18, -0.06, 0.06, 0.18, 0.3].forEach((x, i) => fr.add(at(cyl(0.035, 0.035, 0.26, mat(['#3b8f5a', '#e8c04a', '#c0392b', '#3b6ea5', '#e8c04a', '#3b8f5a'][i], 0.4), 14, false), x, 0.99, 0.05)))
  ;[-0.25, -0.1, 0.05, 0.2].forEach((x, i) => fr.add(at(ball(0.055, mat(['#c0392b', '#f08a24', '#8cb04a', '#c0392b'][i], 0.45)), x, 0.51, 0.05)))
  ;[-0.25, 0, 0.25].forEach((x, i) => fr.add(at(cyl(0.09, 0.09, 0.1, mat(['#f4b6c2', '#f7f2ea', '#c9a45c'][i], 0.6), 16, false), x, 1.88, 0.0)))
  fr.add(at(box(0.25, 0.03, 0.14, mat('#7fb8e6', 0.3), false), 0.25, 1.99, 0.1))
  const fridgeDoor = (y0, y1, handleY, shelves) => {
    const pv = new THREE.Group()
    pv.position.set(0.45, 0, 0.375)
    const h = y1 - y0
    const d = grp(at(box(0.9, h, 0.06, steel), -0.45, (y0 + y1) / 2, 0), at(box(0.025, Math.min(0.55, h * 0.6), 0.04, dark, false), -0.82, handleY, 0.05))
    for (const sy of shelves) {
      d.add(at(box(0.78, 0.015, 0.1, fWhite, false), -0.45, sy, -0.09))
      for (let i = 0; i < 4; i++) d.add(at(cyl(0.03, 0.03, 0.2, mat(['#3b8f5a', '#e8c04a', '#c0392b', '#3b6ea5'][i], 0.4), 12, false), -0.17 - i * 0.2, sy + 0.11, -0.09))
    }
    tag(d, 'toggle')
    pv.add(d)
    fr.add(pv)
    return pv
  }
  const frzDoor = fridgeDoor(1.47, 2.08, 1.55, [])
  const fgDoor = fridgeDoor(0.06, 1.43, 0.75, [0.4, 0.8])
  for (const [pv, name] of [[frzDoor, 'Freezer door'], [fgDoor, 'Fridge door']]) {
    anim.toggles.push({ root: pv, on: false, amt: 0, rate: 3, tip: (on) => `${name} · click to ${on ? 'close' : 'open'}`, apply: (amt) => { pv.rotation.y = amt * 1.55 } })
  }
  put(K, 'fridge', 'Fridge & freezer (tap doors)', fr, 3.46, 0, -3.5)

  /* ---- oven + air fryer (tap to switch their lights on / off) ---- */
  const blk = new THREE.MeshStandardMaterial({ color: '#25282c', roughness: 0.35, metalness: 0.6 })
  const ovenGlow = new THREE.MeshStandardMaterial({ color: '#1a1208', emissive: '#ffa63d', emissiveIntensity: 0 })
  const ovenDisp = new THREE.MeshStandardMaterial({ color: '#111', emissive: '#7dffb0', emissiveIntensity: 0 })
  const ovenLight = new THREE.PointLight('#ffb866', 0, 1.8, 1.6)
  ovenLight.position.set(-0.06, 0.2, 0.4)
  const ovenG = grp(
    at(rbox(0.56, 0.36, 0.42, blk, 0.03), 0, 0.18, 0), at(box(0.36, 0.24, 0.012, ovenGlow, false), -0.06, 0.18, 0.215),
    at(flat(ball(0.07, mat('#8a5a2b', 0.6)), 1.5, 0.7, 0.1), -0.06, 0.12, 0.224),
    at(box(0.36, 0.24, 0.004, mat('#0a0a0a', 0.05, { transparent: true, opacity: 0.35 }), false), -0.06, 0.18, 0.222),
    at(box(0.4, 0.015, 0.02, steel, false), -0.06, 0.33, 0.235),
    at(box(0.07, 0.03, 0.005, ovenDisp, false), 0.22, 0.3, 0.212), ovenLight,
  )
  for (const y of [0.1, 0.17, 0.24]) ovenG.add(at(box(0.34, 0.006, 0.004, dark, false), -0.06, y, 0.226))
  for (const y of [0.2, 0.1]) { const k = cyl(0.025, 0.025, 0.02, steel, 12, false); k.rotation.x = Math.PI / 2; ovenG.add(at(k, 0.22, y, 0.22)) }
  tag(ovenG, 'toggle')
  lightToggle(ovenG, 'Oven', [[ovenGlow, 1.8], [ovenDisp, 1.5]], ovenLight, 1.1)
  put(K, 'oven', 'Oven (tap for light)', ovenG, 1.6, 0.9, -3.6)

  const afGlow = new THREE.MeshStandardMaterial({ color: '#1a1208', emissive: '#ff9a3c', emissiveIntensity: 0 })
  const afDisp = new THREE.MeshStandardMaterial({ color: '#111', emissive: '#ffd27a', emissiveIntensity: 0 })
  const afLight = new THREE.PointLight('#ff9a3c', 0, 1.4, 1.6)
  afLight.position.set(0, 0.2, 0.4)
  const afWin = cyl(0.07, 0.07, 0.01, afGlow, 24, false)
  afWin.rotation.x = Math.PI / 2
  const afG = grp(
    at(rbox(0.3, 0.34, 0.36, blk, 0.1), 0, 0.17, 0), at(afWin, 0, 0.2, 0.185), at(rbox(0.18, 0.03, 0.05, steel, 0.01, 2), 0, 0.08, 0.2),
    at(box(0.12, 0.04, 0.005, afDisp, false), 0, 0.31, 0.182), afLight,
  )
  for (const x of [-0.09, 0.09]) { const k = cyl(0.02, 0.02, 0.02, steel, 12, false); k.rotation.x = Math.PI / 2; afG.add(at(k, x, 0.31, 0.185)) }
  tag(afG, 'toggle')
  lightToggle(afG, 'Air fryer', [[afGlow, 1.8], [afDisp, 1.5]], afLight, 0.9)
  put(K, 'airfryer', 'Air fryer (tap for light)', afG, 2.3, 0.9, -3.62)

  /* ---- Kent RO water purifier: tap to dispense water ---- */
  const kentTex = canvasTexture(256, 128, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h)
    g.fillStyle = '#1b6fb8'; g.font = 'bold 56px Arial'; g.textAlign = 'center'; g.fillText('KENT', w / 2, 72)
    g.fillStyle = '#556'; g.font = '20px Arial'; g.fillText('RO · UV · UF', w / 2, 106)
  })
  const roLed = new THREE.MeshStandardMaterial({ color: '#0a2a4a', emissive: '#3fa9ff', emissiveIntensity: 0.6 })
  const roG = grp(
    at(rbox(0.3, 0.5, 0.2, mat('#f4f6f8', 0.35), 0.04), 0, 0, 0), at(rbox(0.3, 0.08, 0.2, mat('#1b6fb8', 0.4), 0.03), 0, 0.21, 0),
    at(new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.12), new THREE.MeshStandardMaterial({ map: kentTex, roughness: 0.6 })), 0, 0.03, 0.102),
    at(box(0.03, 0.02, 0.01, roLed, false), 0.1, -0.12, 0.103), at(cyl(0.02, 0.02, 0.05, steel, 12, false), 0, -0.26, 0.07),
  )
  const roHit = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.3), new THREE.MeshBasicMaterial({ visible: false }))
  roHit.position.set(0, -0.15, 0.05)
  roG.add(roHit)
  tag(roG, 'toggle')
  const roWater = makeWater(roG, 0, -0.285, 0.07, -0.575)
  const roApply = (amt, t) => { roWater(amt, t); roLed.emissiveIntensity = 0.6 + 1.4 * amt }
  roApply(0, 0)
  anim.toggles.push({ root: roG, on: false, amt: 0, rate: 7, autoOff: 6, tip: (on) => (on ? 'Kent RO · click to stop water' : 'Kent RO · click to dispense water'), apply: roApply })
  put(K, 'ro', 'Kent RO purifier (tap)', roG, -1.28, 1.45, -3.68)

  /* ---- bartan (utensil) stand, spice rack, mixer, kettle, toaster, board, dustbin ---- */
  const bs = grp()
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) bs.add(at(cyl(0.012, 0.012, 0.7, steel, 8, false), x * 0.22, 0.35, z * 0.2))
  for (const y of [0.04, 0.33, 0.62]) bs.add(at(box(0.5, 0.015, 0.44, steel, false), 0, y, 0))
  bs.add(at(cyl(0.12, 0.12, 0.16, steel, 20), -0.1, 0.13, 0), at(cyl(0.125, 0.125, 0.02, steel, 20, false), -0.1, 0.22, 0), at(cyl(0.1, 0.1, 0.12, steel, 20), 0.14, 0.11, 0.02))
  for (let i = 0; i < 4; i++) bs.add(at(cyl(0.12, 0.12, 0.012, wh, 20, false), -0.1 + (i % 2) * 0.02, 0.345 + i * 0.012, -0.02), at(cyl(0.085, 0.05, 0.07, mat('#d9a68c', 0.5), 16, false), 0.13 + (i % 2) * 0.05, 0.38, -0.1 + Math.floor(i / 2) * 0.17))
  for (let i = 0; i < 6; i++) bs.add(at(cyl(0.032, 0.026, 0.09, glassM, 12, false), -0.17 + (i % 3) * 0.085, 0.67, -0.12 + Math.floor(i / 3) * 0.18))
  bs.add(at(cyl(0.13, 0.13, 0.02, steel, 24, false), 0.12, 0.64, 0.05))
  put(K, 'bartanstand', 'Bartan (utensil) stand', bs, -3.4, 0.87, -3.6)

  const spiceShelf = grp(at(box(0.7, 0.025, 0.12, parts.wood, false), 0, 0, 0), at(box(0.025, 0.1, 0.1, brass, false), -0.3, -0.06, 0), at(box(0.025, 0.1, 0.1, brass, false), 0.3, -0.06, 0))
  ;['#c0392b', '#e8c04a', '#8a6f5a', '#5f7662', '#d9a08c', '#b5654a'].forEach((c, i) => spiceShelf.add(at(cyl(0.035, 0.035, 0.1, mat(c, 0.6), 14, false), -0.28 + i * 0.112, 0.062, 0), at(cyl(0.037, 0.037, 0.015, gold, 14, false), -0.28 + i * 0.112, 0.12, 0)))
  put(K, 'spices', 'Spice rack (masala)', spiceShelf, -2.6, 1.45, -3.82)

  const mixer = grp(at(cyl(0.1, 0.12, 0.2, mat('#b83b2e', 0.4), 20), 0, 0.1, 0), at(cyl(0.09, 0.1, 0.24, glassM, 20, false), 0, 0.32, 0), at(cyl(0.095, 0.095, 0.02, steel, 20, false), 0, 0.45, 0), at(cyl(0.02, 0.02, 0.03, steel, 10, false), 0.08, 0.12, 0.09))
  put(K, 'mixer', 'Mixer grinder', mixer, -0.2, 0.87, -3.62)
  const kettle = grp(at(cyl(0.095, 0.095, 0.03, blk, 20, false), 0, 0.015, 0), at(cyl(0.08, 0.095, 0.2, steel, 20), 0, 0.13, 0), at(cyl(0.04, 0.08, 0.04, blk, 20, false), 0, 0.25, 0))
  const kh = torus(0.06, 0.008, blk, Math.PI)
  kh.rotation.z = -Math.PI / 2
  kettle.add(at(kh, 0.09, 0.15, 0))
  put(K, 'kettle', 'Electric kettle', kettle, 1.06, 0.87, -3.6)
  const toaster = grp(at(rbox(0.28, 0.18, 0.16, steel, 0.05), 0, 0.09, 0), at(box(0.2, 0.01, 0.02, dark, false), -0.02, 0.185, -0.03), at(box(0.2, 0.01, 0.02, dark, false), -0.02, 0.185, 0.03), at(box(0.02, 0.04, 0.03, blk, false), 0.15, 0.1, 0))
  const board = grp(at(rbox(0.4, 0.025, 0.28, mat('#c9a06c', 0.7), 0.01, 2), 0, 0.0125, 0), at(rbox(0.12, 0.2, 0.1, parts.wood, 0.01, 2), 0.28, 0.1, 0))
  for (let i = 0; i < 3; i++) board.add(at(box(0.012, 0.05, 0.1, dark, false), 0.25 + i * 0.03, 0.22, 0))
  put(K, 'toaster', 'Toaster', toaster, -0.55, 0.93, -0.7)
  put(K, 'board', 'Chopping board & knife block', board, -0.05, 0.93, -0.6)
  const bin = grp(at(cyl(0.15, 0.13, 0.4, mat('#4a4f55', 0.4), 20), 0, 0.2, 0), at(cyl(0.16, 0.16, 0.03, steel, 20, false), 0, 0.415, 0), at(box(0.1, 0.02, 0.05, dark, false), 0, 0.02, 0.17))
  put(K, 'dustbin', 'Dustbin', bin, -3.5, 0, -2.9)
  const bowl = at(cyl(0.2, 0.12, 0.09, mat('#efe6d6', 0.5), 24), 0.5, 0.97, 0)
  put(K, 'island', 'Island', grp(
    tag(at(box(2.4, 0.88, 0.9, parts.wood), 0, 0.44, 0), 'wood'), tag(at(box(2.6, 0.05, 1.1, stone), 0, 0.905, 0), 'slab'),
    bowl, at(sph(0.06, '#c0785a'), 0.45, 1.06, 0), at(sph(0.06, '#c9a45c'), 0.55, 1.06, 0.05), at(sph(0.06, '#7d8b76'), 0.5, 1.1, -0.04),
  ), 0.2, 0, -0.7, { parts: ['wood', 'slab'] })
  const stool = (x) => grp(
    at(cyl(0.2, 0.2, 0.07, parts.sofa, 24), x, 0.64, 0),
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => at(cyl(0.02, 0.02, 0.62, parts.wood, 8, false), x + a * 0.12, 0.31, b * 0.12)),
  )
  put(K, 'stools', 'Bar stools', tag(grp(stool(-0.8), stool(0), stool(0.8)), 'sofa'), 0.2, 0, 0.3, { parts: ['sofa'] })
  const pShade = shadeMat()
  const pLight = new THREE.PointLight('#ffd7a1', 4, 6, 1.6)
  pLight.position.set(0, 2.3, 0)
  const pHalo = glow(2.45, 1.8)
  anim.lamps.push({ light: pLight, base: 4, shadeMat: pShade, halo: pHalo })
  const pend = grp(pLight, pHalo)
  for (const x of [-0.8, 0, 0.8]) pend.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, 0.22, 24, 1, true), pShade), x, 2.55, 0), at(cyl(0.006, 0.006, 1.5, dark, 6, false), x, 3.3, 0))
  put(K, 'pendants', 'Pendant lights', tag(pend, 'lamp'), 0.2, 0, -0.7)
  put(K, 'plant', 'Plant', plant(6, 0.24, 0.45), 3.4, 0, 0.3)
  put(K, 'slab', 'Counter slab', tag(box(6.7, 0.05, 0.66, stone), 'slab'), -0.6, 0.845, -3.58, { parts: ['slab'] })
  const knob = (x) => { const k = cyl(0.025, 0.025, 0.03, steel, 12, false); k.rotation.x = Math.PI / 2; return at(k, x, 0.9, 0.23) }
  put(K, 'stove', 'Gas stove (chulha)', grp(
    at(box(0.78, 0.05, 0.44, dark), 0, 0.895, 0),
    ...[-0.2, 0.2].flatMap((x) => [at(cyl(0.1, 0.1, 0.02, steel, 24, false), x, 0.925, 0), at(cyl(0.05, 0.05, 0.03, dark, 16, false), x, 0.94, 0), knob(x)]),
  ), 0.5, 0, -3.6)
  put(K, 'cookware', 'Pots & kadhai', grp(
    at(cyl(0.13, 0.13, 0.16, steel, 24), -0.2, 1.0, 0), at(cyl(0.14, 0.14, 0.02, steel, 24, false), -0.2, 1.09, 0),
    at(cyl(0.18, 0.1, 0.1, dark, 28), 0.2, 0.98, 0), at(box(0.2, 0.02, 0.03, dark, false), 0.45, 0.99, 0),
  ), 0.5, 0, -3.6)
  put(K, 'exhaust', 'Exhaust chimney', grp(at(box(0.9, 0.12, 0.45, steel), 0, 2.25, -0.08), at(box(0.3, 1.4, 0.25, steel), 0, 3.0, -0.18), at(box(0.6, 0.02, 0.3, dark, false), 0, 2.18, -0.05)), 0.5, 0, -3.6)
  put(K, 'cylinder', 'Gas cylinder', grp(at(cyl(0.15, 0.15, 0.5, mat('#b83b2e', 0.5), 20), 0, 0.28, 0), at(cyl(0.08, 0.1, 0.08, steel, 12, false), 0, 0.57, 0), at(cyl(0.03, 0.03, 0.1, dark, 8, false), 0, 0.65, 0)), 2.86, 0, -3.55)
  put(K, 'jars', 'Storage jars', grp(...[[-0.25, '#d8cbb8'], [0, '#b5654a'], [0.25, '#7d8b76']].map(([x, c]) => at(cyl(0.07, 0.07, 0.2, mat(c, 0.6), 20), x, 0.1, 0))), -0.75, 0.87, -3.72)
  const rack = grp(at(box(0.5, 0.03, 0.3, steel, false), 0, 0.015, 0), at(cyl(0.04, 0.035, 0.08, mat('#d9a68c', 0.5), 16, false), 0.32, 0.04, 0.05))
  for (let i = 0; i < 6; i++) { const pl = cyl(0.12, 0.12, 0.012, wh, 20, false); pl.rotation.z = Math.PI / 2; rack.add(at(pl, -0.2 + i * 0.08, 0.15, 0)) }
  put(K, 'dishrack', 'Plate rack', rack, -2.7, 0.87, -3.65)
  const rail = grp(at((() => { const r = cyl(0.012, 0.012, 0.7, steel, 8, false); r.rotation.z = Math.PI / 2; return r })(), 0, 0, 0))
  for (let i = 0; i < 5; i++) rail.add(at(cyl(0.008, 0.008, 0.35, steel, 6, false), -0.28 + i * 0.14, -0.2, 0), at(cyl(0.045, 0.03, 0.04, steel, 12, false), -0.28 + i * 0.14, -0.4, 0))
  put(K, 'utensils', 'Hanging ladles', rail, -0.7, 1.55, -3.85)

  /* ---------------- dining room ---------------- */
  const D = 'dining'
  const water = mat('#8ec5e0', 0.1, { transparent: true, opacity: 0.55, depthWrite: false })
  const plateM = mat('#f8f6f1', 0.25)

  /* fancy dining table: gold-trimmed top, apron and turned legs */
  const dtable = grp(
    at(box(2.6, 0.05, 1.06, parts.wood), 0, 0.755, 0),
    at(box(2.44, 0.1, 0.9, parts.wood), 0, 0.68, 0),
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].flatMap(([a, b]) => [
      at(cyl(0.05, 0.028, 0.62, parts.wood, 16), a * 1.1, 0.31, b * 0.38),
      at(ball(0.06, parts.wood), a * 1.1, 0.56, b * 0.38),
    ]),
  )
  tag(dtable, 'wood')
  dtable.add(at(box(2.64, 0.012, 1.1, gold, false), 0, 0.728, 0))
  // runner
  const runnerM = mat('#7a2e3a', 0.85)
  dtable.add(at(box(2.1, 0.006, 0.3, runnerM, false), 0, 0.783, 0), at(box(2.1, 0.007, 0.008, gold, false), 0, 0.784, 0.15), at(box(2.1, 0.007, 0.008, gold, false), 0, 0.784, -0.15))

  // place settings: plate, fork, spoon, water glass (one per chair)
  const chairs = [[-0.8, -0.8, 0], [0.8, -0.8, 0], [-0.8, 0.8, Math.PI], [0.8, 0.8, Math.PI], [-1.65, 0, Math.PI / 2], [1.65, 0, -Math.PI / 2]]
  for (const [cx, cz, r] of chairs) {
    const s = new THREE.Group()
    s.add(at(cyl(0.165, 0.165, 0.006, gold, 28, false), 0, 0.003, 0), at(cyl(0.15, 0.11, 0.016, plateM, 28, false), 0, 0.012, 0), at(cyl(0.09, 0.085, 0.004, mat('#ece7dd', 0.3), 24, false), 0, 0.021, 0))
    // fork (left) and spoon (right)
    s.add(at(box(0.016, 0.004, 0.12, gold, false), -0.23, 0.002, 0.02), at(box(0.022, 0.004, 0.02, gold, false), -0.23, 0.002, -0.05))
    for (const dx of [-0.008, 0, 0.008]) s.add(at(box(0.004, 0.004, 0.04, gold, false), -0.23 + dx, 0.002, -0.08))
    s.add(at(box(0.012, 0.004, 0.11, gold, false), 0.23, 0.002, 0.03), at(flat(ball(0.022, gold), 1, 0.2, 1.5), 0.23, 0.003, -0.06))
    // water glass
    const glass = new THREE.Group()
    glass.add(at(cyl(0.032, 0.026, 0.1, glassM, 16, false), 0, 0.05, 0), at(cyl(0.029, 0.025, 0.065, water, 16, false), 0, 0.034, 0))
    s.add(at(glass, 0.2, 0, 0.22))
    s.position.set(cx + Math.sin(r) * 0.5, 0.78, cz + Math.cos(r) * 0.5)
    s.rotation.y = r
    dtable.add(s)
  }

  // flower pot
  const fp = new THREE.Group()
  fp.add(at(cyl(0.075, 0.055, 0.17, mat('#2f5d7a', 0.35), 20), 0, 0.085, 0), at(cyl(0.077, 0.077, 0.012, gold, 20, false), 0, 0.17, 0))
  const blooms = [['#e58fa5', -0.05, 0.4, 0.02], ['#f3d36b', 0.06, 0.36, -0.03], ['#f7f2ea', 0.0, 0.46, 0.0], ['#d9627d', 0.07, 0.3, 0.05], ['#f3d36b', -0.07, 0.3, -0.04], ['#e58fa5', 0.02, 0.33, 0.07]]
  for (const [c, x, y, z] of blooms) {
    const st = cyl(0.004, 0.004, y - 0.15, mat('#4f7a4a', 0.8), 6, false)
    st.position.set(x * 0.5, 0.15 + (y - 0.15) / 2, z * 0.5)
    st.rotation.z = -x * 2.2
    st.rotation.x = z * 2.2
    fp.add(st, at(ball(0.035, mat(c, 0.6)), x, y, z), at(flat(ball(0.05, mat('#5f8f58', 0.8)), 1, 0.25, 0.6), x * 0.7 + 0.03, 0.22, z))
  }
  fp.position.set(-0.45, 0.78, 0)
  dtable.add(fp)

  // water jug
  const jug = new THREE.Group()
  jug.add(at(cyl(0.06, 0.075, 0.2, glassM, 20, false), 0, 0.1, 0), at(cyl(0.056, 0.07, 0.15, water, 20, false), 0, 0.078, 0), at(cyl(0.062, 0.062, 0.012, gold, 20, false), 0, 0.2, 0))
  const handle = torus(0.05, 0.008, glassM, Math.PI)
  handle.rotation.z = -Math.PI / 2
  jug.add(at(handle, 0.062, 0.12, 0))
  jug.position.set(-0.17, 0.78, 0.04)
  dtable.add(jug)

  // spoon stand
  const spoonStand = new THREE.Group()
  spoonStand.add(at(cyl(0.05, 0.042, 0.1, steel, 20), 0, 0.05, 0), at(cyl(0.052, 0.052, 0.01, gold, 20, false), 0, 0.1, 0))
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const it = new THREE.Group()
    it.add(at(cyl(0.004, 0.004, 0.17, gold, 6, false), 0, 0.085, 0), at(flat(ball(0.02, gold), 1, 1.4, 0.3), 0, 0.18, 0))
    it.position.set(Math.cos(a) * 0.015, 0.09, Math.sin(a) * 0.015)
    it.rotation.set(Math.sin(a) * 0.22, 0, -Math.cos(a) * 0.22)
    spoonStand.add(it)
  }
  spoonStand.position.set(0.1, 0.78, -0.02)
  dtable.add(spoonStand)

  // fruit basket
  const basket = new THREE.Group()
  const wicker = mat('#a67c4e', 0.9)
  basket.add(at(cyl(0.17, 0.11, 0.1, wicker, 24), 0, 0.05, 0), at(cyl(0.162, 0.162, 0.004, mat('#3a2a1e', 0.9), 24, false), 0, 0.099, 0))
  for (const y of [0.025, 0.055, 0.085]) basket.add(at(flat(torus(0.14 + y * 0.35, 0.006, mat('#7d5a33', 0.9)), 1, 1, 1), 0, y, 0)).children.at(-1).rotation.x = Math.PI / 2
  const rim = torus(0.17, 0.01, gold)
  rim.rotation.x = Math.PI / 2
  basket.add(at(rim, 0, 0.1, 0))
  const fruit = [['#c0392b', -0.07, 0.14, 0.02, 0.055], ['#d6402f', 0.07, 0.14, -0.03, 0.055], ['#f08a24', 0.0, 0.15, 0.09, 0.05], ['#8cb04a', -0.03, 0.16, -0.08, 0.05], ['#c0392b', 0.01, 0.2, 0.0, 0.05]]
  for (const [c, x, y, z, r] of fruit) basket.add(at(ball(r, mat(c, 0.45)), x, y, z))
  for (let i = 0; i < 8; i++) basket.add(at(ball(0.02, mat('#5b2a6e', 0.4)), 0.11 + (i % 3) * 0.028 - 0.03, 0.14 + (i % 2) * 0.03, 0.08 + Math.floor(i / 3) * 0.02))
  const banana = torus(0.1, 0.018, mat('#f2cf47', 0.5), 1.5)
  banana.rotation.set(Math.PI / 2, 0, 0.4)
  basket.add(at(banana, -0.02, 0.2, 0.0))
  basket.position.set(0.42, 0.78, 0)
  dtable.add(basket)
  put(D, 'table', 'Dining table & tableware', dtable, 0.2, 0, -0.6, { parts: ['wood'] })

  /* fancy upholstered chairs with gold studs */
  const dchair = (x, z, r) => {
    const g = grp(
      tag(at(rbox(0.5, 0.09, 0.5, parts.sofa, 0.04), 0, 0.47, 0), 'sofa'),
      tag(at(rbox(0.48, 0.62, 0.07, parts.sofa, 0.05), 0, 0.85, -0.2), 'sofa'),
      tag(at(box(0.5, 0.05, 0.5, parts.wood), 0, 0.4, 0), 'wood'),
      tag(at(rbox(0.56, 0.07, 0.06, parts.wood, 0.03), 0, 1.2, -0.23), 'wood'),
      ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => tag(at(cyl(b > 0 ? 0.026 : 0.022, 0.016, b > 0 ? 0.4 : 1.2, parts.wood, 10, false), a * 0.22, b > 0 ? 0.2 : 0.6, b * 0.22), 'wood')),
      tag(at(box(0.4, 0.02, 0.02, parts.wood, false), 0, 0.15, 0.22), 'wood'),
    )
    for (const sx of [-0.22, 0.22]) g.add(at(ball(0.028, gold), sx, 1.23, -0.22))
    for (const y of [0.58, 1.12]) for (let i = -2; i <= 2; i++) g.add(at(ball(0.012, gold), i * 0.09, y, -0.16))
    g.position.set(x, 0, z)
    g.rotation.y = r
    return g
  }
  put(D, 'chairs', 'Fancy chairs (6)', grp(...chairs.map(([cx, cz, r]) => dchair(cx, cz, r))), 0.2, 0, -0.6, { parts: ['sofa', 'wood'] })

  /* wash basin: tap it to run the water (stops on the next tap, or by itself after 8 s) */
  const waterRun = mat('#9ad0e8', 0.1, { transparent: true, opacity: 0.7, depthWrite: false })
  const vanity = tag(grp(at(box(0.9, 0.78, 0.45, parts.wood), 0, 0.39, 0), at(box(0.012, 0.66, 0.02, dark, false), 0, 0.39, 0.23), at(ball(0.025, gold), -0.07, 0.45, 0.245), at(ball(0.025, gold), 0.07, 0.45, 0.245)), 'wood')
  const basinBowl = tag(grp(at(cyl(0.2, 0.15, 0.06, wh, 32), 0, 0.84, 0.02), at(cyl(0.16, 0.16, 0.004, mat('#a9c3cf', 0.15), 32, false), 0, 0.865, 0.02)), 'toggle')
  const handles = [-0.06, 0.06].map((x) => at(cyl(0.012, 0.012, 0.03, steel, 8, false), x, 0.84, -0.16))
  const tapG = tag(grp(at(cyl(0.015, 0.015, 0.2, steel, 12, false), 0, 0.92, -0.16), at(box(0.02, 0.02, 0.13, steel, false), 0, 1.02, -0.1), ...handles), 'toggle')
  const tapHit = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.34), new THREE.MeshBasicMaterial({ visible: false }))
  tapHit.position.set(0, 0.95, -0.08)
  tapHit.userData.part = 'toggle'
  const stream = at(cyl(0.006, 0.006, 0.14, waterRun, 8, false), 0, 0.94, -0.04)
  stream.visible = false
  const rings = [0, 1].map(() => {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.002, 6, 24), new THREE.MeshBasicMaterial({ color: '#dff3fb', transparent: true, opacity: 0, depthWrite: false }))
    r.rotation.x = Math.PI / 2
    r.position.set(0, 0.869, -0.04)
    r.visible = false
    return r
  })
  const wb = grp(
    vanity, at(box(0.98, 0.04, 0.5, stone), 0, 0.8, 0), basinBowl, tapG, tapHit, stream, ...rings,
    at(cyl(0.025, 0.025, 0.1, gold, 14, false), 0.36, 0.87, -0.1), at(cyl(0.012, 0.012, 0.05, steel, 8, false), 0.36, 0.94, -0.1),
    at(rbox(0.2, 0.05, 0.12, linen, 0.02), -0.34, 0.845, 0.02),
  )
  const tapApply = (amt, t) => {
    const run = amt > 0.04
    stream.visible = run
    const wob = 1 + 0.25 * Math.sin(t * 45)
    stream.scale.set(wob, Math.max(amt, 0.01), wob)
    stream.position.y = 1.01 - 0.07 * amt
    rings.forEach((r, i) => {
      r.visible = run
      const ph = (t * 1.3 + i * 0.5) % 1
      r.scale.setScalar(0.4 + ph * 3.2)
      r.material.opacity = (1 - ph) * 0.7 * Math.min(1, amt * 2)
    })
    handles.forEach((h) => { h.rotation.y = amt * 1.4 })
  }
  tapApply(0, 0)
  anim.toggles.push({ root: wb, on: false, amt: 0, rate: 7, autoOff: 8, tip: (on) => (on ? 'Tap · click to turn the water off' : 'Tap · click to run the water'), apply: tapApply })
  put(D, 'washbasin', 'Wash basin', wb, 2.6, 0, -3.62, { parts: ['wood'] })
  put(D, 'sideboard', 'Sideboard', tag(grp(
    at(box(2.2, 0.85, 0.45, parts.wood), 0, 0.425, 0),
    ...[-0.37, 0.37].map((x) => at(box(0.012, 0.7, 0.02, dark, false), x, 0.43, 0.23)),
    ...[-0.55, -0.2, 0.2, 0.55].map((x) => at(box(0.12, 0.02, 0.02, brass, false), x, 0.65, 0.24)),
  ), 'wood'), 0.3, 0, -3.65, { parts: ['wood'] })
  put(D, 'lamp', 'Sideboard lamp', at(lampG(2), 0, 0, 0), -0.5, 0.85, -3.65)
  const dshade = shadeMat()
  const dlight = new THREE.PointLight('#ffd7a1', 5, 6, 1.6)
  dlight.position.set(0, 2.3, 0)
  const dhalo = glow(2.4, 1.8)
  anim.lamps.push({ light: dlight, base: 5, shadeMat: dshade, halo: dhalo })
  put(D, 'pendant', 'Pendant light', tag(grp(dlight, dhalo, at(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.5, 0.3, 32, 1, true), dshade), 0, 2.55, 0), at(cyl(0.006, 0.006, 1.5, dark, 6, false), 0, 3.3, 0)), 'lamp'), 0.2, 0, -0.6)
  const dframe = (x, k, w, h) => at(grp(tag(box(w, h, 0.05, parts.wood), 'wood'), at(new THREE.Mesh(new THREE.PlaneGeometry(w - 0.12, h - 0.12), new THREE.MeshStandardMaterial({ map: artTexture(k), roughness: 0.8 })), 0, 0, 0.03)), x, 0, 0)
  put(D, 'art', 'Wall art', grp(dframe(-0.8, 'sun', 0.75, 1.0), dframe(0, 'arch', 0.95, 1.3), dframe(0.8, 'lines', 0.75, 1.0)), 0.3, 2.45, -3.875)
  put(D, 'rug', 'Rug', tag(box(3.8, 0.03, 2.8, parts.rug, false), 'rug'), 0.2, 0.016, -0.6, { kind: 'grow', parts: ['rug'] })
  put(D, 'plant', 'Plant', plant(7, 0.3, 0.6), 3.3, 0, 0.5)
  const cr = grp(
    at(box(0.04, 2.0, 0.45, parts.wood), -0.58, 1.0, 0), at(box(0.04, 2.0, 0.45, parts.wood), 0.58, 1.0, 0), at(box(1.2, 2.0, 0.03, parts.wood), 0, 1.0, -0.21),
    at(box(1.2, 0.9, 0.45, parts.wood), 0, 0.45, 0), at(box(1.2, 0.04, 0.45, parts.wood), 0, 2.0, 0),
    at(box(1.12, 0.03, 0.4, parts.wood), 0, 1.3, 0), at(box(1.12, 0.03, 0.4, parts.wood), 0, 1.65, 0),
    at(box(0.012, 0.8, 0.02, dark, false), 0, 0.45, 0.23), at(box(1.12, 1.05, 0.02, glassM, false), 0, 1.47, 0.225),
  )
  for (const x of [-0.3, 0.3]) {
    for (let k = 0; k < 4; k++) cr.add(at(cyl(0.15, 0.15, 0.015, wh, 24, false), x, 0.93 + k * 0.02, 0))
    cr.add(at(cyl(0.12, 0.06, 0.07, wh, 20, false), x, 1.35, 0), at(cyl(0.04, 0.035, 0.1, mat('#cfe0e8', 0.1), 12, false), x, 1.72, 0))
  }
  put(D, 'crockery', 'Crockery cabinet', tag(cr, 'wood'), -2.7, 0, -3.65, { parts: ['wood'] })
  const dm = grp(at(cyl(0.45, 0.45, 0.04, brass, 40, false), 0, 0, 0), at(cyl(0.41, 0.41, 0.05, mirrorM, 40, false), 0, 0, 0))
  dm.rotation.x = Math.PI / 2
  put(D, 'mirror', 'Round mirror', grp(dm), 2.6, 1.9, -3.86)
  const flShade = shadeMat()
  const flLight = new THREE.PointLight('#ffd7a1', 4, 6, 1.6)
  flLight.position.y = 1.6
  const flHalo = glow(1.75, 2)
  anim.lamps.push({ light: flLight, base: 4, shadeMat: flShade, halo: flHalo })
  put(D, 'floorlamp', 'Floor lamp', tag(grp(at(cyl(0.2, 0.22, 0.04, brass, 24), 0, 0.02, 0), at(cyl(0.025, 0.025, 1.6, brass, 12, false), 0, 0.82, 0), at(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.4, 28, 1, true), flShade), 0, 1.75, 0), flLight, flHalo), 'lamp'), 3.6, 0, -3.3)

  {
  /* ---------------- office ---------------- */
  const O = 'office'
  const ofScreen = new THREE.MeshStandardMaterial({ color: '#0b1118', roughness: 0.15, metalness: 0.2, emissive: '#6fb7ff', emissiveIntensity: 1 })
  const lapScreen = new THREE.MeshStandardMaterial({ color: '#0b1118', roughness: 0.15, metalness: 0.2, emissive: '#9ad0ff', emissiveIntensity: 1 })
  const ofLed = new THREE.MeshStandardMaterial({ color: '#220000', emissive: '#ff3b30', emissiveIntensity: 0 })
  const ofShade = mat('#f1e7d3', 0.7, { emissive: '#ffd9a0', emissiveIntensity: 0 })
  const paper = mat('#f7f4ee', 0.8)
  const mkChair = () => {
    const c = grp(
      at(box(0.5, 0.09, 0.48, parts.sofa), 0, 0.5, 0),
      at(box(0.46, 0.6, 0.07, parts.sofa), 0, 0.88, 0.22),
      at(box(0.07, 0.04, 0.32, blk), -0.28, 0.66, 0.02), at(box(0.07, 0.04, 0.32, blk), 0.28, 0.66, 0.02),
      at(cyl(0.025, 0.025, 0.32, blk, 10), 0, 0.3, 0),
      ...[0, 1, 2, 3, 4].map((i) => { const a = (i / 5) * Math.PI * 2; const l = at(box(0.3, 0.025, 0.04, blk), Math.cos(a) * 0.15, 0.1, Math.sin(a) * 0.15); l.rotation.y = -a; return l }),
    )
    return tag(c, 'sofa')
  }

  /* executive desk with drawer pedestal, against the back wall */
  const desk = grp(
    at(box(1.9, 0.05, 0.8, parts.wood), 0, 0.745, 0),
    at(box(1.9, 0.012, 0.8, gold, false), 0, 0.716, 0),
    ...[-0.9, 0.9].map((x) => at(box(0.05, 0.72, 0.7, parts.wood), x, 0.36, 0)),
    at(box(1.76, 0.5, 0.02, parts.wood), 0, 0.5, -0.33),
    at(box(0.5, 0.62, 0.66, parts.wood), 0.62, 0.4, 0),
    ...[0.2, 0.42, 0.62].map((y) => at(box(0.42, 0.015, 0.012, gold, false), 0.62, y, 0.335)),
  )
  tag(desk, 'wood')
  put(O, 'desk', 'Desk with drawers', desk, 0, 0, -3.35, { parts: ['wood'] })

  /* desktop: monitor + keyboard + mouse (tap the screen to switch it on / off) */
  const monitor = grp(
    at(box(0.82, 0.48, 0.03, blk), 0, 1.07, 0),
    at(new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.43), ofScreen), 0, 1.07, 0.017),
    at(box(0.015, 0.015, 0.004, ofLed, false), 0.34, 0.84, 0.017),
    at(cyl(0.025, 0.03, 0.2, blk, 12), 0, 0.88, -0.02),
    at(box(0.3, 0.012, 0.18, blk), 0, 0.776, -0.02),
  )
  tag(monitor, 'toggle')
  const ofApply = (amt) => { ofScreen.emissiveIntensity = amt; ofLed.emissiveIntensity = 1 - amt }
  ofApply(1)
  anim.toggles.push({ root: monitor, on: true, amt: 1, rate: 6, tip: (on) => `Desktop monitor · click to switch ${on ? 'off' : 'on'}`, apply: ofApply })
  put(O, 'monitor', 'Desktop monitor, keyboard & mouse (tap screen)', grp(monitor, at(rbox(0.44, 0.015, 0.14, blk, 0.005), 0, 0.78, 0.26), at(rbox(0.06, 0.02, 0.1, blk, 0.01), 0.36, 0.78, 0.26)), 0, 0, -3.35)
  const tower = grp(at(rbox(0.2, 0.44, 0.42, blk, 0.015), 0, 0.22, 0), at(box(0.012, 0.3, 0.01, ledM, false), 0.101, 0.24, 0.12), at(cyl(0.02, 0.02, 0.01, gold, 12, false), 0, 0.38, 0.215))
  put(O, 'tower', 'Desktop PC tower', tower, -1.2, 0, -3.4)

  /* desk lamp (tap to light the shade) */
  const ofLamp = grp(at(cyl(0.08, 0.09, 0.02, gold, 20), 0, 0.01, 0), at(cyl(0.01, 0.01, 0.4, gold, 8, false), 0, 0.21, 0), at(cyl(0.05, 0.11, 0.13, ofShade, 20, false), 0.04, 0.46, 0))
  tag(ofLamp, 'toggle')
  lightToggle(ofLamp, 'Desk lamp', [[ofShade, 1.6]], null, 0)
  put(O, 'lamp', 'Desk lamp (tap)', ofLamp, 0.82, 0.77, -3.55)

  /* pen stand, notebook, sticky notes and a mug on the desk */
  const penStand = grp(at(cyl(0.045, 0.045, 0.1, gold, 20, false), 0, 0.05, 0), at(cyl(0.04, 0.04, 0.01, dark, 20, false), 0, 0.099, 0))
  ;[['#2f4a5c', -0.02, 0.01, 0.1], ['#b5654a', 0.02, -0.01, -0.12], ['#c9a45c', 0, 0.02, 0.05], ['#25282c', 0.015, 0.015, -0.06]].forEach(([c, x, z, tilt], i) => {
    const pen = at(cyl(0.004, 0.004, 0.17, mat(c, 0.4), 6, false), x, 0.15, z)
    pen.rotation.z = tilt; pen.rotation.x = i * 0.05; penStand.add(pen)
  })
  const deskBits = grp(
    at(penStand, 0.45, 0, -0.1),
    at(rbox(0.2, 0.025, 0.27, mat('#7a2e3a', 0.6), 0.008), -0.5, 0.0125, 0.15),
    at(box(0.19, 0.003, 0.26, paper, false), -0.5, 0.027, 0.15),
    ...[['#f3d36b', 0], ['#f3b6c8', 0.045], ['#cfe6ee', 0.09]].map(([c, o]) => at(box(0.04, 0.004, 0.04, mat(c, 0.8), false), -0.68 + o, 0.003, -0.05)),
    at(cyl(0.035, 0.032, 0.09, mat('#efe6d6', 0.4), 16, false), -0.3, 0.045, -0.1),
  )
  put(O, 'penstand', 'Pen stand, notebook & mug', deskBits, 0, 0.77, -3.4)

  /* ergonomic desk chair (faces the desk) */
  const deskChair = mkChair()
  deskChair.rotation.y = 0.12 * Math.PI
  put(O, 'chair', 'Desk chair', deskChair, 0.1, 0, -2.5, { parts: ['sofa'] })

  /* meeting table, 6 chairs, laptops and table accessories */
  const mt = grp(
    at(box(1.9, 0.05, 0.95, parts.wood), 0, 0.74, 0),
    at(box(1.94, 0.012, 0.99, gold, false), 0, 0.712, 0),
    ...[-0.7, 0.7].map((x) => at(box(0.08, 0.7, 0.7, parts.wood), x, 0.36, 0)),
    at(box(1.4, 0.06, 0.05, parts.wood), 0, 0.3, 0),
  )
  tag(mt, 'wood')
  put(O, 'meetTable', 'Meeting table', mt, -0.1, 0, 0.1, { parts: ['wood'] })
  const meetChairs = grp()
  ;[[-0.55, -0.65, Math.PI], [0.35, -0.65, Math.PI], [-0.55, 0.85, 0], [0.35, 0.85, 0], [-1.35, 0.1, -Math.PI / 2], [1.15, 0.1, Math.PI / 2]].forEach(([x, z, r]) => { const c = mkChair(); c.position.set(x, 0, z); c.rotation.y = r; meetChairs.add(c) })
  put(O, 'meetChairs', 'Meeting chairs (6)', meetChairs, 0, 0, 0, { parts: ['sofa'] })
  const mkLaptop = () => {
    const l = grp(at(rbox(0.34, 0.016, 0.23, blk, 0.008), 0, 0.008, 0), at(rbox(0.24, 0.003, 0.1, mat('#3a3d42', 0.5), 0.004), 0, 0.017, 0.02))
    const lid = grp(at(rbox(0.34, 0.22, 0.012, blk, 0.008), 0, 0.115, 0), at(new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.19), lapScreen), 0, 0.115, 0.0075))
    lid.position.set(0, 0.016, -0.115); lid.rotation.x = -0.28
    l.add(lid)
    return l
  }
  const laptops = grp()
  ;[[-0.55, -0.12, Math.PI], [0.35, 0.3, 0]].forEach(([x, z, r]) => { const l = mkLaptop(); l.position.set(x, 0.775, z); l.rotation.y = r; laptops.add(l) })
  tag(laptops, 'toggle')
  const lapApply = (amt) => { lapScreen.emissiveIntensity = amt }
  lapApply(1)
  anim.toggles.push({ root: laptops, on: true, amt: 1, rate: 6, tip: (on) => `Laptop · click to switch ${on ? 'off' : 'on'}`, apply: lapApply })
  put(O, 'laptops', 'Laptops (tap screen)', laptops, -0.1, 0, 0.1)
  const tabletop = grp(
    at(cyl(0.07, 0.07, 0.03, blk, 24), 0, 0.015, 0),
    ...[[-0.7, -0.1], [0.5, -0.15], [0.55, 0.28]].map(([x, z]) => at(cyl(0.032, 0.026, 0.1, glassM, 16, false), x, 0.05, z)),
    at(penStand.clone(), -0.1, 0, 0.3),
    at(box(0.22, 0.004, 0.3, paper, false), 0.0, 0.002, -0.3), at(box(0.22, 0.004, 0.3, paper, false), -0.28, 0.002, 0.25),
  )
  put(O, 'tabletop', 'Table accessories', tabletop, -0.1, 0.77, 0.1)

  /* round discussion table with two stools */
  const rt = grp(at(cyl(0.45, 0.45, 0.04, parts.wood, 32), 0, 0.72, 0), at(cyl(0.04, 0.06, 0.7, parts.wood, 12), 0, 0.36, 0), at(cyl(0.25, 0.25, 0.03, parts.wood, 24), 0, 0.015, 0))
  tag(rt, 'wood')
  put(O, 'roundTable', 'Round discussion table', rt, 2.7, 0, 1.2, { parts: ['wood'] })
  const stool = (x, z) => tag(grp(at(cyl(0.17, 0.17, 0.06, parts.sofa, 24), x, 0.48, z), ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b]) => at(cyl(0.018, 0.012, 0.46, blk, 8, false), x + a * 0.1, 0.23, z + b * 0.1))), 'sofa')
  put(O, 'stools', 'Stools (2)', grp(stool(-0.7, 0), stool(0.7, 0)), 2.7, 0, 1.2, { parts: ['sofa'] })

  /* filing cabinet with printer */
  const cab = grp(at(box(0.52, 1.0, 0.56, dark), 0, 0.5, 0), ...[0.18, 0.5, 0.82].flatMap((y) => [at(box(0.46, 0.28, 0.01, parts.wood), 0, y, 0.285), at(box(0.18, 0.016, 0.02, gold, false), 0, y + 0.08, 0.3)]))
  const printer = grp(at(rbox(0.42, 0.17, 0.34, mat('#f2f0ec', 0.45), 0.02), 0, 0.085, 0), at(box(0.3, 0.012, 0.14, blk, false), 0, 0.17, 0.02), at(box(0.2, 0.003, 0.26, paper, false), 0, 0.19, -0.05), at(box(0.022, 0.012, 0.014, ofLed, false), 0.17, 0.12, 0.172))
  cab.add(at(printer, 0, 1.0, 0))
  tag(cab, 'wood')
  put(O, 'cabinet', 'Filing cabinet & printer', cab, 1.55, 0, -3.58, { parts: ['wood'] })

  /* bookshelf with books and a small plant, on the right wall */
  const ofShelf = grp(
    at(box(1.3, 2.0, 0.04, parts.wood), 0, 1.0, -0.16),
    ...[-0.65, 0.65].map((x) => at(box(0.04, 2.0, 0.36, parts.wood), x, 1.0, 0)),
    ...[0.02, 0.5, 0.95, 1.4, 1.98].map((y) => at(box(1.3, 0.035, 0.36, parts.wood), 0, y, 0)),
  )
  tag(ofShelf, 'wood')
  const bookCols = ['#7a2e3a', '#2f4a5c', '#c9a45c', '#5f7662', '#b5654a', '#3b3733']
  let bi = 0
  for (const y of [0.52, 0.97, 1.42]) for (let i = 0; i < 9; i++) {
    const h = 0.28 + ((i * 7 + y * 10) % 5) * 0.025
    ofShelf.add(at(box(0.05, h, 0.24, mat(bookCols[bi++ % 6], 0.7), false), -0.52 + i * 0.065, y + h / 2, 0))
  }
  const ofPot = makePlant({ potR: 0.09, potH: 0.14, leaves: 8, minH: 0.14, maxH: 0.3, seed: 31 })
  ofPot.group.position.set(0.4, 1.45, 0)
  ofShelf.add(ofPot.group)
  ofShelf.rotation.y = -Math.PI / 2
  put(O, 'shelf', 'Bookshelf', ofShelf, 3.7, 0, -1.2, { parts: ['wood'] })

  /* reading armchair + side table, rug and floor plant */
  const ofArm = grp(
    at(rbox(0.8, 0.3, 0.8, parts.sofa, 0.08), 0, 0.3, 0),
    at(rbox(0.8, 0.55, 0.16, parts.sofa, 0.08), 0, 0.62, 0.32),
    ...[-0.4, 0.4].map((x) => at(rbox(0.12, 0.3, 0.7, parts.sofa, 0.05), x, 0.5, 0)),
    ...[[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].map(([x, z]) => at(cyl(0.025, 0.018, 0.15, parts.wood, 8), x, 0.075, z)),
  )
  tag(ofArm, 'sofa')
  ofArm.rotation.y = Math.PI * 0.2
  put(O, 'armchair', 'Armchair', ofArm, -2.8, 0, -1.2, { parts: ['sofa'] })
  const ofSide = grp(at(cyl(0.22, 0.22, 0.025, parts.wood, 24), 0, 0.5, 0), at(cyl(0.02, 0.03, 0.5, parts.wood, 10), 0, 0.25, 0), at(cyl(0.12, 0.12, 0.02, parts.wood, 20), 0, 0.01, 0), at(cyl(0.05, 0.04, 0.09, mat('#efe6d6', 0.4), 16), 0.05, 0.56, 0))
  tag(ofSide, 'wood')
  put(O, 'side', 'Side table & mug', ofSide, -2.0, 0, -2.0, { parts: ['wood'] })
  put(O, 'rug', 'Rug', at(box(2.6, 0.012, 1.9, mat('#d8cbb8', 0.95), false), 0, 0.006, 0), -0.1, 0, 0.1, { parts: ['rug'], kind: 'grow' })
  const ofPlant = makePlant({ potR: 0.24, potH: 0.5, leaves: 12, minH: 0.5, maxH: 1.2, seed: 12 })
  put(O, 'plant', 'Floor plant', ofPlant.group, -3.45, 0, -3.45)

  /* whiteboard with markers */
  const wbT = mat('#f8f8f6', 0.25)
  const wboard = grp(at(box(1.7, 1.05, 0.04, brass), 0, 0, 0), at(box(1.6, 0.95, 0.045, wbT, false), 0, 0, 0.005), at(box(0.5, 0.03, 0.06, brass, false), -0.3, -0.5, 0.03))
  ;[['#2f4a5c', -0.55, 0.3, 0.5], ['#b5654a', -0.45, 0.15, 0.7], ['#5f7662', -0.5, 0.0, 0.4], ['#2f4a5c', 0.3, 0.3, 0.5], ['#7a2e3a', 0.2, 0.1, 0.35]].forEach(([c, x, y, w]) => wboard.add(at(box(w, 0.025, 0.004, mat(c, 0.5), false), x, y, 0.03)))
  ;[['#2f4a5c', 0.15], ['#b5654a', 0.1], ['#5f7662', 0.05]].forEach(([c, x]) => wboard.add(at(cyl(0.008, 0.008, 0.12, mat(c, 0.4), 8, false), -0.3 + x - 0.1, -0.475, 0.04)))
  wboard.children.slice(-3).forEach((m) => { m.rotation.z = Math.PI / 2 })
  put(O, 'whiteboard', 'Whiteboard', wboard, -2.05, 1.75, -3.875)

  /* pinboard with sticky notes */
  const pinB = grp(at(box(1.2, 0.8, 0.04, parts.wood), 0, 0, 0), at(box(1.12, 0.72, 0.045, mat('#b88a5a', 0.95), false), 0, 0, 0.005))
  ;[['#f3d36b', -0.4, 0.2], ['#f3b6c8', -0.1, 0.22], ['#cfe6ee', 0.25, 0.18], ['#b9d9a0', 0.42, -0.05], ['#f3d36b', -0.3, -0.15], ['#e8c6a6', 0.05, -0.18]].forEach(([c, x, y], i) => {
    const n = at(box(0.2, 0.2, 0.004, mat(c, 0.8), false), x, y, 0.03); n.rotation.z = (i - 2.5) * 0.04; pinB.add(n)
    pinB.add(at(ball(0.012, mat('#b5654a', 0.4)), x, y + 0.08, 0.036))
  })
  put(O, 'pinboard', 'Pinboard', pinB, 2.2, 1.85, -3.875)

  /* wall clock */
  const oClock = grp(at(cyl(0.2, 0.2, 0.04, brass, 32, false), 0, 0, 0), at(cyl(0.18, 0.18, 0.045, wh, 32, false), 0, 0, 0.003))
  oClock.rotation.x = Math.PI / 2
  const oClockW = grp(oClock)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    const tk = at(box(0.008, i % 3 === 0 ? 0.03 : 0.016, 0.004, dark, false), Math.sin(a) * 0.145, Math.cos(a) * 0.145, 0.029)
    tk.rotation.z = -a
    oClockW.add(tk)
  }
  const mkOHand = (len, w, color, z) => {
    const pivot = grp(at(box(w, len, 0.004, mat(color, 0.5), false), 0, len / 2 - 0.012, 0))
    pivot.position.z = z
    oClockW.add(pivot)
    return pivot
  }
  anim.officeClock = { hour: mkOHand(0.085, 0.012, '#2a2622', 0.031), min: mkOHand(0.125, 0.008, '#2a2622', 0.034), sec: mkOHand(0.14, 0.004, '#b5654a', 0.037) }
  oClockW.add(at(ball(0.012, mat('#b5654a', 0.4)), 0, 0, 0.038))
  put(O, 'wallclock', 'Wall clock', oClockW, 0, 2.35, -3.875)

  /* wall switch board (tap to flick the switches) */
  const swPlate = grp(at(rbox(0.17, 0.26, 0.014, wh, 0.01), 0, 0, 0), at(cyl(0.025, 0.025, 0.006, dark, 16, false), 0, -0.07, 0.008), at(box(0.012, 0.012, 0.006, ofLed, false), 0.06, 0.1, 0.008))
  swPlate.children[1].rotation.x = Math.PI / 2
  const rockers = [-0.045, 0.045].flatMap((x) => [0.075, 0.025].map((y) => at(box(0.04, 0.036, 0.012, mat('#e9e4da', 0.4), false), x, y, 0.012)))
  rockers.forEach((r) => swPlate.add(r))
  tag(swPlate, 'toggle')
  const swApply = (amt) => { rockers.forEach((r, i) => { r.rotation.x = (amt * 0.4) * (i % 2 ? -1 : 1) }); ofLed.emissiveIntensity = 1 - amt }
  swApply(0)
  anim.toggles.push({ root: swPlate, on: false, amt: 0, rate: 8, tip: (on) => `Switch board · click to flick ${on ? 'off' : 'on'}`, apply: swApply })
  put(O, 'switches', 'Wall switch board (tap)', swPlate, -3.55, 1.25, -3.885)
  }

  /* ---------------- living room: wall styling options (off by default) ---------------- */
  const L = 'living'
  const slats = grp()
  for (let i = 0; i < 48; i++) slats.add(at(box(0.07, 3.2, 0.03, parts.wood, false), -3.76 + i * 0.16, 0, 0))
  put(L, 'wallpanel', 'Wood slat wall panel', tag(slats, 'wood'), 0, 1.8, -3.885, { parts: ['wood'], hidden: true })
  const trimM = mat('#f7f2ea', 0.6)
  const mould = grp()
  for (const x of [-3.2, -1.6, 0, 1.6, 3.2]) {
    mould.add(at(box(1.4, 0.04, 0.02, trimM, false), x, 1.2, 0), at(box(1.4, 0.04, 0.02, trimM, false), x, -1.2, 0), at(box(0.04, 2.44, 0.02, trimM, false), x - 0.7, 0, 0), at(box(0.04, 2.44, 0.02, trimM, false), x + 0.7, 0, 0))
  }
  put(L, 'wallmoulding', 'Wall moulding frames', mould, 0, 1.9, -3.89, { hidden: true })
  const fs = grp()
  for (const y of [1.9, 2.4]) fs.add(tag(at(box(0.9, 0.04, 0.22, parts.wood), 0, y, 0), 'wood'))
  fs.add(at(rbox(0.3, 0.05, 0.2, mat('#7d8b76', 0.8), 0.01, 2), -0.25, 1.945, 0), at(rbox(0.26, 0.04, 0.18, mat('#c0785a', 0.8), 0.01, 2), -0.25, 1.99, 0), at(cyl(0.05, 0.07, 0.2, mat('#efe6d6', 0.5), 16), 0.25, 2.04, 0), at(rbox(0.3, 0.2, 0.15, mat('#3b4a5c', 0.8), 0.01, 2), -0.2, 2.52, 0), at(sph(0.07, '#c9a45c'), 0.2, 2.49, 0))
  put(L, 'wallshelves', 'Floating wall shelves', fs, -3.2, 0, -3.78, { parts: ['wood'], hidden: true })

  /* ---- living room: wall TV with console (tap the TV to switch it on / off) ---- */
  const tvTex = canvasTexture(512, 288, (g, w, h) => scenery(g, w, h))
  const tvScreen = new THREE.MeshStandardMaterial({ color: '#050607', roughness: 0.15, metalness: 0.2, emissive: '#ffffff', emissiveMap: tvTex, emissiveIntensity: 1 })
  const tvLed = new THREE.MeshStandardMaterial({ color: '#220000', emissive: '#ff3b30', emissiveIntensity: 0 })
  const tvG = grp(
    at(box(1.48, 0.86, 0.04, blk), 0, 1.45, 0.03), at(new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.79), tvScreen), 0, 1.45, 0.052), at(box(0.02, 0.02, 0.005, tvLed, false), 0.6, 1.04, 0.052),
  )
  tag(tvG, 'toggle')
  const consoleG = tag(grp(
    at(rbox(1.9, 0.42, 0.4, parts.wood, 0.03), 0, 0.33, 0.2),
    at(box(0.012, 0.34, 0.02, dark, false), 0, 0.33, 0.405), at(box(0.012, 0.34, 0.02, dark, false), -0.63, 0.33, 0.405), at(box(0.012, 0.34, 0.02, dark, false), 0.63, 0.33, 0.405),
    ...[-0.12, 0.12, -0.75, 0.75].map((x) => at(box(0.02, 0.14, 0.02, gold, false), x, 0.36, 0.41)),
    ...[-0.8, 0.8].map((x) => at(cyl(0.02, 0.012, 0.12, gold, 8, false), x, 0.06, 0.3)),
  ), 'wood')
  const sound = at(rbox(1.2, 0.06, 0.1, blk, 0.02), 0, 0.57, 0.15)
  const tvPot = grp(at(cyl(0.06, 0.045, 0.12, mat('#efe6d6', 0.5), 16), 0, 0.06, 0), at(flat(ball(0.09, mat('#5f7662', 0.8)), 1, 0.9, 1), 0, 0.17, 0))
  const tvAll = grp(tvG, consoleG, sound, at(tvPot, 0.75, 0.55, 0.2))
  tvAll.rotation.y = -Math.PI / 2
  const tvApply = (amt) => { tvScreen.emissiveIntensity = amt; tvLed.emissiveIntensity = 1 - amt }
  tvApply(1)
  anim.toggles.push({ root: tvG, on: true, amt: 1, rate: 6, tip: (on) => `TV · click to switch ${on ? 'off' : 'on'}`, apply: tvApply })
  put(L, 'tv', 'Wall TV & console (tap TV)', tvAll, 3.9, 0, -1.3)

}
