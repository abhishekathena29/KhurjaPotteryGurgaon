# Khurja@Gng — Potters Central

Handcrafted pottery & ceramics e-commerce platform for artisans from Khurja.
A React storefront + a trusted Node commerce backend, built on Firebase
(Auth, Firestore, Storage) with a provider-neutral payment/notification layer.

> **New here?** Read [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) first — it explains
> how every piece fits together and, crucially, **how each feature behaves once deployed**
> (image upload, product editing, checkout, orders, etc.).

---

## 1. What this project is

Two deployable applications that share one Firebase project:

| App | Folder | Runtime | Deploys to |
|-----|--------|---------|------------|
| **Storefront + Admin console** (frontend) | `src/` | React 18 + Vite | Vercel (static site) |
| **Commerce API** (backend) | `functions/` | Node 20 + Express (TypeScript) | Any Node host / Docker |

They rely on three managed services:

- **Firebase Authentication** — customer & admin identities (email/password).
- **Cloud Firestore** — catalogue, orders, inventory, sellers, config, audit trail.
- **Firebase Storage** *(optional)* — product image files (the backend can also store images on local disk).

The backend is the **single source of truth** for anything sensitive or transactional:
pricing, stock reservations, order state, seller payouts, admin authorization. The
browser never writes prices, stock, or order totals directly.

---

## 2. Tech stack

**Frontend:** React 18, React Router 6, Vite 8, Tailwind CSS 3, lucide-react, Firebase Web SDK 12.
**Backend:** Node 20, Express 5, TypeScript 5, firebase-admin 13, zod (validation), multer (uploads).
**Tooling:** ESLint, Node test runner, Playwright (e2e), Firebase emulators + rules-unit-testing.

---

## 3. Repository layout

```
KhurjaPotteryGurgaon/
├── README.md                 ← you are here (start point)
├── index.html                ← Vite HTML entry
├── vite.config.js            ← dev server + /api proxy to the backend
├── vercel.json               ← SPA rewrite so client-side routes work on Vercel
├── package.json              ← frontend scripts & deps
├── tailwind.config.js  postcss.config.js  .eslintrc.cjs
├── .env.example              ← frontend env template (copy to .env)
├── .firebaserc.example       ← Firebase project id template (copy to .firebaserc)
│
├── firebase.json             ← Firestore/Storage rules + emulator config
├── firestore.rules           ← Firestore security rules (authoritative)
├── firestore.indexes.json    ← Firestore composite indexes
├── storage.rules             ← Storage security rules (admin-only image writes)
│
├── src/                      ← FRONTEND source
│   ├── main.jsx  App.jsx     ← entry + routes (lazy-loaded pages)
│   ├── config/               ← firebase.js (SDK init, App Check), cloudinary.js (legacy, unused)
│   ├── context/              ← Auth, Cart, Wishlist React contexts
│   ├── components/           ← shared UI + about/ + admin/ tab components
│   ├── pages/                ← storefront pages + pages/admin/ console
│   ├── hooks/                ← data hooks (products, orders, categories, config, profile)
│   ├── services/             ← backendClient, commerceApi, catalogueApi, productImages
│   ├── lib/commerce.js       ← shared money/variant/normalization helpers
│   └── data/                 ← legacy static product data (NOT imported by the app)
│
├── functions/                ← BACKEND source (see functions/README.md)
│   ├── src/
│   │   ├── server.ts         ← Express app = the deployable backend (entry)
│   │   ├── index.ts          ← all commerce/admin operations + jobs (handlers)
│   │   ├── domain.ts         ← pure business logic (money, SKU, stock, payments…)
│   │   ├── schemas.ts        ← zod request schemas
│   │   ├── *.test.ts         ← domain + server tests
│   │   └── scripts/          ← seed-config, grant-admin, migrate-products
│   ├── Dockerfile            ← production container for the backend
│   ├── tsconfig.json  package.json
│   └── .env.example          ← backend env template (copy to functions/.env)
│
├── tests/                    ← frontend unit (commerce.test.js), e2e/, rules/
└── docs/                     ← all setup & deployment guides (see docs/README.md)
```

Build outputs (`dist/`, `functions/lib/`), public uploads (`functions/uploads/`), private payment proofs (`functions/private-uploads/`),
`node_modules/`, and every `.env*` secret are **git-ignored** and never committed.

---

## 4. Quick start (local development)

Prerequisites: **Node 20.19+** and npm.

### 4.1 Frontend

```bash
npm install
cp .env.example .env          # fill in Firebase web config + backend URL
cp .firebaserc.example .firebaserc   # set your Firebase project id
npm run dev                   # http://localhost:5173
```

### 4.2 Backend (in a second terminal)

```bash
cd functions
npm install
cp .env.example .env          # fill in service account, admin allowlist, secrets
npm run seed:config           # one-time: write commerceConfig/default to Firestore
npm run server                # builds TS, then serves on http://127.0.0.1:3001
```

The Vite dev server proxies `/api/*` to `http://127.0.0.1:3001`, so the frontend
talks to your local backend automatically. Health check: `GET /api/health`.

Full step-by-step (including App Check, admin grant, migration) is in
[`docs/IMPLEMENTATION_GUIDE.md`](./docs/IMPLEMENTATION_GUIDE.md) and
[`docs/BACKEND_DEPLOYMENT.md`](./docs/BACKEND_DEPLOYMENT.md).

---

