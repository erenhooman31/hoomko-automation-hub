import { useMemo, useState } from 'react'
import './App.css'

const workflows = [
  { name: 'ثبت لید از فرم سایت', trigger: 'Webhook', target: 'CRM', runs: 248, health: 98, status: 'فعال' },
  { name: 'ارسال پیامک بعد از پرداخت', trigger: 'Payment API', target: 'SMS', runs: 416, health: 93, status: 'فعال' },
  { name: 'گزارش فروش روزانه', trigger: 'Cron', target: 'Email', runs: 31, health: 100, status: 'فعال' },
  { name: 'همگام سازی سفارش ها', trigger: 'WooCommerce', target: 'Database', runs: 128, health: 89, status: 'پایش' },
]

const logs = [
  ['09:18', 'Webhook دریافت شد', 'موفق'],
  ['09:19', 'اعتبارسنجی شماره تماس', 'موفق'],
  ['09:20', 'ثبت رکورد در CRM', 'موفق'],
  ['09:21', 'ارسال پیامک خوش آمدگویی', 'در انتظار'],
]

const apiServices = [
  ['CRM', 'ارسال لید و وضعیت پیگیری', 'REST'],
  ['Payment', 'ثبت پرداخت موفق و ناموفق', 'Webhook'],
  ['SMS', 'ارسال پیامک تراکنشی', 'API Key'],
  ['Email', 'گزارش روزانه و هشدار', 'SMTP'],
]

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

function LogsPanel() {
  return (
    <article className="panel logs">
      <div className="panel-head">
        <div>
          <p className="label">Run log</p>
          <h2>آخرین اجرای آزمایشی</h2>
        </div>
        <span className="badge live">زنده</span>
      </div>
      {logs.map(([time, event, status]) => (
        <div className="log-row" key={`${time}-${event}`}>
          <time>{time}</time>
          <span>{event}</span>
          <strong>{status}</strong>
        </div>
      ))}
    </article>
  )
}

function App() {
  const [selected, setSelected] = useState(workflows[0])
  const [mode, setMode] = useState('عملیات')

  const successRate = useMemo(() => {
    const total = workflows.reduce((sum, flow) => sum + flow.health, 0)
    return Math.round(total / workflows.length)
  }, [])

  return (
    <main className="shell" dir="rtl">
      <header className="hero">
        <nav>
          <strong>هاب اتوماسیون</strong>
          <div>
            {['عملیات', 'Workflow', 'API', 'گزارش'].map((item) => (
              <button className={mode === item ? 'active' : ''} key={item} onClick={() => setMode(item)} type="button">
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

      {mode === 'عملیات' && <section className="content-grid">
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
                onClick={() => setSelected(flow)}
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

        <LogsPanel />
      </section>}

      {mode === 'Workflow' && (
        <section className="content-grid single">
          <WorkflowCanvas selected={selected} />
          <article className="panel recipe">
            <p className="label">طراحی Workflow</p>
            <h2>{selected.name}</h2>
            {['تعریف Trigger', 'پاکسازی داده', 'ارسال به سرویس مقصد', 'ثبت لاگ و هشدار خطا'].map((item, index) => (
              <div className="recipe-step" key={item}>
                <span>{index + 1}</span>
                <p>{item}</p>
              </div>
            ))}
          </article>
        </section>
      )}

      {mode === 'API' && (
        <section className="api-grid">
          {apiServices.map(([name, use, auth]) => (
            <article className="panel api-card" key={name}>
              <span>{name}</span>
              <h2>{use}</h2>
              <p>روش اتصال: {auth}</p>
            </article>
          ))}
        </section>
      )}

      {mode === 'گزارش' && (
        <section className="content-grid single">
          <LogsPanel />
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
    </main>
  )
}

export default App
