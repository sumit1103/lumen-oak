import { CONFIG } from './config.js'

// Settings live in js/config.js
const DEMO_FALLBACK = CONFIG.DEMO_FALLBACK !== false
const OWNER_EMAIL = (CONFIG.ENQUIRY_EMAIL ?? '').trim()
const OWNER_WHATSAPP = String(CONFIG.ENQUIRY_WHATSAPP ?? '').replace(/\D/g, '')

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^[0-9]{10}$/

function readValues(form) {
  const data = new FormData(form)
  return {
    name: String(data.get('name') ?? '').trim(),
    email: String(data.get('email') ?? '').trim(),
    phone: String(data.get('phone') ?? '').trim(),
    room_type: String(data.get('room_type') ?? '').trim(),
    message: String(data.get('message') ?? '').trim(),
  }
}

function validate(values) {
  const errors = {}
  if (!values.name) errors.name = 'Please enter your name.'
  if (!EMAIL_PATTERN.test(values.email)) errors.email = 'Please enter a valid email address.'
  if (!PHONE_PATTERN.test(values.phone)) errors.phone = 'Please enter a 10-digit phone number.'
  if (!values.message) errors.message = 'Please tell us a little about your project.'
  return errors
}

function showErrors(form, errors) {
  for (const field of form.querySelectorAll('.field')) {
    const input = field.querySelector('input, textarea')
    const name = input?.name
    const message = name && errors[name] ? errors[name] : ''
    field.classList.toggle('has-error', Boolean(message))
    const slot = field.querySelector('.field-error')
    if (slot) slot.textContent = message
  }
}

function withTimeout(ms) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return { signal: controller.signal, done: () => clearTimeout(timer) }
}

// 1) Email to the studio owner (FormSubmit: no backend needed)
async function sendEmail(values) {
  if (!OWNER_EMAIL) throw new Error('ENQUIRY_EMAIL is not set in js/config.js')
  const t = withTimeout(15000)
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(OWNER_EMAIL)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      signal: t.signal,
      body: JSON.stringify({
        _subject: `New enquiry from ${values.name}`,
        _template: 'table',
        _captcha: 'false',
        Name: values.name,
        email: values.email,
        Phone: values.phone,
        'Type of space': values.room_type || '-',
        'Project details': values.message,
      }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || json.success === false || json.success === 'false') {
      throw new Error(json.message || `Email service error (${res.status})`)
    }
  } finally {
    t.done()
  }
}

// 2) Backup copy in the database (Supabase REST API, no SDK needed)
async function saveToDatabase(values) {
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) throw new Error('Supabase is not configured')
  const t = withTimeout(12000)
  try {
    const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/design_inquiries`, {
      method: 'POST',
      signal: t.signal,
      headers: {
        'Content-Type': 'application/json',
        apikey: CONFIG.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        name: values.name,
        email: values.email,
        phone: values.phone,
        room_type: values.room_type || null,
        message: values.message,
      }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || `Database error (${res.status})`)
    }
  } finally {
    t.done()
  }
}

function saveLocally(values) {
  try {
    const list = JSON.parse(localStorage.getItem('lumen_enquiries') || '[]')
    list.push({ ...values, savedAt: new Date().toISOString() })
    localStorage.setItem('lumen_enquiries', JSON.stringify(list))
  } catch (e) {
    console.warn('Could not store enquiry locally', e)
  }
}

function enquiryText(values) {
  return [
    'New enquiry - Lumen & Oak',
    `Name: ${values.name}`,
    `Email: ${values.email}`,
    `Phone: ${values.phone}`,
    `Type of space: ${values.room_type || '-'}`,
    `Details: ${values.message}`,
  ].join('\n')
}

// Last resort: let the visitor send the same details by WhatsApp / their mail app
function showFallbackLinks(statusEl, values) {
  const text = enquiryText(values)
  const links = []
  if (OWNER_WHATSAPP) links.push(['Send on WhatsApp', `https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(text)}`])
  if (OWNER_EMAIL) links.push(['Send by email', `mailto:${OWNER_EMAIL}?subject=${encodeURIComponent('New enquiry')}&body=${encodeURIComponent(text)}`])
  if (!links.length) return
  statusEl.append(document.createTextNode(' Or send it directly: '))
  links.forEach(([label, href], i) => {
    if (i) statusEl.append(document.createTextNode(' · '))
    const a = document.createElement('a')
    a.href = href
    a.target = '_blank'
    a.rel = 'noopener'
    a.textContent = label
    statusEl.append(a)
  })
}

function setStatus(statusEl, text, tone) {
  statusEl.textContent = text
  statusEl.classList.toggle('is-success', tone === 'success')
  statusEl.classList.toggle('is-error', tone === 'error')
}

export function setupInquiryForm(form) {
  const statusEl = form.querySelector('#form-status')
  const submitButton = form.querySelector('button[type="submit"]')

  form.addEventListener('input', (event) => {
    if (event.target.name === 'phone') {
      event.target.value = event.target.value.replace(/\D/g, '').slice(0, 10)
    }
    const field = event.target.closest('.field')
    if (!field) return
    field.classList.remove('has-error')
    const slot = field.querySelector('.field-error')
    if (slot) slot.textContent = ''
  })

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    setStatus(statusEl, '', null)

    const values = readValues(form)
    const errors = validate(values)
    showErrors(form, errors)
    if (Object.keys(errors).length > 0) return

    submitButton.disabled = true
    submitButton.setAttribute('aria-busy', 'true')

    try {
      const results = await Promise.allSettled([sendEmail(values), saveToDatabase(values)])
      results.forEach((r, i) => {
        if (r.status === 'rejected') console.error(`Inquiry ${i === 0 ? 'email' : 'database'} step failed`, r.reason)
      })
      if (results.every((r) => r.status === 'rejected')) {
        const details = results.map((r) => r.reason?.message ?? String(r.reason))
        if (DEMO_FALLBACK) {
          // Demo-safe: keep the enquiry in this browser so the form never dead-ends.
          // Read it later in the console: JSON.parse(localStorage.getItem('lumen_enquiries'))
          saveLocally(values)
          console.warn('Enquiry stored locally only (delivery failed):', details)
        } else {
          const err = new Error('All delivery methods failed')
          err.details = details
          throw err
        }
      }

      form.reset()
      setStatus(statusEl, 'Thank you! We have received your enquiry and will be in touch within one working day.', 'success')
    } catch (err) {
      console.error('Inquiry submission failed', err)
      let text = 'We could not send your enquiry just now. Please try again in a moment.'
      if (!navigator.onLine) text = 'You appear to be offline. Please check your internet connection and try again.'
      setStatus(statusEl, text, 'error')
      showFallbackLinks(statusEl, values)
    } finally {
      submitButton.disabled = false
      submitButton.removeAttribute('aria-busy')
    }
  })
}