## 5. Environment variables

### Frontend (`.env`, values prefixed `VITE_` are public client config)

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_API_KEY` … `VITE_FIREBASE_APP_ID` | Firebase web config (public) |
| `VITE_FIREBASE_APPCHECK_SITE_KEY` | reCAPTCHA v3 site key for App Check |
| `VITE_FIREBASE_USE_EMULATORS` | `true` to use local emulators in dev |
| `VITE_BACKEND_API_URL` | `/api` when co-hosted, or the full `https://backend/api` origin |
| `VITE_IMAGE_UPLOAD_DRIVER` | `backend` (default) or `cloudinary` (free image hosting — no paid Firebase Storage) |
| `VITE_CLOUDINARY_CLOUD_NAME` / `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary cloud + **unsigned** preset; required when the driver is `cloudinary` |
| `BACKEND_DEV_PROXY_TARGET` | dev-only; where Vite proxies `/api` (not shipped to the browser) |

### Backend (`functions/.env`, **server-only secrets — never prefix with `VITE_`**)

Seed values (`COMMERCE_CURRENCY`, `COD_*`, `SKU_*`, `ORDER_*`, `BEST_SELLER_*`, …) plus
runtime secrets: `FIREBASE_SERVICE_ACCOUNT_BASE64`, `FIREBASE_STORAGE_BUCKET`,
`BACKEND_ADMIN_EMAILS`, `BACKEND_ALLOWED_ORIGINS`, `BACKEND_ENFORCE_APP_CHECK`,
`BACKEND_CRON_SECRET`, `BACKEND_STORAGE_DRIVER`, and the payment/notification adapter
credentials. See [`functions/.env.example`](./functions/.env.example) for the full list.

> ⚠️ **Secrets:** `.env`, `.env.local`, `functions/.env`, and any service-account JSON
> hold real credentials. They are git-ignored — keep them that way. In production, set
> them as host/CI secrets (Vercel env vars for the frontend, host secret manager for the
> backend). Never commit them or bake them into the Docker image.

---

## 6. Scripts

### Frontend (repo root)

| Command | What it does |
|---------|--------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint (zero-warning policy) |
| `npm test` | Frontend commerce unit tests |
| `npm run test:e2e` | Playwright smoke tests |
| `npm run test:rules` | Firestore rules tests (needs Java + emulators) |
| `npm run validate` | lint + test + build + functions test (the CI gate) |

### Backend (`functions/`)

| Command | What it does |
|---------|--------------|
| `npm run build` | Compile TypeScript → `lib/` |
| `npm run server` | Build then run the Express backend (dev) |
| `npm start` | Run the already-built backend (`lib/server.js`) |
| `npm test` / `npm run test:server` | Domain / server tests |
| `npm run seed:config` | Initialize `commerceConfig/default` |
| `npm run grant:admin -- email@x.com` | Grant the `admin` custom claim |
| `npm run migrate` | Migrate legacy catalogue (dry-run by default) |

---

## 7. Testing

```bash
npm run validate          # lint + unit + build + functions domain tests
npm --prefix functions run test:server   # backend integration tests
npm run test:rules        # Firestore rules (requires Java)
npm run test:e2e          # Playwright (requires a running app)
```

All of `validate`, the functions domain tests, and the server tests are green in this
repository. See [`docs/IMPLEMENTATION_GUIDE.md`](./docs/IMPLEMENTATION_GUIDE.md) §10 for
the full acceptance checklist.

---

## 8. Deployment (overview)

Three independent deploys against one Firebase project:

1. **Firebase rules & indexes** — `firebase deploy --only firestore:rules,firestore:indexes,storage`
2. **Backend** — deploy `functions/` as a Node 20 web service (Docker image provided).
   Build `npm ci && npm run build`, start `npm start`, health `/api/health`.
   See [`docs/BACKEND_DEPLOYMENT.md`](./docs/BACKEND_DEPLOYMENT.md).
3. **Frontend** — import the repo into Vercel, add the `VITE_*` env vars, set
   `VITE_BACKEND_API_URL` to the deployed backend origin, deploy.
   See [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md).

**How each feature behaves in production** — image upload, product editing, checkout,
orders, seller payouts, best sellers, requests — is documented end-to-end in
[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

---

## 9. Documentation index

| Doc | Use it for |
|-----|-----------|
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | System design, data flow, **how each feature works when deployed** |
| [`docs/SETUP.md`](./docs/SETUP.md) | Minimal local setup |
| [`docs/ADMIN_SETUP.md`](./docs/ADMIN_SETUP.md) | Admin authorization model |
| [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) | Frontend deploy on Vercel |
| [`docs/BACKEND_DEPLOYMENT.md`](./docs/BACKEND_DEPLOYMENT.md) | Standalone backend deploy |
| [`docs/IMPLEMENTATION_GUIDE.md`](./docs/IMPLEMENTATION_GUIDE.md) | Full commerce setup + acceptance checklist |
| [`docs/BACKEND_ENHANCEMENT_PLAN.md`](./docs/BACKEND_ENHANCEMENT_PLAN.md) | Design rationale / data model reference |
| [`functions/README.md`](./functions/README.md) | Backend API reference |

## Color theme

Cream `#F5F1E8` · Brown `#8B4513` (light `#D4A574`, dark `#5C2E0A`) · Purple `#6B46C1`
(light `#B19CD9`, dark `#4C1D95`).
