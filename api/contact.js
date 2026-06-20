import { getSupabaseServerClient } from './_lib/supabase.js'

export default function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    response.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const body = request.body || {}
  const name = String(body.name || '').trim()
  const contact = String(body.contact || '').trim()
  const message = String(body.message || '').trim()

  if (!name || !contact || !message) {
    response.status(400).json({ error: 'validation_error', message: 'name, contact and message are required' })
    return
  }

  const supabase = getSupabaseServerClient()
  if (!supabase) {
    response.status(202).json({ mode: 'demo', stored: false, message: 'Demo mode accepted the request without database storage.' })
    return
  }

  supabase
    .from('contact_requests')
    .insert({ product: 'automation-hub', name, contact, message })
    .then(({ error }) => {
      if (error) {
        response.status(500).json({ error: 'database_error', message: error.message })
        return
      }
      response.status(201).json({ mode: 'supabase', stored: true })
    })
}
