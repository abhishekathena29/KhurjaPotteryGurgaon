import test from "node:test";
import assert from "node:assert/strict";
import {
  allowedFulfilmentTransition,
  buildSearchTokens,
  calculateMargin,
  calculateSalePrice,
  deriveStockStatus,
  formatSku,
  normalizeSku,
  reserveInventory,
  commitInventory,
  releaseInventory,
  restoreCommittedInventory,
  validateConfig,
} from "./domain";
import { checkoutSchema } from "./schemas";

test("discount is subtracted from MRP using integer paise", () => {
  assert.equal(calculateSalePrice(99_900, 15), 84_915);
  assert.throws(() => calculateSalePrice(100, 101));
});

test("SKU normalization and allocation are deterministic", () => {
  assert.equal(normalizeSku(" pc / blue  1 "), "PC-BLUE-1");
  assert.equal(formatSku("pc", 6, 42), "PC-000042");
});

test("stock status respects zero and low stock thresholds", () => {
  assert.equal(deriveStockStatus(0, 5), "out_of_stock");
  assert.equal(deriveStockStatus(4, 5), "low_stock");
  assert.equal(deriveStockStatus(6, 5), "in_stock");
});

test("margin includes payout and variable costs", () => {
  assert.deepEqual(calculateMargin(10000, 6000, 1000), { amountPaise: 3000, percent: 30 });
});

test("search tokens normalize and include prefixes", () => {
  const tokens = buildSearchTokens(["Blue Mug", "SKU-101"]);
  assert(tokens.includes("blue"));
  assert(tokens.includes("mu"));
  assert(tokens.includes("sku"));
});

test("fulfilment transitions reject invalid regressions", () => {
  assert.equal(allowedFulfilmentTransition("pending", "confirmed"), true);
  assert.equal(allowedFulfilmentTransition("shipped", "pending"), false);
  assert.equal(allowedFulfilmentTransition("delivered", "cancelled"), false);
});

test("inventory reserve, commit, release and restore remain balanced", () => {
  assert.deepEqual(reserveInventory(5, 1, 2), { onHandQuantity: 5, reservedQuantity: 3, availableQuantity: 2 });
  assert.deepEqual(commitInventory(5, 3, 2), { onHandQuantity: 3, reservedQuantity: 1, availableQuantity: 2 });
  assert.deepEqual(releaseInventory(5, 3, 2), { onHandQuantity: 5, reservedQuantity: 1, availableQuantity: 4 });
  assert.deepEqual(restoreCommittedInventory(3, 1, 2), { onHandQuantity: 5, reservedQuantity: 1, availableQuantity: 4 });
  assert.throws(() => reserveInventory(1, 0, 2), /OUT_OF_STOCK/);
});

test("manual QR payment settings are validated", () => {
  const base = {
    currency: "INR",
    deliveryFeePaise: 5000,
    prepaidEnabled: false,
    reservationTtlMinutes: 15,
    skuPrefix: "PC",
    skuPadding: 6,
    orderPrefix: "ORD",
    orderPadding: 7,
    bestSellerWindowDays: 90,
    bestSellerLimit: 12,
  };
  const legacy = validateConfig(base);
  assert.equal(legacy.manualPaymentVerificationTtlMinutes, 15);
  assert.equal(legacy.manualPaymentQrUrl, "");
  const configured = validateConfig({
    ...base,
    prepaidEnabled: true,
    manualPaymentVerificationTtlMinutes: 1440,
    manualPaymentQrUrl: "https://payments.example/qr.png",
    manualPaymentPayeeName: "Potters Central",
    manualPaymentInstructions: "Pay the exact total.",
  });
  assert.equal(configured.manualPaymentVerificationTtlMinutes, 1440);
  assert.throws(() => validateConfig({ ...base, manualPaymentQrUrl: "javascript:alert(1)" }), /HTTP/);
});

test("checkout accepts online QR payment only and requires proof", () => {
  const checkout = {
    idempotencyKey: "e1c8e42e-e1df-45b2-98f4-3eb52e4e5e76",
    items: [{ productId: "product", variantId: "variant", quantity: 1 }],
    address: {
      fullName: "Test Customer",
      phone: "9999999999",
      line1: "123 Test Street",
      line2: "",
      city: "Gurugram",
      state: "Haryana",
      pincode: "122001",
    },
    paymentMethod: "online",
    paymentProofId: "198441a4-8007-4d7c-a5c3-a9d92324ced2",
  };
  assert.equal(checkoutSchema.safeParse(checkout).success, true);
  assert.equal(checkoutSchema.safeParse({ ...checkout, paymentMethod: "cod" }).success, false);
  assert.equal(checkoutSchema.safeParse({ ...checkout, paymentProofId: undefined }).success, false);
});
