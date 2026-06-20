import { useEffect, useMemo, useState } from 'react'
import './App.css'

const modes = ['عملیات', 'Workflow', 'API', 'گزارش']

const workflows = [
  { name: 'ثبت لید از فرم سایت', trigger: 'Webhook', target: 'CRM', runs: 248, health: 98, status: 'فعال' },
  { name: 'ارسال پیامک بعد از پرداخت', trigger: 'Payment API', target: 'SMS', runs: 416, health: 93, status: 'فعال' },
  { name: 'گزارش فروش روزانه', trigger: 'Cron', target: 'Email', runs: 31, health: 100, status: 'فعال' },
  { name: 'همگام سازی سفارش ها', trigger: 'WooCommerce', target: 'Database', runs: 128, health: 89, status: 'پایش' },
]

const runnerSteps = [
  { key: 'trigger', title: 'دریافت ورودی', detail: 'Webhook یا API Payload دریافت شد.' },
  { key: 'validate', title: 'اعتبارسنجی داده', detail: 'شماره تماس، مبلغ و شناسه سفارش بررسی شد.' },
  { key: 'transform', title: 'تبدیل داده', detail: 'Payload برای CRM و SMS آماده شد.' },
  { key: 'send', title: 'ارسال به سرویس مقصد', detail: 'درخواست خروجی به سرویس مقصد ارسال شد.' },
  { key: 'log', title: 'ثبت لاگ و هشدار', detail: 'نتیجه اجرا برای گزارش و Retry ذخیره شد.' },
]

const apiServices = [
  ['CRM', 'ارسال لید و وضعیت پیگیری', 'REST'],
  ['Payment', 'ثبت پرداخت موفق و ناموفق', 'Webhook'],
  ['SMS', 'ارسال پیامک تراکنشی', 'API Key'],
  ['Email', 'گزارش روزانه و هشدار', 'SMTP'],
]

const painPoints = [
  {
    key: 'lead',
    title: 'لیدها دیر پیگیری می شوند',
    workflow: 'Webhook فرم سایت -> اعتبارسنجی شماره -> ثبت در CRM -> پیامک به فروشنده',
    impact: 'کاهش زمان پاسخ از چند ساعت به کمتر از ۵ دقیقه',
  },
  {
    key: 'payment',
    title: 'بعد از پرداخت پیامک یا ایمیل نمی رود',
    workflow: 'Payment Webhook -> بررسی سفارش -> SMS/Email -> ثبت لاگ خطا',
    impact: 'کاهش تماس های پشتیبانی و افزایش اعتماد خریدار',
  },
  {
    key: 'report',
    title: 'گزارش فروش دستی و زمان بر است',
    workflow: 'Cron روزانه -> خواندن سفارش ها -> خلاصه KPI -> ارسال ایمیل مدیریتی',
    impact: 'گزارش قابل اتکا بدون فایل اکسل دستی',
  },
  {
    key: 'sync',
    title: 'سفارش ها بین فروشگاه و انبار هماهنگ نیستند',
    workflow: 'WooCommerce Event -> Queue -> Database Sync -> هشدار اختلاف موجودی',
    impact: 'کاهش فروش اشتباه و خطای موجودی',
  },
]

function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = window.localStorage.getItem(key)
      return saved ? JSON.parse(saved) : initialValue
    } catch {
      return initialValue
    }
  })

  function updateValue(nextValue) {
    setValue((current) => {
      const resolved = typeof nextValue === 'function' ? nextValue(current) : nextValue
      window.localStorage.setItem(key, JSON.stringify(resolved))
      return resolved
    })
  }

  return [value, updateValue]
}

function useApiStatus(path) {
  const [status, setStatus] = useState({ state: 'در حال بررسی', detail: 'اتصال API در حال تست است.' })

  useEffect(() => {
    let ignore = false
    fetch(path)
      .then((response) => {
        if (!response.ok) throw new Error('API unavailable')
        return response.json()
      })
      .then((payload) => {
        if (!ignore) setStatus({ state: 'فعال', detail: `${payload.service} - ${payload.capabilities.join('، ')}` })
      })
      .catch(() => {
        if (!ignore) setStatus({ state: 'دموی محلی', detail: 'روی Vercel endpoint زنده دارد؛ در لوکال با داده امن اجرا می شود.' })
      })
    return () => {
      ignore = true
    }
  }, [path])

  return status
}

function Toast({ message }) {
  return message ? <div className="toast" role="status">{message}</div> : null
}

function WorkflowCanvas({ selected }) {
  return (
    <article className="panel canvas">
      <div className="node start">{selected.trigger}</div>
      <div className="connector" />
      <div className="node process">اعتبارسنجی و تبدیل داده</div>
      <div className="connector" />
      <div className="node end">{selected.target}</div>
    </article>
  )
}

