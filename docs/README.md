# Documentation

Guides for setting up, running, and deploying Potters Central. Start with the
[project README](../README.md), then use this index.

## Read in this order

1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** — how the whole system fits together and
   **how each feature works once deployed** (image upload, product editing, checkout,
   orders, payments, sellers). Start here to understand the app.
2. **[SETUP.md](./SETUP.md)** — minimal local setup for the frontend.
3. **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** — the complete commerce
   setup: Firebase project, App Check, config seeding, admin grant, payment/notification
   adapters, catalogue migration, deploy order, and the full acceptance checklist.
4. **[ADMIN_SETUP.md](./ADMIN_SETUP.md)** — the admin authorization model in brief.

## Deployment

- **[BACKEND_DEPLOYMENT.md](./BACKEND_DEPLOYMENT.md)** — deploy the standalone
  Node/Express commerce backend (build/start commands, env, scheduled jobs, migration).
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** — deploy the React frontend on Vercel (routing,
  env vars, troubleshooting).
- **[../functions/README.md](../functions/README.md)** — backend API reference and
  operational scripts.

## Reference

- **[BACKEND_ENHANCEMENT_PLAN.md](./BACKEND_ENHANCEMENT_PLAN.md)** — the design document:
  full Firestore data model, business rules, API list, migration and testing strategy,
  and the required business decisions. Use it as the field-level reference.

## Note

`SETUP.md` predates the commerce backend (it describes the original static frontend) and
is kept for history. For anything current, prefer the project README and
`ARCHITECTURE.md`.
