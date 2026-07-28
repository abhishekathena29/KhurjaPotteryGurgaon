# Documentation

Guides for setting up, running, and deploying Potters Central. Start with the
[project README](../README.md), then use this index.

## Read in this order

1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** — how the whole system fits together and
   **how each feature works once deployed** (image upload, product editing, checkout,
   orders, payments, sellers). Start here to understand the app.
2. **[SETUP.md](./SETUP.md)** — minimal local setup for the frontend.
3. **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** — the complete commerce
   setup: Firebase project, App Check, initial commerce configuration, admin grant,
   and the full acceptance checklist.
4. **[ADMIN_SETUP.md](./ADMIN_SETUP.md)** — the admin authorization model in brief.

## Deployment

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** — deploy the Firestore rules/indexes and the
  React frontend (routing, env vars, troubleshooting).

## Note

`SETUP.md` predates the commerce features (it describes the original static frontend)
and is kept for history. For anything current, prefer the project README and
`ARCHITECTURE.md`.
