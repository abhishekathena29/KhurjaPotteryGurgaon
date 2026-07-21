import { initializeApp, applicationDefault } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { validateConfig } from "../domain";

initializeApp({ credential: applicationDefault() });

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
};

const integer = (name: string): number => {
  const value = Number(required(name));
  if (!Number.isSafeInteger(value)) throw new Error(`${name} must be an integer`);
  return value;
};

const boolean = (name: string): boolean => {
  const value = required(name);
  if (value !== "true" && value !== "false") throw new Error(`${name} must be true or false`);
  return value === "true";
};

const config = validateConfig({
  currency: "INR",
  deliveryFeePaise: integer("DELIVERY_FEE_PAISE"),
  prepaidEnabled: boolean("PREPAID_ENABLED"),
  reservationTtlMinutes: integer("RESERVATION_TTL_MINUTES"),
  manualPaymentVerificationTtlMinutes: Number(process.env.MANUAL_PAYMENT_VERIFICATION_TTL_MINUTES || required("RESERVATION_TTL_MINUTES")),
  manualPaymentQrUrl: process.env.MANUAL_PAYMENT_QR_URL || "",
  manualPaymentPayeeName: process.env.MANUAL_PAYMENT_PAYEE_NAME || "",
  manualPaymentInstructions: process.env.MANUAL_PAYMENT_INSTRUCTIONS || "",
  skuPrefix: required("SKU_PREFIX"),
  skuPadding: integer("SKU_PADDING"),
  orderPrefix: required("ORDER_PREFIX"),
  orderPadding: integer("ORDER_PADDING"),
  bestSellerWindowDays: integer("BEST_SELLER_WINDOW_DAYS"),
  bestSellerLimit: integer("BEST_SELLER_LIMIT"),
});

const db = getFirestore();
const run = async (): Promise<void> => {
  const batch = db.batch();
  batch.set(db.doc("commerceConfig/default"), { ...config, updatedAt: FieldValue.serverTimestamp() });
  batch.set(db.doc("publicConfig/commerce"), {
    currency: config.currency,
    deliveryFeePaise: config.deliveryFeePaise,
    prepaidEnabled: config.prepaidEnabled,
    manualPaymentQrUrl: config.manualPaymentQrUrl,
    manualPaymentPayeeName: config.manualPaymentPayeeName,
    manualPaymentInstructions: config.manualPaymentInstructions,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
  process.stdout.write("Commerce configuration initialized.\n");
};

run().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