function Runner({ selected, runState, setRunState, notify }) {
  const hasFailure = runState.steps.transform === 'خطا'

  function runWorkflow({ fail = false } = {}) {
    const nextSteps = runnerSteps.reduce((state, step) => {
      state[step.key] = fail && step.key === 'transform' ? 'خطا' : 'موفق'
      return state
    }, {})
    const run = {
      id: `RUN-${String(runState.history.length + 1).padStart(3, '0')}`,
      workflow: selected.name,
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      result: fail ? 'نیازمند تلاش مجدد' : 'موفق',
    }
    setRunState((current) => ({ steps: nextSteps, history: [run, ...current.history].slice(0, 5) }))
    notify(fail ? 'یک خطای کنترل شده در مرحله تبدیل داده شبیه سازی شد.' : 'Workflow با موفقیت اجرا شد.')
  }

  return (
    <article className="panel runner">
      <div className="panel-head">
        <div>
          <p className="label">اجرای آزمایشی Workflow</p>
          <h2>{selected.name}</h2>
        </div>
        <span className={hasFailure ? 'badge danger' : 'badge live'}>{hasFailure ? 'خطا' : 'آماده اجرا'}</span>
      </div>
      <div className="runner-steps">
        {runnerSteps.map((step, index) => (
          <div className={runState.steps[step.key] === 'خطا' ? 'runner-step failed' : 'runner-step'} key={step.key}>
            <span>{index + 1}</span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.detail}</p>
            </div>
            <em>{runState.steps[step.key] || 'در انتظار'}</em>
          </div>
        ))}
      </div>
      <div className="action-row">
        <button className="primary" onClick={() => runWorkflow()} type="button">اجرای Workflow</button>
        <button className="secondary" onClick={() => runWorkflow({ fail: true })} type="button">شبیه سازی خطا</button>
        <button className="secondary" disabled={!hasFailure} onClick={() => runWorkflow()} type="button">تلاش مجدد</button>
      </div>
    </article>
  )
}

function PayloadPreview({ selected }) {
  const input = {
    source: selected.trigger,
    customer: 'شرکت نمونه',
    phone: '09xx-xxx-xxxx',
    amount: 18400000,
    consent: true,
  }
  const output = {
    target: selected.target,
    fullName: 'شرکت نمونه',
    segment: 'buyer-ready',
    nextAction: selected.target === 'SMS' ? 'send_payment_success_sms' : 'create_or_update_record',
  }

  return (
    <section className="payload-grid">
      <article className="panel code-preview">
        <p className="label">ورودی Webhook/API</p>
        <pre>{JSON.stringify(input, null, 2)}</pre>
      </article>
      <article className="panel code-preview">
        <p className="label">خروجی تبدیل شده</p>
        <pre>{JSON.stringify(output, null, 2)}</pre>
      </article>
    </section>
  )
}

function RecommendationWizard({ selectedPain, setSelectedPain }) {
  const active = painPoints.find((pain) => pain.key === selectedPain) || painPoints[0]

  return (
    <section className="panel wizard">
      <div className="panel-head">
        <div>
          <p className="label">پیشنهاد اتوماسیون</p>
          <h2>از درد کسب و کار تا Workflow پیشنهادی</h2>
        </div>
        <span className="badge">مشاوره سریع</span>
      </div>
      <div className="wizard-grid">
        <div className="pain-options">
          {painPoints.map((pain) => (
            <button className={pain.key === active.key ? 'selected' : ''} key={pain.key} onClick={() => setSelectedPain(pain.key)} type="button">
              {pain.title}
            </button>
          ))}
        </div>
        <article className="recommendation">
          <span>Workflow پیشنهادی</span>
          <h3>{active.title}</h3>
          <p>{active.workflow}</p>
          <strong>{active.impact}</strong>
        </article>
      </div>
    </section>
  )
}

function HistoryPanel({ history }) {
  return (
    <article className="panel logs">
      <div className="panel-head">
        <div>
          <p className="label">Run history</p>
          <h2>آخرین اجراهای ذخیره شده</h2>
        </div>
        <span className="badge live">localStorage</span>
      </div>
      {history.length === 0 && <p className="empty-state">هنوز اجرایی ثبت نشده است. یک Workflow را اجرا کنید تا تاریخچه ساخته شود.</p>}
      {history.map((run) => (
        <div className="log-row" key={run.id}>
          <time>{run.time}</time>
          <span>{run.workflow}</span>
          <strong>{run.result}</strong>
        </div>
      ))}
    </article>
  )
}

