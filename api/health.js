export default function handler(_request, response) {
  response.status(200).json({
    service: 'hoomko-automation-hub',
    status: 'ok',
    stack: ['React', 'Vite', 'Vercel Functions', 'n8n-ready workflow design'],
    capabilities: ['webhook-preview', 'workflow-runner', 'retry-simulation'],
  })
}
