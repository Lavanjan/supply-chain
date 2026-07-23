# Supply Chain & Inventory Management System

Enterprise inventory and supply chain management for prisons, hospitals, government
institutions, schools, hotels and companies.

## Tech Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- PostgreSQL + Prisma ORM (driver adapters, `@prisma/adapter-pg`)
- Auth.js v5 (Credentials + JWT sessions)
- Ant Design v5 + Tailwind CSS v4
- Zustand, React Hook Form, Zod, Recharts

## Getting Started

1. Copy `.env.example` to `.env` and fill in `DATABASE_URL` (and optionally SMTP settings
   for password reset emails — without them, reset links are logged to the console).

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Run migrations and seed roles/permissions/the default admin user:

   ```bash
   pnpm prisma migrate dev
   pnpm prisma db seed
   ```

   This creates the `ADMIN` and `MANAGER` roles with their permission sets and a default
   administrator (`admin@supplychain.local` / `Admin@12345` unless overridden via
   `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`). Change this password after first login.

4. Start the dev server:

   ```bash
   pnpm dev
   ```

## Project Status — Phase 1 (Foundation)

Completed: project setup, enterprise feature-based folder structure, full Prisma schema for
every ERP module, RBAC (Roles/Permissions), Auth.js v5 authentication (login, remember me,
account lockout, forgot/reset password), theming (light/dark via Ant Design + Tailwind),
and the responsive app shell (fixed sidebar on desktop, collapsible on tablet, drawer on
mobile; header; footer).

Business modules (Products, Suppliers, Inventory, Purchase Orders, etc.) are built
incrementally in subsequent phases on top of this foundation.

## Architecture

Enterprise feature-based structure with a repository → service → API layering:

- `app/` — routes (App Router), grouped into `(auth)` and `(dashboard)` route groups
- `features/` — feature-scoped UI (components, actions) per module
- `components/` — shared UI primitives and layout shell
- `services/` — business logic
- `repositories/` — Prisma data access
- `lib/` — auth config, RBAC, constants, validation schemas, db client
- `prisma/` — schema, migrations, seed
