export function setupHeader() {
  const header = document.querySelector('.site-header')
  const toggle = document.querySelector('.nav-toggle')
  const menu = document.querySelector('#mobile-menu')

  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40)
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })

  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open))
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu')
    menu.hidden = !open
  }

  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'))
  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false)
  })
}

export function setupGalleryFilter() {
  const buttons = document.querySelectorAll('.filter')
  const projects = document.querySelectorAll('.project')

  for (const button of buttons) {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter
      for (const other of buttons) {
        const active = other === button
        other.classList.toggle('is-active', active)
        other.setAttribute('aria-pressed', String(active))
      }
      for (const project of projects) {
        const show = filter === 'all' || project.dataset.category === filter
        project.classList.toggle('is-hidden', !show)
        if (show) {
          project.classList.remove('is-entering')
          void project.offsetWidth
          project.classList.add('is-entering')
        }
      }
    })
  }
}

export function setupRevealOnScroll() {
  const items = document.querySelectorAll(
    '.section .card, .section-head, .contact-intro, .showroom-grid, .steps, .studio-copy, .studio-collage, .cta-inner, .footer-top',
  )
  items.forEach((item, i) => {
    item.classList.add('reveal')
    if (item.classList.contains('studio-collage')) item.dataset.reveal = 'left'
    if (item.classList.contains('studio-copy')) item.dataset.reveal = 'right'
    if (item.classList.contains('cta-inner')) item.dataset.reveal = 'zoom'
    // stagger siblings that share a parent grid
    if (item.matches('.service-card, .step')) {
      const index = [...item.parentElement.children].indexOf(item)
      item.style.setProperty('--d', `${index * 110}ms`)
    }
  })

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      }
    },
    { threshold: 0.15 },
  )
  for (const item of items) observer.observe(item)
}

export function setupSwatches(onPick) {
  for (const group of document.querySelectorAll('.swatches')) {
    const target = group.dataset.target
    group.addEventListener('click', (event) => {
      const swatch = event.target.closest('.swatch')
      if (!swatch) return
      for (const other of group.querySelectorAll('.swatch')) {
        const active = other === swatch
        other.classList.toggle('is-active', active)
        other.setAttribute('aria-pressed', String(active))
      }
      const selectedLabel = document.querySelector(`[data-selected-for="${target}"]`)
      if (selectedLabel) selectedLabel.textContent = swatch.dataset.name
      onPick(target, swatch.dataset.color)
    })
  }
}

const FINISH_ORDER = ['wall', 'sofa', 'floor', 'wood', 'rug', 'curtain']

export function flashFinishGroup(part) {
  const group = document.querySelector(`.finish-group[data-group="${part}"]`)
  if (!group) return
  group.classList.remove('is-focused')
  void group.offsetWidth
  group.classList.add('is-focused')
  setTimeout(() => group.classList.remove('is-focused'), 1800)
}

export function setActiveView(name) {
  for (const btn of document.querySelectorAll('[data-view]')) {
    btn.classList.toggle('is-active', btn.dataset.view === name)
  }
}

export function setupRoomControls(viewer) {
  if (!viewer) return

  for (const btn of document.querySelectorAll('[data-view]')) {
    btn.addEventListener('click', () => {
      setActiveView(btn.dataset.view)
      viewer.setView(btn.dataset.view)
    })
  }

  for (const btn of document.querySelectorAll('[data-light]')) {
    btn.addEventListener('click', () => {
      for (const other of document.querySelectorAll('[data-light]')) {
        other.classList.toggle('is-active', other === btn)
      }
      viewer.setLighting(btn.dataset.light)
    })
  }

  const applyLook = (indices) => {
    FINISH_ORDER.forEach((target, i) => {
      const swatches = document.querySelectorAll(`.swatches[data-target="${target}"] .swatch`)
      const swatch = swatches[indices[i] % swatches.length]
      if (swatch) setTimeout(() => swatch.click(), i * 220)
    })
    viewer.setView('overview')
    setActiveView('overview')
  }

  for (const btn of document.querySelectorAll('[data-look]')) {
    btn.addEventListener('click', () => {
      for (const other of document.querySelectorAll('[data-look]')) other.classList.toggle('is-active', other === btn)
      const raw = btn.dataset.look
      const indices = raw === 'random' ? FINISH_ORDER.map(() => Math.floor(Math.random() * 5)) : raw.split(',').map(Number)
      applyLook(indices)
    })
  }
}

export function setActiveLight(name) {
  for (const btn of document.querySelectorAll('[data-light]')) {
    btn.classList.toggle('is-active', btn.dataset.light === name)
  }
}

export function setTourActive(active) {
  const btn = document.querySelector('[data-tour]')
  if (!btn) return
  btn.classList.toggle('is-active', active)
  btn.setAttribute('aria-pressed', String(active))
  btn.innerHTML = active ? '&#9632; Stop tour' : '&#9654; Guided tour'
}