function ValueSection() {
  return (
    <section className="value-panel" aria-label="ارزش پروژه برای کارفرما">
      <div>
        <p className="label">چرا این پروژه برای کارفرما ارزش دارد؟</p>
        <h2>فرآیندهای تکراری فروش، CRM، پیامک و گزارش را خودکار کن.</h2>
      </div>
      <ul>
        <li>کارفرما می بیند هر اتوماسیون چه ورودی می گیرد، چه خروجی می سازد و کجا خطا می دهد.</li>
        <li>Retry و Run history نشان می دهد پروژه فقط ظاهر ندارد و منطق عملیاتی دارد.</li>
        <li>Wizard پیشنهاد اتوماسیون، مکالمه فروش را از «چه بسازیم؟» به «کدام درد را حل کنیم؟» تبدیل می کند.</li>
      </ul>
    </section>
  )
}

function ProductStory({ apiStatus }) {
  return (
    <section className="story-grid" aria-label="معرفی محصول اتوماسیون">
      <article className="story-main">
        <h2>اتوماسیون هایی که فردا قابل فروش و قابل توضیح هستند</h2>
        <p>این محصول مسیر کامل از درد کسب و کار تا Workflow قابل اجرا را نشان می دهد: ورودی Webhook، تبدیل داده، Retry، Run history، Payload preview و طراحی آماده برای n8n.</p>
      </article>
      <article className="live-proof">
        <span>وضعیت API</span>
        <strong>{apiStatus.state}</strong>
        <p>{apiStatus.detail}</p>
      </article>
    </section>
  )
}

function ArchitectureSection() {
  return (
    <section className="architecture">
      <div>
        <h2>معماری اتوماسیون</h2>
        <p>یک مسیر قابل توسعه برای Webhook، Validation، Transform، Dispatch، Logging و Retry بدون ذخیره کلید واقعی در مخزن.</p>
      </div>
      {['Webhook', 'Validate', 'Transform', 'Dispatch', 'Retry Log'].map((item, index) => (
        <div className="arch-node" key={item}>
          <span>{index + 1}</span>
          <strong>{item}</strong>
        </div>
      ))}
    </section>
  )
}

function ProblemSolutionSection() {
  const problems = ['پیگیری دستی لید', 'ارسال پیامک نامطمئن', 'گزارش فروش دستی', 'خطای Sync بین سیستم ها']
  const solutions = ['Webhook آماده', 'Retry و Run history', 'گزارش خودکار', 'Workflow قابل اتصال به n8n']

  return (
    <section className="problem-solution" aria-label="مشکل و راه حل اتوماسیون">
      <div>
        <h2>مشکل کسب و کار</h2>
        {problems.map((item) => <p key={item}>{item}</p>)}
      </div>
      <div>
        <h2>راه حل آماده فروش</h2>
        {solutions.map((item) => <p key={item}>{item}</p>)}
      </div>
    </section>
  )
}

function OfferSection() {
  return (
    <section className="offer-band" aria-label="پیشنهاد فروش اتوماسیون">
      <div>
        <h2>پکیج آماده اتوماسیون برای مشتری</h2>
        <p>تحلیل فرآیند، طراحی Workflow، اتصال Webhook/API، تست خطا، مستند تحویل و آموزش استفاده برای تیم فروش یا عملیات.</p>
      </div>
      <ul>
        <li>تحویل سناریوی اول در ۲ تا ۴ روز کاری</li>
        <li>آماده اتصال به CRM، SMS، Email و Payment</li>
        <li>مستند n8n-ready برای توسعه بعدی</li>
      </ul>
    </section>
  )
}

function PricingSection() {
  const plans = [
    ['استاندارد', '۲,۴۹۰,۰۰۰', 'یک Workflow، تست سناریو، مستند تحویل'],
    ['حرفه ای', '۴,۹۹۰,۰۰۰', 'سه Workflow، Retry، API mapping'],
    ['سازمانی', 'تماس بگیرید', 'چند سرویس، مانیتورینگ، پشتیبانی اختصاصی'],
  ]

  return (
    <section className="pricing-grid" aria-label="پکیج های فروش اتوماسیون">
      {plans.map(([name, price, text], index) => (
        <article className={index === 1 ? 'price-card featured' : 'price-card'} key={name}>
          <span>{name}</span>
          <strong>{price}</strong>
          <p>{text}</p>
          <button className={index === 1 ? 'primary' : 'secondary'} type="button">انتخاب پلن</button>
        </article>
      ))}
    </section>
  )
}

function SuiteLinks() {
  return (
    <section className="suite-links" aria-label="دیگر محصولات Hoomko">
      <a href="https://hoomko-commerce-ops.vercel.app">داشبورد فروشگاه</a>
      <a href="https://hoomko-client-portal.vercel.app">پرتال مشتریان</a>
      <a href="https://github.com/erenhooman31/hoomko-automation-hub">GitHub</a>
    </section>
  )
}

