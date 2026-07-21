import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

initializeApp({ credential: applicationDefault() });

const email = process.argv[2];
if (!email) throw new Error("Usage: npm run grant:admin -- admin@example.com");

getAuth().getUserByEmail(email)
  .then(async (user) => {
    await getAuth().setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), admin: true });
    process.stdout.write(`Admin claim granted to ${email}. The user must sign in again.\n`);
  })
  .catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
