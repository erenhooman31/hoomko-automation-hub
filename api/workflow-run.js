import { getSupabaseServerClient } from './_lib/supabase.js'

const steps = ['trigger', 'validate', 'transform', 'dispatch', 'log']

export default function handler(request, response) {
  if (request.method !== 'POST' && request.method !== 'GET') {
    response.setHeader('Allow', 'GET, POST')
    response.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const run = {
    runId: `RUN-${Date.now()}`,
    workflow: 'lead-to-crm-and-sms',
    status: 'completed',
    steps: steps.map((step, index) => ({
      step,
      order: index + 1,
      status: 'ok',
    })),
    nextAction: 'persist-run-log',
  }

  const supabase = getSupabaseServerClient()
  if (!supabase) {
    response.status(200).json({ mode: 'demo', ...run })
    return
  }

  supabase
    .from('automation_runs')
    .insert({
      run_id: run.runId,
      workflow_key: run.workflow,
      status: run.status,
      steps: run.steps,
    })
    .select('id')
    .single()
    .then(({ data, error }) => {
      if (error) {
        response.status(500).json({ error: 'database_error', message: error.message })
        return
      }
      response.status(200).json({ mode: 'supabase', databaseId: data.id, ...run })
    })
}
