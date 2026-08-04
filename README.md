# 🌿 GreenDuty — Agri-Tech & Environmental Platform

Uniting agriculture, technology, and environmental action for a sustainable future.

## ✨ Features

- **🔐 Real Authentication** — SQLite database (`node:sqlite`), bcrypt password hashing, email verification via Resend (6-digit code, 10-min expiry)
- **👥 Role-based accounts** — Guest/Citizen, Buyer, Seller, Driver, Business
  - Buyers & Drivers verify with ID Card / Driver's License / Passport
  - Businesses provide company name & address
- **🎛️ Role-specific portals** — each account type sees only its relevant dashboard & tabs
- **📸 Instagram-style Knowledge Feed** — stories row, post cards with like/save/comment
- **🗺️ Eco Action Map** — report pollution hotspots, join cleanups, sponsors, leaderboard
- **🛒 Agri-Tech Marketplace** — quality-assured products with category filters
- **🌳 Tree Tracker** — reforestation progress, planting events, tree sponsorship
- **🏢 B2B Engineering** — agri-tech services, live greenhouse demo
- **🐦 Scroll-companion bird** — anime.js animated bird that flies between landing sections
- **🎨 Moody dark theme** — amber→green monochrome palette with glass morphism & glow effects

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 🔑 Environment Variables

Copy `.env.example` to `.env.local`:

| Variable | Required | Description |
|---|---|---|
| `RESEND_API_KEY` | For real emails | Get a free key at [resend.com/api-keys](https://resend.com/api-keys) |
| `EMAIL_FROM` | No | Sender address (default: `GreenDuty <onboarding@resend.dev>`) |

> **Email note:** Resend's sandbox sender only delivers to the email registered on your Resend account. To send verification codes to **everyone**, verify a domain in Resend (Dashboard → Domains → Add → DNS records) and set `EMAIL_FROM` to that domain.

> **Database note:** Local dev uses a SQLite file at `data/greenduty.db` (gitignored, auto-created).

## ☁️ Deploy to Vercel

1. Push this repo to GitHub (done)
2. In Vercel: **Import Project** → select `green-duty` → **Deploy**
3. Add env vars in Vercel → Project → Settings → Environment Variables:
   - `RESEND_API_KEY` (your Resend key — never commit it)
   - `EMAIL_FROM` (optional)
4. **Important:** Vercel's serverless filesystem is ephemeral — the local SQLite file won't persist across redeploys. For production, switch the DB layer to a hosted option (Turso / Supabase / Vercel Postgres). The schema lives in `lib/db.ts`.

## 🧱 Tech Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · anime.js · node:sqlite · bcryptjs · Resend · lucide-react