function App() {
  const [selectedName, setSelectedName] = usePersistentState('automation-selected-workflow', workflows[0].name)
  const [mode, setMode] = usePersistentState('automation-mode', 'عملیات')
  const [runState, setRunState] = usePersistentState('automation-run-state', { steps: {}, history: [] })
  const [selectedPain, setSelectedPain] = usePersistentState('automation-pain', painPoints[0].key)
  const [toast, setToast] = useState('')
  const apiStatus = useApiStatus('/api/health')
  const selected = workflows.find((flow) => flow.name === selectedName) || workflows[0]

  function notify(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  const successRate = useMemo(() => {
    const total = workflows.reduce((sum, flow) => sum + flow.health, 0)
    return Math.round(total / workflows.length)
  }, [])

  return (
    <main className="shell" dir="rtl">
      <a className="skip-link" href="#automation-content">رفتن به محتوای اصلی</a>
      <Toast message={toast} />
      <header className="hero">
        <nav aria-label="بخش های هاب اتوماسیون">
          <strong>هاب اتوماسیون</strong>
          <div>
            {modes.map((item) => (
              <button aria-current={mode === item ? 'page' : undefined} className={mode === item ? 'active' : ''} key={item} onClick={() => setMode(item)} type="button">
                {item}
              </button>
            ))}
          </div>
        </nav>
        <section className="hero-grid">
          <div>
            <p className="label">نمونه کار n8n و API Integration</p>
            <h1>مرکز کنترل اتوماسیون فرآیندهای کسب و کار</h1>
            <p className="intro">
              این داشبورد نشان می دهد چطور Workflowها، Webhookها، اتصال CRM، پیامک، ایمیل و پرداخت در یک نمای قابل پایش مدیریت می شوند.
            </p>
          </div>
          <article className="signal-card">
            <span>نرخ سلامت کل</span>
            <strong>{successRate}%</strong>
            <p>بر اساس اجرای موفق Workflowها و سرویس های متصل</p>
          </article>
        </section>
      </header>

      <div id="automation-content" tabIndex="-1">
        {mode === 'عملیات' && (
          <>
            <ProductStory apiStatus={apiStatus} />
            <ProblemSolutionSection />
            <section className="content-grid">
              <article className="panel flow-list">
                <div className="panel-head">
                  <div>
                    <p className="label">Workflowهای فعال</p>
                    <h2>سناریوهای اتوماسیون</h2>
                  </div>
                  <span className="badge">{mode}</span>
                </div>
                <div className="flow-buttons">
                  {workflows.map((flow) => (
                    <button
                      className={selected.name === flow.name ? 'flow selected' : 'flow'}
                      key={flow.name}
                      onClick={() => setSelectedName(flow.name)}
                      type="button"
                    >
                      <span>{flow.name}</span>
                      <small>{flow.trigger} به {flow.target}</small>
                      <i style={{ width: `${flow.health}%` }} />
                    </button>
                  ))}
                </div>
              </article>

              <WorkflowCanvas selected={selected} />

              <article className="panel detail">
                <p className="label">جزئیات Workflow</p>
                <h2>{selected.name}</h2>
                <dl>
                  <div><dt>وضعیت</dt><dd>{selected.status}</dd></div>
                  <div><dt>تعداد اجرا</dt><dd>{selected.runs}</dd></div>
                  <div><dt>سلامت</dt><dd>{selected.health}%</dd></div>
                </dl>
              </article>

              <HistoryPanel history={runState.history} />
            </section>
            <ArchitectureSection />
            <OfferSection />
            <PricingSection />
            <ValueSection />
            <SuiteLinks />
          </>
        )}

        {mode === 'Workflow' && (
          <>
            <section className="content-grid single">
              <Runner selected={selected} runState={runState} setRunState={setRunState} notify={notify} />
              <RecommendationWizard selectedPain={selectedPain} setSelectedPain={setSelectedPain} />
            </section>
            <PayloadPreview selected={selected} />
          </>
        )}

        {mode === 'API' && (
          <>
            <section className="api-grid">
              {apiServices.map(([name, use, auth]) => (
                <article className="panel api-card" key={name}>
                  <span>{name}</span>
                  <h2>{use}</h2>
                  <p>روش اتصال: {auth}</p>
                </article>
              ))}
            </section>
            <PayloadPreview selected={selected} />
          </>
        )}

        {mode === 'گزارش' && (
          <section className="content-grid single">
            <HistoryPanel history={runState.history} />
            <article className="panel report-panel">
              <p className="label">گزارش عملکرد</p>
              <h2>خلاصه ماهانه</h2>
              <div className="report-bars">
                {workflows.map((flow) => (
                  <div key={flow.name}>
                    <span>{flow.name}</span>
                    <i><b style={{ width: `${flow.health}%` }} /></i>
                    <strong>{flow.health}%</strong>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}
      </div>
    </main>
  )
}

export default App