export function setupRoomTools(viewer) {
  if (!viewer) return

  document.querySelector('[data-tour]')?.addEventListener('click', () => {
    if (viewer.isTouring()) viewer.stopTour()
    else viewer.startTour()
  })

  document.querySelector('[data-snapshot]')?.addEventListener('click', () => {
    const link = document.createElement('a')
    link.href = viewer.snapshot()
    link.download = 'my-room-design.png'
    link.click()
  })

  const stage = document.querySelector('.showroom-grid')
  const fsBtn = document.querySelector('[data-fullscreen]')
  const isFull = () => document.fullscreenElement === stage || document.webkitFullscreenElement === stage
  fsBtn?.addEventListener('click', () => {
    if (isFull()) (document.exitFullscreen || document.webkitExitFullscreen).call(document)
    else (stage.requestFullscreen || stage.webkitRequestFullscreen)?.call(stage)
  })
  const syncFs = () => {
    if (fsBtn) fsBtn.textContent = isFull() ? 'Exit fullscreen' : 'Fullscreen'
  }
  document.addEventListener('fullscreenchange', syncFs)
  document.addEventListener('webkitfullscreenchange', syncFs)
  if (!stage?.requestFullscreen && !stage?.webkitRequestFullscreen && fsBtn) fsBtn.hidden = true
}

/* ------------------------------------------------------------------ */
/* Motion + imagery helpers                                            */
/* ------------------------------------------------------------------ */

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function setupScrollProgress() {
  const bar = document.createElement('div')
  bar.className = 'scroll-progress'
  bar.setAttribute('aria-hidden', 'true')
  document.body.appendChild(bar)
  let ticking = false
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    bar.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`
    ticking = false
  }
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    },
    { passive: true },
  )
  update()
}

export function setupHeadlineSplit() {
  const heading = document.querySelector('[data-split]')
  if (!heading || reducedMotion) return
  const label = heading.textContent.trim()
  let index = 0
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment()
        for (const part of child.textContent.split(/(\s+)/)) {
          if (!part) continue
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(' '))
            continue
          }
          const word = document.createElement('span')
          word.className = 'w'
          const inner = document.createElement('span')
          inner.className = 'w-i'
          inner.style.setProperty('--i', String(index++))
          inner.textContent = part
          word.appendChild(inner)
          frag.appendChild(word)
        }
        node.replaceChild(frag, child)
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child)
      }
    }
  }
  walk(heading)
  heading.setAttribute('aria-label', label)
}

export function setupCountUp() {
  const items = document.querySelectorAll('[data-count]')
  const format = (el, value) => {
    const decimals = Number(el.dataset.decimals || 0)
    el.textContent = value.toFixed(decimals) + (el.dataset.suffix || '')
  }
  if (reducedMotion) return
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const el = entry.target
        observer.unobserve(el)
        const target = Number(el.dataset.count)
        const start = performance.now()
        const duration = 1800
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1)
          format(el, target * (1 - Math.pow(1 - p, 3)))
          if (p < 1) requestAnimationFrame(tick)
        }
        format(el, 0)
        requestAnimationFrame(tick)
      }
    },
    { threshold: 0.6 },
  )
  for (const el of items) observer.observe(el)
}

export function setupTilt() {
  if (reducedMotion || !window.matchMedia('(hover: hover)').matches) return
  for (const card of document.querySelectorAll('[data-tilt]')) {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      const y = (e.clientY - r.top) / r.height
      card.style.setProperty('--ry', `${(x - 0.5) * 8}deg`)
      card.style.setProperty('--rx', `${(0.5 - y) * 8}deg`)
      card.style.setProperty('--mx', `${x * 100}%`)
      card.style.setProperty('--my', `${y * 100}%`)
    })
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rx', '0deg')
      card.style.setProperty('--ry', '0deg')
    })
  }
}

export function setupParallax() {
  if (reducedMotion) return
  const items = [...document.querySelectorAll('[data-parallax]')]
  if (!items.length) return
  let ticking = false
  const update = () => {
    ticking = false
    for (const el of items) {
      const parent = el.parentElement.getBoundingClientRect()
      if (parent.bottom < -200 || parent.top > window.innerHeight + 200) continue
      const speed = Number(el.dataset.parallax)
      const slack = Math.abs(el.offsetHeight - el.parentElement.offsetHeight) / 2 - 2
      const raw = (parent.top + parent.height / 2 - window.innerHeight / 2) * speed
      const offset = Math.max(-slack, Math.min(slack, raw))
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`
    }
  }
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    },
    { passive: true },
  )
  window.addEventListener('resize', update)
  update()
}

