# Admin Setup

There is no backend and no custom claim. Admin authorization is a single Firestore
field: a user is an administrator if their `users/{uid}` document has `isAdmin: true`.
`firestore.rules`'s `isAdmin()` helper checks exactly that field, and every rule that
protects catalogue writes, order transitions, inventory, seller ledgers, and commerce
config calls it. Hiding the admin route in React is not authorization — Firestore rules
are the real boundary.

## Granting admin access

1. Have the person sign up normally (Firebase Authentication email/password), which
   creates their `users/{uid}` profile document.
2. In the [Firebase Console](https://console.firebase.google.com) → Firestore Database
   → Data tab, open `users/{uid}` for that account.
3. Add/edit the field `isAdmin` (boolean) and set it to `true`. Save.
4. The user must sign out and back in (or the app must re-read the profile doc) to see
   the admin UI.

Do not share one operator's login across multiple people — grant each person their own
account and flip `isAdmin` on their own document.

Follow [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for the rest of the initial
setup: Firebase project + App Check, initial commerce configuration, and the full
acceptance checklist.
