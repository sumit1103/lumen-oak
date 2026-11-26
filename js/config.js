// Site settings. No build step, so edit this file directly and commit it.
// The Supabase anon key is a public key by design (it ships to every browser);
// your data is protected by the Row Level Security policies in /supabase/migrations.
export const CONFIG = {
  SUPABASE_URL: 'https://zqgmetlwnbqrlzudomfk.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxZ21ldGx3bmJxcmx6dWRvbWZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3OTA2MjUsImV4cCI6MjEwOTM2NjYyNX0.Ena2qAQZjqg_s9OeF30AyNxSVpfQwovv4CU6A4_BH3Q',

  // Enquiries are emailed here via FormSubmit. Fill in your address.
  ENQUIRY_EMAIL: '',
  // WhatsApp number with country code, digits only (e.g. 919876543210)
  ENQUIRY_WHATSAPP: '',

  // true: if delivery fails, still show the success message and keep a copy in the browser.
  // Set to false for a real, live site.
  DEMO_FALLBACK: true,
}
