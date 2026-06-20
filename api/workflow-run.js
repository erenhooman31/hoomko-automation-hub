const steps = ['trigger', 'validate', 'transform', 'dispatch', 'log']

export default function handler(request, response) {
  if (request.method !== 'POST' && request.method !== 'GET') {
    response.setHeader('Allow', 'GET, POST')
    response.status(405).json({ error: 'method_not_allowed' })
    return
  }

  response.status(200).json({
    runId: `RUN-${Date.now()}`,
    workflow: 'lead-to-crm-and-sms',
    status: 'completed',
    steps: steps.map((step, index) => ({
      step,
      order: index + 1,
      status: 'ok',
    })),
    nextAction: 'persist-run-log',
  })
}
