# ỪnAm SHOP

ỪnAm SHOP is a React-based SMM service platform backed by Supabase and deployed on Vercel.

## Architecture

- React, Vite, and Tailwind CSS frontend
- Supabase PostgreSQL with RLS and database RPCs
- Supabase Auth for account and session management
- Supabase Edge Functions for server-side operations
- Vercel deployment for the frontend

## Features

- Email signup, login, and verification
- OTP password recovery
- Supabase-backed service catalog and platform pages
- Wallet and wallet ledger
- VietQR deposit requests and Zalo admin payment contact
- Admin deposit approval queue
- Database-authoritative order creation
- User and admin RBAC
- Admin catalog and user management
- Provider orchestration foundation

## Project Structure

```text
UnAmShop/
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vercel.json
├── supabase/
│   ├── migrations/
│   └── functions/
├── .github/
├── .gitignore
└── README.md
```

## Local Development

Prerequisites: Node.js 20 or newer and a Supabase project.

```bash
cd frontend
npm install
```

Create `frontend/.env.local` from `frontend/.env.example`, then provide the Supabase project URL, publishable key, and any public payment configuration values required by the frontend.

```bash
npm run dev
```

Build locally with:

```bash
npm run build
```

## Deployment

Set the Vercel Root Directory to `frontend`. Vercel uses `frontend/vercel.json` to serve React Router routes through the Vite application entry point.

Never commit `.env.local` or secret keys.

## Author

Nguyễn Hồ Trường Tâm
