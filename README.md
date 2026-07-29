# Khurja@Gng — Potters Central

Handcrafted pottery & ceramics e-commerce platform for artisans from Khurja.
A React storefront that talks directly to Firebase (Auth, Firestore) via the client SDK
and to Cloudinary for image storage — no custom backend.

> **New here?** Read [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) first — it explains
> how every piece fits together and, crucially, **how each feature behaves once deployed**
> (image upload, product editing, checkout, orders, etc.).

---

## 1. What this project is

One deployable application:

| App | Folder | Runtime | Deploys to |
|-----|--------|---------|------------|
| **Storefront + Admin console** | `src/` | React 18 + Vite | Static host (Vercel) |

Its data/storage layer is two managed services:

- **Firebase** — Authentication (customer & admin identities, email/password) and Cloud
  Firestore (catalogue, orders, inventory, sellers, config, audit trail).
- **Cloudinary** — product photos, the payment QR, and payment-proof screenshots, all
  uploaded directly from the browser via an unsigned upload preset.

There is no backend, no service account, and no Firebase Storage. **`firestore.rules`
is the single source of truth for anything sensitive or transactional** — pricing, stock
reservations, order state, seller payouts, admin authorization. The browser never
bypasses it; every write is a client SDK call that either satisfies the rules or is
rejected.

---

## 2. Tech stack

**Frontend:** React 18, React Router 6, Vite 8, Tailwind CSS 3, lucide-react, Firebase Web SDK 12.
**Tooling:** ESLint, Node test runner, Playwright (e2e), Firebase emulators + rules-unit-testing.

---

## 3. Repository layout

```
KhurjaPotteryGurgaon/
├── README.md                 ← you are here (start point)
├── index.html                ← Vite HTML entry
├── vite.config.js            ← Vite dev/build config (no backend proxy)
├── vercel.json               ← SPA rewrite so client-side routes work on Vercel
├── package.json              ← frontend scripts & deps
├── tailwind.config.js  postcss.config.js  .eslintrc.cjs
├── .env.example              ← frontend env template (copy to .env)
├── .firebaserc.example       ← Firebase project id template (copy to .firebaserc)
│
├── firebase.json             ← Firestore rules + emulator config
├── firestore.rules           ← Firestore security rules (authoritative — the only enforcement layer)
├── firestore.indexes.json    ← Firestore composite indexes
│
├── src/                      ← FRONTEND source
│   ├── main.jsx  App.jsx     ← entry + routes (lazy-loaded pages)
│   ├── config/               ← firebase.js (SDK init, App Check), cloudinary.js (unsigned upload config)
│   ├── context/              ← Auth, Cart, Wishlist React contexts
│   ├── components/           ← shared UI + about/ + admin/ tab components
│   ├── pages/                ← storefront pages + pages/admin/ console
│   ├── hooks/                ← data hooks (products, orders, categories, config, profile)
│   ├── services/             ← commerceApi, catalogueApi, productImages, paymentUploads (direct Firebase/Cloudinary calls)
│   ├── lib/commerce.js       ← shared money/variant/normalization helpers
│   └── data/                 ← legacy static product data (NOT imported by the app)
│
├── tests/                    ← frontend unit (commerce.test.js), e2e/, rules/
└── docs/                     ← all setup & deployment guides (see docs/README.md)
```

Build outputs (`dist/`), `node_modules/`, and every `.env*` secret are **git-ignored**
and never committed.

---

## 4. Quick start (local development)

Prerequisites: **Node 20.19+** and npm.

```bash
npm install
cp .env.example .env                 # fill in Firebase web config + Cloudinary values
cp .firebaserc.example .firebaserc   # set your Firebase project id
npm run dev                          # http://localhost:5173
```

There is nothing else to run locally — the app talks to Firebase and Cloudinary
directly. Full step-by-step (including App Check, initial admin grant, initial commerce
configuration) is in [`docs/IMPLEMENTATION_GUIDE.md`](./docs/IMPLEMENTATION_GUIDE.md).

---

## 5. Environment variables

`.env`, values prefixed `VITE_` are public client config (shipped in the browser build —
none of these are secrets):

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_API_KEY` … `VITE_FIREBASE_APP_ID` | Firebase web config (public) |
| `VITE_FIREBASE_APPCHECK_SITE_KEY` | reCAPTCHA v3 site key for App Check |
| `VITE_FIREBASE_USE_EMULATORS` | `true` to use local emulators in dev |
| `VITE_CLOUDINARY_CLOUD_NAME` / `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary unsigned upload preset — the only image upload path (product photos, payment QR, payment-proof screenshots) |

> ⚠️ **Secrets:** `.env` and `.env.local` still shouldn't be committed (git-ignored), if
> only to keep project-specific config out of source control. There is no service
> account, no Cloudinary API secret, and no other server-only credential in this
> project — everything the frontend needs is public client config.

---

## 6. Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint (zero-warning policy) |
| `npm test` | Frontend commerce unit tests |
| `npm run test:e2e` | Playwright smoke tests |
| `npm run test:rules` | Firestore rules tests (needs Java + emulators) |
| `npm run validate` | lint + test + build (the CI gate) |

---

## 7. Testing

```bash
npm run validate          # lint + unit + build
npm run test:rules        # Firestore rules (requires Java)
npm run test:e2e          # Playwright (requires a running app)
```

See [`docs/IMPLEMENTATION_GUIDE.md`](./docs/IMPLEMENTATION_GUIDE.md) §9 for the full
acceptance checklist.

---

## 8. Deployment (overview)

Two independent deploys against one Firebase project:

1. **Firebase rules & indexes** — `firebase deploy --only firestore:rules,firestore:indexes`
2. **Frontend** — import the repo into a static host, add the `VITE_*` env vars, deploy.
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
| [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) | Firestore rules + frontend deploy |
| [`docs/IMPLEMENTATION_GUIDE.md`](./docs/IMPLEMENTATION_GUIDE.md) | Full commerce setup + acceptance checklist |

## Color theme

Cream `#F5F1E8` · Brown `#8B4513` (light `#D4A574`, dark `#5C2E0A`) · Purple `#6B46C1`
(light `#B19CD9`, dark `#4C1D95`).
