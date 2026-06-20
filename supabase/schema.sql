create extension if not exists pgcrypto;

create table if not exists public.automation_workflows (
  key text primary key,
  name text not null,
  trigger_type text not null,
  target text not null,
  health integer not null check (health between 0 and 100),
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  run_id text not null unique,
  workflow_key text not null,
  status text not null check (status in ('completed', 'failed', 'retrying')),
  steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  product text not null,
  name text not null,
  contact text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists automation_runs_workflow_created_idx on public.automation_runs (workflow_key, created_at desc);
create index if not exists automation_runs_steps_gin_idx on public.automation_runs using gin (steps);
create index if not exists contact_requests_product_created_idx on public.contact_requests (product, created_at desc);

alter table public.automation_workflows enable row level security;
alter table public.automation_runs enable row level security;
alter table public.contact_requests enable row level security;

create policy "public can read workflow demos" on public.automation_workflows
  for select to anon, authenticated using (true);

create policy "authenticated can read automation runs" on public.automation_runs
  for select to authenticated using (true);

create policy "authenticated can manage contact requests" on public.contact_requests
  for all to authenticated using (true) with check (true);

insert into public.automation_workflows (key, name, trigger_type, target, health, status)
values
  ('lead-form', 'ثبت لید از فرم سایت', 'Webhook', 'CRM', 98, 'فعال'),
  ('payment-sms', 'ارسال پیامک بعد از پرداخت', 'Payment API', 'SMS', 93, 'فعال'),
  ('daily-sales', 'گزارش فروش روزانه', 'Cron', 'Email', 100, 'فعال'),
  ('order-sync', 'همگام سازی سفارش ها', 'WooCommerce', 'Database', 89, 'پایش')
on conflict (key) do update set
  name = excluded.name,
  trigger_type = excluded.trigger_type,
  target = excluded.target,
  health = excluded.health,
  status = excluded.status;