export function setupLightbox() {
  const box = document.createElement('div')
  box.className = 'lightbox'
  box.setAttribute('role', 'dialog')
  box.setAttribute('aria-modal', 'true')
  box.setAttribute('aria-label', 'Project photo')
  box.innerHTML = `
    <button type="button" class="lightbox-close" aria-label="Close">&times;</button>
    <button type="button" class="lightbox-prev" aria-label="Previous project">&#8592;</button>
    <figure><img alt="" /><figcaption></figcaption></figure>
    <button type="button" class="lightbox-next" aria-label="Next project">&#8594;</button>`
  document.body.appendChild(box)
  const img = box.querySelector('img')
  const caption = box.querySelector('figcaption')
  let list = []
  let index = 0
  let opener = null

  const show = (i) => {
    index = (i + list.length) % list.length
    const fig = list[index]
    const src = fig.querySelector('img').src.replace(/h=\d+&w=\d+/, 'h=1000&w=1600')
    img.src = src
    img.alt = fig.querySelector('img').alt
    const label = fig.querySelector('figcaption span')?.textContent ?? ''
    const text = fig.querySelector('figcaption')?.textContent.replace(label, '').trim() ?? ''
    caption.innerHTML = `${label}<small>${text}</small>`
  }
  const open = (fig) => {
    list = [...document.querySelectorAll('.project:not(.is-hidden)')]
    opener = fig
    show(list.indexOf(fig))
    box.classList.add('is-open')
    document.body.style.overflow = 'hidden'
    box.querySelector('.lightbox-close').focus()
  }
  const close = () => {
    box.classList.remove('is-open')
    document.body.style.overflow = ''
    opener?.focus()
  }

  for (const fig of document.querySelectorAll('.project')) {
    fig.tabIndex = 0
    fig.setAttribute('role', 'button')
    fig.addEventListener('click', () => open(fig))
    fig.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        open(fig)
      }
    })
  }
  box.addEventListener('click', (e) => {
    if (e.target === box || e.target.closest('.lightbox-close')) close()
    else if (e.target.closest('.lightbox-prev')) show(index - 1)
    else if (e.target.closest('.lightbox-next')) show(index + 1)
  })
  document.addEventListener('keydown', (e) => {
    if (!box.classList.contains('is-open')) return
    if (e.key === 'Escape') close()
    if (e.key === 'ArrowLeft') show(index - 1)
    if (e.key === 'ArrowRight') show(index + 1)
  })
}

export function setupRoomPicker(viewer) {
  if (!viewer) return
  const tabs = document.querySelector('#room-tabs')
  const list = document.querySelector('#furniture-list')
  const setLabel = (group, text) => {
    const el = document.querySelector(`.finish-group[data-group="${group}"] .finish-label span`)
    if (el) el.textContent = text
  }
  const renderItems = () => {
    list.replaceChildren(
      ...viewer.getItems().map((it) => {
        const label = document.createElement('label')
        label.className = 'furn'
        const cb = document.createElement('input')
        cb.type = 'checkbox'
        cb.checked = it.on
        cb.addEventListener('change', () => viewer.setItem(it.id, cb.checked))
        label.append(cb, document.createTextNode(it.label))
        return label
      }),
    )
  }
  const pick = (id, init) => {
    const room = viewer.rooms.find((r) => r.id === id)
    if (!init) viewer.setRoom(id)
    for (const b of tabs.children) {
      b.classList.toggle('is-active', b.dataset.room === id)
      b.setAttribute('aria-pressed', String(b.dataset.room === id))
    }
    for (const k of ['sofa', 'table', 'nook', 'window']) {
      const btn = document.querySelector(`[data-view="${k}"]`)
      if (btn) btn.textContent = room.names[k]
    }
    setLabel('sofa', room.names.fabric)
    setLabel('wood', room.names.wood)
    const slabGroup = document.querySelector('.finish-group[data-group="slab"]')
    if (slabGroup) slabGroup.style.display = room.names.slab ? '' : 'none'
    renderItems()
    setActiveView('overview')
  }
  for (const r of viewer.rooms) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'filter'
    b.dataset.room = r.id
    b.textContent = r.label
    b.addEventListener('click', () => pick(r.id))
    tabs.append(b)
  }
  const edit = document.querySelector('#edit-mode')
  const tools = document.querySelector('#edit-tools')
  edit.addEventListener('change', () => {
    viewer.setEdit(edit.checked)
    tools.hidden = !edit.checked
  })
  for (const btn of document.querySelectorAll('[data-edit]')) {
    btn.addEventListener('click', () => {
      viewer.editAction(btn.dataset.edit)
      renderItems()
    })
  }
  document.addEventListener('room-items-changed', renderItems)
  pick('living', true)
}

export function showEditSelection(label) {
  const el = document.querySelector('#edit-sel')
  if (el) el.textContent = label ? `Selected: ${label} · drag to move` : 'Click a furniture item, then drag it'
  document.dispatchEvent(new CustomEvent('room-items-changed'))
}

export function setupPanelToggle() {
  const grid = document.querySelector('.showroom-grid')
  const panel = document.querySelector('#room-panel')
  const openBtn = document.querySelector('.panel-toggle--open')
  const closeBtn = document.querySelector('.panel-toggle--close')
  if (!grid || !panel || !openBtn || !closeBtn) return
  const set = (collapsed) => {
    grid.classList.toggle('panel-collapsed', collapsed)
    openBtn.hidden = !collapsed
    openBtn.setAttribute('aria-expanded', String(!collapsed))
    closeBtn.setAttribute('aria-expanded', String(!collapsed))
    window.dispatchEvent(new Event('resize'))
  }
  closeBtn.addEventListener('click', () => set(true))
  openBtn.addEventListener('click', () => set(false))
}
