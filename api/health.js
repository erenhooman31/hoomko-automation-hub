import { databaseMode } from './_lib/supabase.js'

export default function handler(_request, response) {
  response.status(200).json({
    service: 'hoomko-automation-hub',
    status: 'ok',
    database: databaseMode(),
    stack: ['React', 'Vite', 'Vercel Functions', 'Supabase-ready Postgres', 'n8n-ready workflow design'],
    capabilities: ['webhook-preview', 'workflow-runner', 'retry-simulation', 'run-log-storage'],
  })
}
