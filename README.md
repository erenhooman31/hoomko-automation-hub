# هاب اتوماسیون کسب و کار

نمونه کار فارسی برای نمایش طراحی و توسعه داشبورد پایش Workflow، Webhook، اتصال سرویس ها و فرآیندهای n8n / API Integration.

## لینک ها

- نسخه آنلاین: https://hoomko-automation-hub.vercel.app
- مخزن GitHub: https://github.com/erenhooman31/hoomko-automation-hub

## مطالعه موردی

### مسئله

بسیاری از کسب و کارها لید، پرداخت، پیامک، CRM و گزارش فروش را دستی یا با ابزارهای پراکنده پیگیری می کنند. این وضعیت باعث تاخیر، خطای انسانی و نبود گزارش قابل اعتماد می شود.

### راهکار

این پروژه یک مرکز کنترل اتوماسیون فارسی است که Workflowها، اجرای مرحله ای، خطای قابل بازیابی، Payload ورودی/خروجی و پیشنهاد اتوماسیون بر اساس درد کسب و کار را نمایش می دهد.

### قابلیت های کلیدی

- فهرست Workflowهای فعال برای CRM، پیامک، گزارش و همگام سازی سفارش
- اجرای آزمایشی مرحله به مرحله با وضعیت موفق، خطا و تلاش مجدد
- شبیه سازی خطا برای نمایش Retry و ذخیره تاریخچه اجرا در `localStorage`
- پیش نمایش Payload ورودی Webhook/API و خروجی تبدیل شده
- Wizard پیشنهاد اتوماسیون بر اساس مشکل کسب و کار
- گزارش سلامت Workflowها و تاریخچه اجرا
- Vercel Function برای health check و اجرای دمو Workflow
- بخش معماری اتوماسیون، پکیج فروش و لینک به محصولات دیگر مجموعه Hoomko
- پشتیبانی از SEO، RTL، skip link و فوکوس قابل مشاهده برای کیبورد

### فناوری ها

React، Vite، CSS، `@fontsource/vazirmatn`، Vercel Functions، داده های نمونه امن و بدون کلید API واقعی.

### API دمو

- `GET /api/health`
- `GET|POST /api/workflow-run`
- `POST /api/contact`

## راه اندازی Supabase رایگان

1. در Supabase یک پروژه رایگان بسازید.
2. فایل `supabase/schema.sql` را در SQL Editor اجرا کنید.
3. مقادیر `.env.example` را در Vercel Environment Variables قرار دهید.
4. بعد از Deploy، Run history در جدول `automation_runs` ذخیره می شود.

## n8n

Workflow قابل import در `n8n-workflows/lead-to-crm-and-sms.json` قرار دارد.

## اجرای محلی

```bash
npm install
npm run dev
```
