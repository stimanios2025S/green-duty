# GreenDuty — Custom Software for Industry

We build personalized software for factories and industrial businesses: **ERP, MES and CRM** systems shaped around each client's exact processes, terminology and rules — plus custom web and mobile applications and integrations.

## What we build

- **Personalized ERP** — production, procurement, stock, costing and payroll, modelled on your real process
- **MES** — live shop-floor capture of output, downtime, scrap and quality
- **CRM** — leads, quotations and customer history connected to the orders and invoices that follow
- **Custom web & mobile apps** and **integrations** with the systems you already run

## The platform

| Area | Route | Purpose |
|---|---|---|
| Marketing site | `/`, `/catalogue`, `/partners`, `/b2b` | What we build, the catalogue, partners, contact |
| Ordering | `/order/new` | A client picks an offering, picks a design direction, describes the project |
| Client portal | `/portal` | The client's own projects, roadmap, specification, invoices and payments |
| Owner dashboard | `/dashboard` | Orders, clients, projects, finance and partners |

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · anime.js · libSQL/Turso · bcryptjs · Resend · three.js (login scene)

## Getting started

```bash
npm install
npm run dev
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Purpose |
|---|---|
| `SESSION_SECRET` | Signs the session cookie. **Required in production** (16+ characters). |
| `OWNER_EMAIL` | The account that gets the owner dashboard. Case-insensitive. |
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | Hosted database. When unset, a local SQLite file in `data/` is used. |
| `RESEND_API_KEY` / `EMAIL_FROM` | Verification emails. |
| `SALES_EMAIL` / `WHATSAPP_NUMBER` | Contact options on the ordering page (hidden when unset). |

> **Database:** production uses Turso/libSQL and persists across deploys. Local development uses a SQLite file — it is not the same data.

## Deploy

Deployed on Vercel. Pushing to the connected branch triggers a production deployment.