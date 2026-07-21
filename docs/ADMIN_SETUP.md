# Admin Setup

The admin console uses Firebase Authentication plus either an `admin: true` custom claim or the standalone backend's server-only `BACKEND_ADMIN_EMAILS` allowlist. It no longer accepts shared hardcoded production credentials or treats every signed-in customer as an administrator.

Follow [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) to:

1. configure the Firebase project and App Check;
2. initialize secured commerce configuration;
3. grant the first named admin account;
4. configure payment and notification adapters;
5. migrate legacy products and opening stock;
6. deploy Functions, rules, indexes, Storage rules, and the web application;
7. run the complete acceptance checklist.

Admin access is enforced by the standalone backend for all privileged reads and mutations. Firebase Security Rules still protect any permitted browser reads. Hiding the route in React is not treated as authorization.

For the standalone deployment path, follow [BACKEND_DEPLOYMENT.md](./BACKEND_DEPLOYMENT.md).
