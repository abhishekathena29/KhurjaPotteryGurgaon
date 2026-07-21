import { createHmac, timingSafeEqual } from "node:crypto";
import { AppOptions, cert, initializeApp } from "firebase-admin/app";
import {
  FieldValue,
  Timestamp,
  getFirestore,
  Transaction,
  DocumentReference,
} from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { defineSecret } from "firebase-functions/params";
import { onCall, onRequest, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { z, ZodError } from "zod";
import {
  CommerceConfig,
  allowedFulfilmentTransition,
  buildSearchTokens,
  calculateSalePrice,
  calculateSellerPayout,
  deriveStockStatus,
  formatSku,
  normalizeSku,
  reserveInventory,
  commitInventory,
  releaseInventory,
  restoreCommittedInventory,
  validateConfig,
} from "./domain";
import {
  cancellationSchema,
  checkoutSchema,
  productRequestSchema,
  productSchema,
} from "./schemas";
import { deleteStoredImage } from "./storage";

const adminOptions = (): AppOptions => {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const serviceAccount = encoded
    ? JSON.parse(Buffer.from(encoded, "base64").toString("utf8"))
    : raw ? JSON.parse(raw) : null;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  if (serviceAccount) {
    return {
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
      ...(storageBucket ? { storageBucket } : {}),
    };
  }
  return storageBucket ? { storageBucket } : {};
};

const resolvedAdminOptions = adminOptions();
initializeApp(Object.keys(resolvedAdminOptions).length ? resolvedAdminOptions : undefined);
const db = getFirestore();
const REGION = "asia-south1";
const callableOptions = {
  region: REGION,
  enforceAppCheck: process.env.BACKEND_ENFORCE_APP_CHECK !== "false",
} as const;
const paymentEndpoint = defineSecret("PAYMENT_PROVIDER_ENDPOINT");
const paymentToken = defineSecret("PAYMENT_PROVIDER_TOKEN");
const paymentWebhookSecret = defineSecret("PAYMENT_WEBHOOK_SECRET");
const notificationEndpoint = defineSecret("NOTIFICATION_WEBHOOK_ENDPOINT");
const notificationToken = defineSecret("NOTIFICATION_WEBHOOK_TOKEN");

type AuthenticatedRequest<T = unknown> = CallableRequest<T> & {
  auth: NonNullable<CallableRequest<T>["auth"]>;
};

const fail = (code: ConstructorParameters<typeof HttpsError>[0], message: string, details?: unknown): never => {
  throw new HttpsError(code, message, details);
};

const parse = <T>(schema: z.ZodSchema<T>, value: unknown): T => {
  try {
    return schema.parse(value);
  } catch (error) {
    if (error instanceof ZodError) fail("invalid-argument", "Validation failed", error.flatten());
    throw error;
  }
};

const requireAuth = <T>(request: CallableRequest<T>): AuthenticatedRequest<T> => {
  if (!request.auth) fail("unauthenticated", "Authentication is required");
  return request as AuthenticatedRequest<T>;
};

const requireAdmin = <T>(request: CallableRequest<T>): AuthenticatedRequest<T> => {
  const authenticated = requireAuth(request);
  const configuredAdmins = new Set((process.env.BACKEND_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean));
  const email = String(authenticated.auth.token.email ?? "").toLowerCase();
  if (authenticated.auth.token.admin !== true && !configuredAdmins.has(email)) {
    fail("permission-denied", "Administrator role is required");
  }
  return authenticated;
};

const configFromEnvironment = (): CommerceConfig | null => {
  const names = [
    "COMMERCE_CURRENCY",
    "DELIVERY_FEE_PAISE",
    "PREPAID_ENABLED",
    "RESERVATION_TTL_MINUTES",
    "SKU_PREFIX",
    "SKU_PADDING",
    "ORDER_PREFIX",
    "ORDER_PADDING",
    "BEST_SELLER_WINDOW_DAYS",
    "BEST_SELLER_LIMIT",
  ] as const;
  if (names.some((name) => process.env[name] === undefined || process.env[name] === "")) return null;
  return validateConfig({
    currency: process.env.COMMERCE_CURRENCY,
    deliveryFeePaise: Number(process.env.DELIVERY_FEE_PAISE),
    prepaidEnabled: process.env.PREPAID_ENABLED === "true",
    reservationTtlMinutes: Number(process.env.RESERVATION_TTL_MINUTES),
    manualPaymentVerificationTtlMinutes: Number(
      process.env.MANUAL_PAYMENT_VERIFICATION_TTL_MINUTES ?? process.env.RESERVATION_TTL_MINUTES,
    ),
    manualPaymentQrUrl: process.env.MANUAL_PAYMENT_QR_URL ?? "",
    manualPaymentPayeeName: process.env.MANUAL_PAYMENT_PAYEE_NAME ?? "",
    manualPaymentInstructions: process.env.MANUAL_PAYMENT_INSTRUCTIONS ?? "",
    skuPrefix: process.env.SKU_PREFIX,
    skuPadding: Number(process.env.SKU_PADDING),
    orderPrefix: process.env.ORDER_PREFIX,
    orderPadding: Number(process.env.ORDER_PADDING),
    bestSellerWindowDays: Number(process.env.BEST_SELLER_WINDOW_DAYS),
    bestSellerLimit: Number(process.env.BEST_SELLER_LIMIT),
  });
};

const getConfig = async (tx?: Transaction): Promise<CommerceConfig> => {
  const ref = db.doc("commerceConfig/default");
  const snapshot = tx ? await tx.get(ref) : await ref.get();
  if (!snapshot.exists) {
    const configured = configFromEnvironment() ?? fail("failed-precondition", "Commerce configuration has not been initialized");
    if (!tx) {
      const batch = db.batch();
      batch.set(ref, { ...configured, updatedAt: timestamp(), initializedFromEnvironment: true });
      batch.set(db.doc("publicConfig/commerce"), {
        currency: configured.currency,
        deliveryFeePaise: configured.deliveryFeePaise,
        prepaidEnabled: configured.prepaidEnabled,
        manualPaymentQrUrl: configured.manualPaymentQrUrl,
        manualPaymentPayeeName: configured.manualPaymentPayeeName,
        manualPaymentInstructions: configured.manualPaymentInstructions,
        updatedAt: timestamp(),
      });
      await batch.commit();
    }
    return configured;
  }
  try {
    return validateConfig(snapshot.data() ?? {});
  } catch (error) {
    return fail("failed-precondition", `Commerce configuration is invalid: ${(error as Error).message}`);
  }
};

const timestamp = () => FieldValue.serverTimestamp();

const slugify = (value: string): string =>
  value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const uniqueVariantKey = (colorId: string, size: string): string =>
  `${colorId.trim().toLowerCase()}::${size.trim().toLowerCase()}`;

const paymentStatusOf = (order: FirebaseFirestore.DocumentData): string =>
  order.payment?.status ?? order.paymentStatus ?? "pending";

const fulfilmentStatusOf = (order: FirebaseFirestore.DocumentData): string =>
  order.fulfilmentStatus ?? order.status ?? "pending";

const updateVariantSummary = (
  summaries: FirebaseFirestore.DocumentData[],
  variantId: string,
  availableQuantity: number,
  stockStatus: string,
): FirebaseFirestore.DocumentData[] => summaries.map((summary) =>
  summary.id === variantId ? { ...summary, availableQuantity, stockStatus } : summary);

const aggregateProductStock = (summaries: FirebaseFirestore.DocumentData[]): { availableQuantity: number; stockStatus: string } => {
  const active = summaries.filter((summary) => summary.status === "active");
  const availableQuantity = active.reduce((sum, summary) => sum + Number(summary.availableQuantity ?? 0), 0);
  const stockStatus = availableQuantity <= 0
    ? "out_of_stock"
    : active.some((summary) => summary.stockStatus === "low_stock") ? "low_stock" : "in_stock";
  return { availableQuantity, stockStatus };
};

const commitOrderInventory = async (
  tx: Transaction,
  orderRef: DocumentReference,
  order: FirebaseFirestore.DocumentData,
  actorId: string,
): Promise<void> => {
  if (order.inventoryState !== "reserved") return;
  const variantRefs = (order.items ?? []).map((item: FirebaseFirestore.DocumentData) =>
    db.doc(`products/${item.productId}/variants/${item.variantId}`));
  const variants = await Promise.all(variantRefs.map((ref: DocumentReference) => tx.get(ref)));
  const productRefs = [...new Map((order.items ?? []).map((item: FirebaseFirestore.DocumentData) =>
    [item.productId, db.doc(`products/${item.productId}`)])).values()] as DocumentReference[];
  const productSnapshots = await Promise.all(productRefs.map((ref) => tx.get(ref)));
  const summariesByProduct = new Map(productSnapshots.map((snapshot) => [snapshot.id, snapshot.data()?.variantSummary ?? []]));
  variants.forEach((variant, index) => {
    if (!variant.exists) fail("data-loss", "Reserved product variant is missing");
    const item = order.items[index];
    const data = variant.data() ?? {};
    const balance = (() => {
      try {
        return commitInventory(Number(data.onHandQuantity), Number(data.reservedQuantity), item.quantity);
      } catch {
        return fail("data-loss", "Inventory reservation is inconsistent");
      }
    })();
    const { onHandQuantity, reservedQuantity, availableQuantity } = balance;
    const stockStatus = deriveStockStatus(availableQuantity, Number(data.lowStockThreshold ?? 0));
    tx.update(variant.ref, { onHandQuantity, reservedQuantity, availableQuantity, stockStatus, updatedAt: timestamp() });
    summariesByProduct.set(item.productId,
      updateVariantSummary(summariesByProduct.get(item.productId) ?? [], item.variantId, availableQuantity, stockStatus));
    tx.set(db.collection("inventoryMovements").doc(), {
      productId: item.productId,
      variantId: item.variantId,
      sku: item.sku,
      type: "sale",
      quantityDelta: -item.quantity,
      orderId: orderRef.id,
      reason: "Order confirmed",
      actorId,
      createdAt: timestamp(),
    });
  });
  for (const productRef of productRefs) {
    const variantSummary = summariesByProduct.get(productRef.id) ?? [];
    tx.update(productRef, { variantSummary, ...aggregateProductStock(variantSummary), updatedAt: timestamp() });
  }
};

const writeEvent = (
  tx: Transaction,
  orderRef: DocumentReference,
  type: string,
  actorId: string,
  data: Record<string, unknown>,
): void => {
  tx.set(orderRef.collection("events").doc(), { type, actorId, ...data, createdAt: timestamp() });
};

const createSellerEarnings = (
  tx: Transaction,
  orderRef: DocumentReference,
  order: FirebaseFirestore.DocumentData,
): void => {
  if (fulfilmentStatusOf(order) !== "delivered" || paymentStatusOf(order) !== "paid") return;
  for (const item of order.items ?? []) {
    if (!item.sellerId || !item.sellerPayoutPerUnitPaise) continue;
    const ref = db.doc(`sellerLedger/${orderRef.id}_${item.variantId}`);
    tx.set(ref, {
      sellerId: item.sellerId,
      orderId: orderRef.id,
      orderNumber: order.orderNumber,
      productId: item.productId,
      variantId: item.variantId,
      sku: item.sku,
      quantity: item.quantity,
      type: "earning",
      amountPaise: item.sellerPayoutPerUnitPaise * item.quantity,
      currency: order.currency,
      status: "payable",
      createdAt: timestamp(),
    });
  }
};

export const updateCommerceConfig = onCall(callableOptions, async (request) => {
  const admin = requireAdmin(request);
  let config: CommerceConfig;
  try {
    config = validateConfig(request.data as Record<string, unknown>);
  } catch (error) {
    config = fail("invalid-argument", (error as Error).message);
  }
  const batch = db.batch();
  batch.set(db.doc("commerceConfig/default"), {
    ...config,
    updatedAt: timestamp(),
    updatedBy: admin.auth.uid,
  });
  batch.set(db.doc("publicConfig/commerce"), {
    currency: config.currency,
    deliveryFeePaise: config.deliveryFeePaise,
    prepaidEnabled: config.prepaidEnabled,
    manualPaymentQrUrl: config.manualPaymentQrUrl,
    manualPaymentPayeeName: config.manualPaymentPayeeName,
    manualPaymentInstructions: config.manualPaymentInstructions,
    updatedAt: timestamp(),
  });
  await batch.commit();
  return { config };
});

export const verifyAdminAccess = onCall(callableOptions, async (request) => {
  const admin = requireAdmin(request);
  return { uid: admin.auth.uid, email: admin.auth.token.email ?? null, isAdmin: true };
});

const publicProduct = (document: FirebaseFirestore.QueryDocumentSnapshot): Record<string, unknown> => {
  const data = document.data();
  if (data.schemaVersion === 2) {
    return {
      id: document.id,
      name: data.name,
      slug: data.slug,
      description: data.description ?? "",
      dimensions: data.dimensions ?? "",
      categoryId: data.categoryId ?? "",
      categoryName: data.categoryName ?? "",
      mrpPaise: data.mrpPaise,
      discountPercent: data.discountPercent ?? 0,
      salePricePaise: data.salePricePaise,
      currency: data.currency ?? "INR",
      images: data.images ?? [],
      variantSummary: data.variantSummary ?? [],
      availableQuantity: data.availableQuantity ?? 0,
      stockStatus: data.stockStatus ?? "out_of_stock",
      status: data.status,
      merchandising: data.merchandising ?? { bestSellerMode: "auto", featured: false },
      isBestSeller: Boolean(data.isBestSeller),
      searchTokens: data.searchTokens ?? [],
      updatedAt: data.updatedAt ?? null,
    };
  }
  const salePricePaise = Math.max(0, Math.round(Number(data.price ?? 0) * 100));
  const colorName = String(data.color || "Unspecified");
  const quantity = Math.max(0, Number(data.quantity ?? 0));
  const imageUrls: string[] = data.imageUrls ?? (data.imageUrl ? [data.imageUrl] : []);
  return {
    id: document.id,
    name: data.name || data.category || "Product",
    description: data.description ?? "",
    dimensions: data.dimensions ?? "",
    categoryName: data.category ?? "",
    mrpPaise: salePricePaise,
    discountPercent: Number(data.discount ?? 0),
    salePricePaise,
    currency: "INR",
    images: imageUrls.map((url, index) => ({ id: `legacy-${index}`, url, alt: data.name || "Product", sortOrder: index })),
    variantSummary: [{
      id: "legacy",
      sku: data.sku || `LEGACY-${document.id.slice(0, 8).toUpperCase()}`,
      color: { id: slugify(colorName) || "unspecified", name: colorName, hex: "" },
      size: String(data.size ?? ""),
      availableQuantity: quantity,
      stockStatus: deriveStockStatus(quantity, 0),
      status: "active",
      imageIds: [],
    }],
    availableQuantity: quantity,
    stockStatus: deriveStockStatus(quantity, 0),
    status: data.isActive === false ? "draft" : "active",
    merchandising: { bestSellerMode: "auto", featured: false },
    isBestSeller: false,
    updatedAt: data.updatedAt ?? null,
  };
};

export const getCatalogue = onCall(callableOptions, async () => {
  const [products, categories, config] = await Promise.all([
    db.collection("products").get(),
    db.collection("categories").get(),
    getConfig(),
  ]);
  return {
    products: products.docs
      .filter((document) => document.data().schemaVersion === 2
        ? document.data().status === "active"
        : document.data().isActive !== false)
      .map(publicProduct),
    categories: categories.docs.map((document) => ({ id: document.id, name: document.data().name })),
    config: {
      currency: config.currency,
      deliveryFeePaise: config.deliveryFeePaise,
      prepaidEnabled: config.prepaidEnabled,
      manualPaymentQrUrl: config.manualPaymentQrUrl,
      manualPaymentPayeeName: config.manualPaymentPayeeName,
      manualPaymentInstructions: config.manualPaymentInstructions,
    },
  };
});

const adminCollectionNames = [
  "products",
  "categories",
  "sellers",
  "orders",
  "productRequests",
  "notifications",
  "sellerLedger",
  "settlements",
] as const;

export const getAdminSnapshot = onCall(callableOptions, async (request) => {
  requireAdmin(request);
  const input = parse(z.object({
    collections: z.array(z.enum(adminCollectionNames)).max(adminCollectionNames.length).default([]),
    includeCommerceConfig: z.boolean().default(false),
  }).refine((value) => value.collections.length > 0 || value.includeCommerceConfig, "Select data to load"), request.data);
  const uniqueCollections = [...new Set(input.collections)];
  const snapshots = await Promise.all(uniqueCollections.map((name) => db.collection(name).limit(1000).get()));
  const result: Record<string, unknown> = {};
  uniqueCollections.forEach((name, index) => {
    result[name] = snapshots[index].docs.map((document) => ({ id: document.id, ...document.data() }));
  });
  if (input.includeCommerceConfig) {
    const config = await getConfig();
    result.commerceConfig = config;
  }
  return result;
});

export const saveCategory = onCall(callableOptions, async (request) => {
  const admin = requireAdmin(request);
  const input = parse(z.object({
    id: z.string().trim().min(1).optional(),
    name: z.string().trim().min(2).max(120),
  }), request.data);
  const duplicate = await db.collection("categories").where("normalizedName", "==", input.name.toLowerCase()).limit(1).get();
  if (duplicate.docs.some((document) => document.id !== input.id)) {
    fail("already-exists", "A category with this name already exists");
  }
  const ref = input.id ? db.doc(`categories/${input.id}`) : db.collection("categories").doc();
  const existing = await ref.get();
  await ref.set({
    name: input.name,
    normalizedName: input.name.toLowerCase(),
    createdAt: existing.data()?.createdAt ?? timestamp(),
    createdBy: existing.data()?.createdBy ?? admin.auth.uid,
    updatedAt: timestamp(),
    updatedBy: admin.auth.uid,
  }, { merge: true });
  return { categoryId: ref.id };
});

export const deleteCategory = onCall(callableOptions, async (request) => {
  const admin = requireAdmin(request);
  const categoryId = z.string().trim().min(1).parse(request.data?.categoryId);
  const ref = db.doc(`categories/${categoryId}`);
  const [category, products] = await Promise.all([
    ref.get(),
    db.collection("products").where("categoryId", "==", categoryId).limit(1).get(),
  ]);
  if (!category.exists) fail("not-found", "Category not found");
  if (!products.empty) fail("failed-precondition", "Move or archive products in this category before deleting it");
  await ref.delete();
  await db.collection("auditEvents").add({
    type: "category_deleted",
    categoryId,
    categoryName: category.data()?.name,
    actorId: admin.auth.uid,
    createdAt: timestamp(),
  });
  return { categoryId };
});

export const saveProduct = onCall(callableOptions, async (request) => {
  const admin = requireAdmin(request);
  const input = parse(productSchema, request.data);
  const productRef = input.id ? db.doc(`products/${input.id}`) : db.collection("products").doc();
  const variants = input.variants.map((variant) => ({
    ...variant,
    id: variant.id || productRef.collection("variants").doc().id,
  }));
  const combinations = variants.map((variant) => uniqueVariantKey(variant.color.id, variant.size ?? ""));
  if (new Set(combinations).size !== combinations.length) {
    fail("invalid-argument", "Each colour and size combination must be unique");
  }
  if (input.status === "active" && input.images.length === 0) {
    fail("failed-precondition", "An active product requires at least one image");
  }

  const result = await db.runTransaction(async (tx) => {
    const config = await getConfig(tx);
    const categoryRef = db.doc(`categories/${input.categoryId}`);
    const counterRef = db.doc("counters/productSku");
    const existingProduct = await tx.get(productRef);
    const existingVariants = await tx.get(productRef.collection("variants"));
    const category = await tx.get(categoryRef);
    const counter = await tx.get(counterRef);
    if (!category.exists) fail("failed-precondition", "Selected category no longer exists");
    if (input.sellerId) {
      const seller = await tx.get(db.doc(`sellers/${input.sellerId}`));
      if (!seller.exists || seller.data()?.status === "archived") {
        fail("failed-precondition", "Selected seller is unavailable");
      }
    }

    let nextSku = Number(counter.data()?.nextNumber ?? 1);
    const prepared: Array<(typeof variants)[number] & { sku: string }> = [];
    const claims: FirebaseFirestore.DocumentSnapshot[] = [];
    for (const variant of variants) {
      let displaySku = normalizeSku(variant.sku ?? "");
      let claim;
      if (displaySku) {
        claim = await tx.get(db.doc(`skus/${displaySku}`));
      } else {
        do {
          displaySku = formatSku(config.skuPrefix, config.skuPadding, nextSku++);
          claim = await tx.get(db.doc(`skus/${displaySku}`));
        } while (claim.exists);
      }
      prepared.push({ ...variant, sku: displaySku });
      claims.push(claim);
    }
    if (new Set(prepared.map((variant) => variant.sku)).size !== prepared.length) {
      fail("already-exists", "Duplicate SKUs were supplied for this product");
    }

    claims.forEach((claim, index) => {
      const variant = prepared[index];
      if (claim.exists && (claim.data()?.productId !== productRef.id || claim.data()?.variantId !== variant.id)) {
        fail("already-exists", `SKU ${variant.sku} is already in use`, { code: "SKU_ALREADY_EXISTS", sku: variant.sku });
      }
    });

    const existingById = new Map(existingVariants.docs.map((doc) => [doc.id, doc.data()]));
    const newIds = new Set(prepared.map((variant) => variant.id));
    const salePricePaise = calculateSalePrice(input.mrpPaise, input.discountPercent);
    const variantSummary = prepared.map((variant) => {
      const previous = existingById.get(variant.id);
      const reservedQuantity = Number(previous?.reservedQuantity ?? 0);
      if (variant.onHandQuantity < reservedQuantity) {
        fail("failed-precondition", `Stock for ${variant.sku} cannot be below its reserved quantity`);
      }
      const availableQuantity = variant.onHandQuantity - reservedQuantity;
      return {
        id: variant.id,
        sku: variant.sku,
        color: variant.color,
        size: variant.size,
        status: variant.status,
        imageIds: variant.imageIds,
        availableQuantity,
        stockStatus: deriveStockStatus(availableQuantity, variant.lowStockThreshold ?? 0),
      };
    });
    const activeVariants = variantSummary.filter((variant) => variant.status === "active");
    const availableQuantity = activeVariants.reduce((sum, variant) => sum + variant.availableQuantity, 0);
    const lowStockThreshold = prepared.reduce((sum, variant) => sum + (variant.lowStockThreshold ?? 0), 0);

    for (const existing of existingVariants.docs) {
      if (!newIds.has(existing.id)) {
        const oldSku = existing.data().sku;
        if (oldSku) tx.delete(db.doc(`skus/${normalizeSku(oldSku)}`));
        tx.delete(existing.ref);
      }
    }
    prepared.forEach((variant, index) => {
      const previous = existingById.get(variant.id);
      if (previous?.sku && normalizeSku(previous.sku) !== variant.sku) {
        tx.delete(db.doc(`skus/${normalizeSku(previous.sku)}`));
      }
      const summary = variantSummary[index];
      tx.set(productRef.collection("variants").doc(variant.id), {
        ...variant,
        reservedQuantity: Number(previous?.reservedQuantity ?? 0),
        availableQuantity: summary.availableQuantity,
        stockStatus: summary.stockStatus,
        createdAt: previous?.createdAt ?? timestamp(),
        updatedAt: timestamp(),
      });
      tx.set(db.doc(`skus/${variant.sku}`), {
        displaySku: variant.sku,
        productId: productRef.id,
        variantId: variant.id,
        createdAt: claims[index].data()?.createdAt ?? timestamp(),
      });
      const previousOnHand = Number(previous?.onHandQuantity ?? 0);
      if (previousOnHand !== variant.onHandQuantity) {
        tx.set(db.collection("inventoryMovements").doc(), {
          productId: productRef.id,
          variantId: variant.id,
          sku: variant.sku,
          type: previous ? "adjustment" : "opening",
          quantityDelta: variant.onHandQuantity - previousOnHand,
          reason: previous ? "Product editor stock adjustment" : "Opening stock",
          actorId: admin.auth.uid,
          createdAt: timestamp(),
        });
      }
    });

    const sellerPayoutPerUnitPaise = calculateSellerPayout(
      input.sellerPayoutType ?? "fixed",
      input.sellerPayoutValue ?? 0,
      salePricePaise,
    );
    tx.set(productRef, {
      name: input.name,
      slug: slugify(input.name),
      description: input.description,
      dimensions: input.dimensions,
      categoryId: input.categoryId,
      categoryName: input.categoryName,
      mrpPaise: input.mrpPaise,
      discountPercent: input.discountPercent,
      salePricePaise,
      currency: config.currency,
      images: input.images,
      variantSummary,
      availableQuantity,
      stockStatus: deriveStockStatus(availableQuantity, lowStockThreshold),
      status: input.status,
      merchandising: input.merchandising,
      salesMetrics: existingProduct.data()?.salesMetrics ?? { unitsSold: 0, revenuePaise: 0, bestSellerRank: null },
      searchTokens: buildSearchTokens([
        input.name,
        input.description,
        input.categoryName,
        ...prepared.flatMap((variant) => [variant.sku, variant.color.name, variant.size]),
      ]),
      createdAt: existingProduct.data()?.createdAt ?? timestamp(),
      updatedAt: timestamp(),
      createdBy: existingProduct.data()?.createdBy ?? admin.auth.uid,
      updatedBy: admin.auth.uid,
      schemaVersion: 2,
    });
    tx.set(db.doc(`productCommercials/${productRef.id}`), {
      sellerId: input.sellerId || null,
      sellerPayoutType: input.sellerPayoutType ?? "fixed",
      sellerPayoutValue: input.sellerPayoutValue ?? 0,
      sellerPayoutPerUnitPaise,
      unitCostPaise: input.unitCostPaise ?? 0,
      packagingCostPaise: input.packagingCostPaise ?? 0,
      updatedAt: timestamp(),
      updatedBy: admin.auth.uid,
    });
    if (nextSku !== Number(counter.data()?.nextNumber ?? 1)) {
      tx.set(counterRef, { nextNumber: nextSku, updatedAt: timestamp() }, { merge: true });
    }
    const retainedPaths = new Set(input.images.map((image) => image.storagePath).filter(Boolean));
    const orphanedStoragePaths = (existingProduct.data()?.images ?? [])
      .map((image: FirebaseFirestore.DocumentData) => image.storagePath)
      .filter((path: string | undefined) => path && !retainedPaths.has(path));
    return {
      productId: productRef.id,
      variants: prepared.map(({ id, sku }) => ({ id, sku })),
      orphanedStoragePaths,
    };
  });
  await Promise.all(result.orphanedStoragePaths.map(async (path: string) => {
    try {
      await deleteStoredImage(path, "products");
    } catch (error) {
      logger.warn("Could not remove unreferenced product image", { path, error });
    }
  }));
  return { productId: result.productId, variants: result.variants };
});

export const getProductAdmin = onCall(callableOptions, async (request) => {
  requireAdmin(request);
  const productId = z.string().min(1).parse(request.data?.productId);
  const [product, variants, commercials] = await Promise.all([
    db.doc(`products/${productId}`).get(),
    db.collection(`products/${productId}/variants`).get(),
    db.doc(`productCommercials/${productId}`).get(),
  ]);
  if (!product.exists) fail("not-found", "Product not found");
  const productData = product.data() ?? {};
  if (variants.empty && productData.schemaVersion !== 2) {
    const discountPercent = Math.min(99, Math.max(0, Number(productData.discount ?? 0)));
    const legacySalePricePaise = Math.max(0, Math.round(Number(productData.price ?? 0) * 100));
    const mrpPaise = discountPercent > 0
      ? Math.round(legacySalePricePaise / (1 - discountPercent / 100))
      : legacySalePricePaise;
    const [category, seller] = await Promise.all([
      db.collection("categories").where("name", "==", String(productData.category ?? "")).limit(1).get(),
      db.collection("sellers").where("name", "==", String(productData.sellerName ?? productData.ownerName ?? "")).limit(1).get(),
    ]);
    const imageUrls: string[] = productData.imageUrls ?? (productData.imageUrl ? [productData.imageUrl] : []);
    const colorName = String(productData.color || "Unspecified");
    const colorId = slugify(colorName) || "unspecified";
    return {
      id: product.id,
      ...productData,
      categoryId: category.docs[0]?.id ?? "",
      categoryName: category.docs[0]?.data().name ?? productData.category ?? "",
      mrpPaise,
      discountPercent,
      salePricePaise: calculateSalePrice(mrpPaise, discountPercent),
      status: "draft",
      images: imageUrls.map((url, index) => ({
        id: `legacy-${index}`,
        storagePath: "",
        url,
        alt: productData.name || productData.category || "Product",
        sortOrder: index,
      })),
      merchandising: { bestSellerMode: "auto", featured: false },
      variants: [{
        id: "legacy",
        sku: productData.sku || "",
        color: { id: colorId, name: colorName, hex: "" },
        size: String(productData.size ?? ""),
        status: "active",
        imageIds: [],
        onHandQuantity: Number(productData.quantity ?? 0),
        reservedQuantity: 0,
        availableQuantity: Number(productData.quantity ?? 0),
        lowStockThreshold: 0,
        stockStatus: deriveStockStatus(Number(productData.quantity ?? 0), 0),
      }],
      commercials: {
        sellerId: seller.docs[0]?.id ?? "",
        sellerPayoutType: "fixed",
        sellerPayoutValue: 0,
        unitCostPaise: 0,
        packagingCostPaise: 0,
        migrationReviewRequired: true,
      },
      migrationRequired: true,
    };
  }
  return {
    id: product.id,
    ...productData,
    variants: variants.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    commercials: commercials.data() ?? {},
  };
});

export const archiveProduct = onCall(callableOptions, async (request) => {
  const admin = requireAdmin(request);
  const productId = z.string().min(1).parse(request.data?.productId);
  await db.doc(`products/${productId}`).update({
    status: "archived",
    updatedAt: timestamp(),
    updatedBy: admin.auth.uid,
  });
  return { productId };
});

export const adjustInventory = onCall(callableOptions, async (request) => {
  const admin = requireAdmin(request);
  const input = parse(z.object({
    productId: z.string().min(1),
    variantId: z.string().min(1),
    quantityDelta: z.number().int().min(-1_000_000).max(1_000_000),
    reason: z.string().trim().min(5).max(500),
  }), request.data);
  await db.runTransaction(async (tx) => {
    const variantRef = db.doc(`products/${input.productId}/variants/${input.variantId}`);
    const productRef = db.doc(`products/${input.productId}`);
    const [variant, product] = await Promise.all([tx.get(variantRef), tx.get(productRef)]);
    if (!variant.exists || !product.exists) fail("not-found", "Product variant not found");
    const onHandQuantity = Number(variant.data()?.onHandQuantity ?? 0) + input.quantityDelta;
    const reservedQuantity = Number(variant.data()?.reservedQuantity ?? 0);
    if (onHandQuantity < reservedQuantity || onHandQuantity < 0) {
      fail("failed-precondition", "Adjustment would make stock lower than reserved stock");
    }
    const availableQuantity = onHandQuantity - reservedQuantity;
    const stockStatus = deriveStockStatus(availableQuantity, Number(variant.data()?.lowStockThreshold ?? 0));
    tx.update(variantRef, { onHandQuantity, availableQuantity, stockStatus, updatedAt: timestamp() });
    const summaries = (product.data()?.variantSummary ?? []).map((item: FirebaseFirestore.DocumentData) =>
      item.id === input.variantId ? { ...item, availableQuantity, stockStatus } : item,
    );
    tx.update(productRef, {
      variantSummary: summaries,
      ...aggregateProductStock(summaries),
      updatedAt: timestamp(),
      updatedBy: admin.auth.uid,
    });
    tx.set(db.collection("inventoryMovements").doc(), {
      ...input,
      sku: variant.data()?.sku,
      type: "adjustment",
      actorId: admin.auth.uid,
      createdAt: timestamp(),
    });
  });
  return { success: true };
});

const createExternalPaymentSession = async (
  order: { orderId: string; orderNumber: string; amountPaise: number; currency: string; customer: unknown },
): Promise<{ sessionId: string; checkoutUrl: string }> => {
  const endpoint = paymentEndpoint.value();
  const token = paymentToken.value();
  if (!endpoint || !token) fail("failed-precondition", "Online payment provider is not configured");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(order),
  });
  if (!response.ok) throw new Error(`Payment provider returned ${response.status}`);
  const data = await response.json() as Record<string, unknown>;
  if (typeof data.sessionId !== "string" || typeof data.checkoutUrl !== "string") {
    throw new Error("Payment provider response is invalid");
  }
  return { sessionId: data.sessionId, checkoutUrl: data.checkoutUrl };
};

const releaseOrderInventory = async (
  orderRef: DocumentReference,
  actorId: string,
  cancellation: Record<string, unknown>,
  expectedPaymentStatus?: string,
): Promise<FirebaseFirestore.DocumentData> => db.runTransaction(async (tx) => {
  const snapshot = await tx.get(orderRef);
  if (!snapshot.exists) fail("not-found", "Order not found");
  const order = snapshot.data() ?? {};
  if (expectedPaymentStatus && paymentStatusOf(order) !== expectedPaymentStatus) {
    fail("failed-precondition", "Payment status changed while this review was in progress. Refresh and review again.");
  }
  if (fulfilmentStatusOf(order) === "cancelled") return order;
  if (!allowedFulfilmentTransition(fulfilmentStatusOf(order), "cancelled")) {
    fail("failed-precondition", "This order can no longer be cancelled", { code: "INVALID_STATUS_TRANSITION" });
  }
  const variantRefs = (order.items ?? []).map((item: FirebaseFirestore.DocumentData) =>
    db.doc(`products/${item.productId}/variants/${item.variantId}`));
  const variantSnapshots = await Promise.all(variantRefs.map((ref: DocumentReference) => tx.get(ref)));
  const productRefs = [...new Map((order.items ?? []).map((item: FirebaseFirestore.DocumentData) =>
    [item.productId, db.doc(`products/${item.productId}`)])).values()] as DocumentReference[];
  const productSnapshots = await Promise.all(productRefs.map((ref) => tx.get(ref)));
  const sellerRefs = [...new Set((order.items ?? []).map((item: FirebaseFirestore.DocumentData) => item.sellerId).filter(Boolean))]
    .map((sellerId) => db.doc(`sellers/${sellerId}`));
  const sellerSnapshots = await Promise.all(sellerRefs.map((ref) => tx.get(ref)));
  const summariesByProduct = new Map(productSnapshots.map((snapshot) => [snapshot.id, snapshot.data()?.variantSummary ?? []]));
  const inventoryState = order.inventoryState;
  variantSnapshots.forEach((variant, index) => {
    if (!variant.exists) return;
    const item = order.items[index];
    const data = variant.data() ?? {};
    let onHandQuantity = Number(data.onHandQuantity ?? 0);
    let reservedQuantity = Number(data.reservedQuantity ?? 0);
    const balance = inventoryState === "reserved"
      ? releaseInventory(onHandQuantity, reservedQuantity, item.quantity)
      : inventoryState === "committed"
        ? restoreCommittedInventory(onHandQuantity, reservedQuantity, item.quantity)
        : { onHandQuantity, reservedQuantity, availableQuantity: onHandQuantity - reservedQuantity };
    onHandQuantity = balance.onHandQuantity;
    reservedQuantity = balance.reservedQuantity;
    const availableQuantity = balance.availableQuantity;
    tx.update(variant.ref, {
      onHandQuantity,
      reservedQuantity,
      availableQuantity,
      stockStatus: deriveStockStatus(availableQuantity, Number(data.lowStockThreshold ?? 0)),
      updatedAt: timestamp(),
    });
    summariesByProduct.set(
      item.productId,
      updateVariantSummary(summariesByProduct.get(item.productId) ?? [], item.variantId, availableQuantity,
        deriveStockStatus(availableQuantity, Number(data.lowStockThreshold ?? 0))),
    );
    tx.set(db.collection("inventoryMovements").doc(), {
      productId: item.productId,
      variantId: item.variantId,
      sku: item.sku,
      type: "cancellation",
      quantityDelta: item.quantity,
      orderId: orderRef.id,
      reason: cancellation.reasonCode,
      actorId,
      createdAt: timestamp(),
    });
  });
  for (const productRef of productRefs) {
    const variantSummary = summariesByProduct.get(productRef.id) ?? [];
    tx.update(productRef, { variantSummary, ...aggregateProductStock(variantSummary), updatedAt: timestamp() });
  }
  const update: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {
    fulfilmentStatus: "cancelled",
    status: "cancelled",
    inventoryState: "released",
    cancellation: { ...cancellation, cancelledBy: actorId, cancelledAt: timestamp() },
    updatedAt: timestamp(),
  };
  if (paymentStatusOf(order) === "paid") {
    update["payment.refundStatus"] = "required";
    tx.set(db.collection("refunds").doc(), {
      orderId: orderRef.id,
      orderNumber: order.orderNumber,
      amountPaise: order.payment?.amountPaidPaise ?? order.grandTotalPaise,
      currency: order.currency,
      status: "pending",
      reasonCode: cancellation.reasonCode,
      createdAt: timestamp(),
    });
  }
  tx.update(orderRef, update);
  writeEvent(tx, orderRef, "order_cancelled", actorId, {
    from: fulfilmentStatusOf(order),
    to: "cancelled",
    reasonCode: cancellation.reasonCode,
  });
  tx.set(db.collection("notifications").doc(), {
    type: "order_cancelled",
    status: "pending",
    orderId: orderRef.id,
    orderNumber: order.orderNumber,
    recipient: { email: order.userEmail, phone: order.address?.phone },
    payload: {
      customerName: order.address?.fullName,
      customerMessage: cancellation.customerMessage,
      paymentStatus: paymentStatusOf(order),
    },
    attempts: 0,
    createdAt: timestamp(),
  });
  sellerSnapshots.forEach((seller) => {
    if (!seller.exists) return;
    tx.set(db.collection("notifications").doc(), {
      type: "seller_order_cancelled",
      status: "pending",
      orderId: orderRef.id,
      orderNumber: order.orderNumber,
      sellerId: seller.id,
      recipient: { email: seller.data()?.email, phone: seller.data()?.phone, channels: seller.data()?.notificationChannels ?? [] },
      payload: {
        sellerName: seller.data()?.name,
        reasonCode: cancellation.reasonCode,
        items: (order.items ?? []).filter((item: FirebaseFirestore.DocumentData) => item.sellerId === seller.id)
          .map((item: FirebaseFirestore.DocumentData) => ({ sku: item.sku, name: item.name, quantity: item.quantity })),
      },
      attempts: 0,
      createdAt: timestamp(),
    });
  });
  for (const item of order.items ?? []) {
    const ledgerRef = db.doc(`sellerLedger/${orderRef.id}_${item.variantId}`);
    tx.set(ledgerRef, {
      status: "reversed",
      reversedAt: timestamp(),
      reversalReason: cancellation.reasonCode,
    }, { merge: true });
  }
  return { ...order, ...update };
});

export const createCheckout = onCall(
  callableOptions,
  async (request) => {
    const customer = requireAuth(request);
    const input = parse(checkoutSchema, request.data);
    const lineKeys = input.items.map((item) => `${item.productId}::${item.variantId}`);
    if (new Set(lineKeys).size !== lineKeys.length) fail("invalid-argument", "Duplicate cart variants are not allowed");
    const idempotencyRef = db.doc(`checkoutIdempotency/${customer.auth.uid}_${input.idempotencyKey}`);
    const orderRef = db.collection("orders").doc();
    const transactionResult = await db.runTransaction(async (tx) => {
      const config = await getConfig(tx);
      const prior = await tx.get(idempotencyRef);
      if (prior.exists) return { existing: true, ...prior.data() };
      const paymentProofRef = db.doc(`paymentProofUploads/${input.paymentProofId}`);
      const paymentProof = await tx.get(paymentProofRef);
      if (!paymentProof.exists || paymentProof.data()?.ownerId !== customer.auth.uid || paymentProof.data()?.status !== "uploaded") {
        fail("failed-precondition", "The payment screenshot is missing, already used, or does not belong to this customer", {
          code: "INVALID_PAYMENT_PROOF",
        });
      }
      const orderCounterRef = db.doc("counters/orderNumber");
      const counter = await tx.get(orderCounterRef);
      const productRefs = input.items.map((item) => db.doc(`products/${item.productId}`));
      const variantRefs = input.items.map((item) => db.doc(`products/${item.productId}/variants/${item.variantId}`));
      const commercialRefs = input.items.map((item) => db.doc(`productCommercials/${item.productId}`));
      const [products, variants, commercials] = await Promise.all([
        Promise.all(productRefs.map((ref) => tx.get(ref))),
        Promise.all(variantRefs.map((ref) => tx.get(ref))),
        Promise.all(commercialRefs.map((ref) => tx.get(ref))),
      ]);
      const lineItems = input.items.map((item, index) => {
        const product = products[index];
        const variant = variants[index];
        if (!product.exists || !variant.exists || product.data()?.status !== "active" || variant.data()?.status !== "active") {
          fail("failed-precondition", "A cart item is no longer available", { code: "PRODUCT_UNAVAILABLE", productId: item.productId });
        }
        const available = Number(variant.data()?.availableQuantity ?? 0);
        if (available < item.quantity) {
          fail("failed-precondition", `${product.data()?.name} has only ${available} available`, {
            code: "OUT_OF_STOCK",
            productId: item.productId,
            variantId: item.variantId,
            availableQuantity: available,
          });
        }
        const salePricePaise = Number(product.data()?.salePricePaise);
        if (!Number.isSafeInteger(salePricePaise)) fail("data-loss", "Product pricing is invalid");
        const commercial = commercials[index].data() ?? {};
        return {
          productId: item.productId,
          variantId: item.variantId,
          sku: variant.data()?.sku,
          name: product.data()?.name,
          selectedColor: variant.data()?.color,
          selectedSize: variant.data()?.size ?? "",
          sellerId: commercial.sellerId ?? null,
          quantity: item.quantity,
          mrpPaise: product.data()?.mrpPaise,
          discountPercent: product.data()?.discountPercent,
          unitSalePricePaise: salePricePaise,
          sellerPayoutPerUnitPaise: Number(commercial.sellerPayoutPerUnitPaise ?? 0),
          lineTotalPaise: salePricePaise * item.quantity,
        };
      });
      const subtotalPaise = lineItems.reduce((sum, item) => sum + item.lineTotalPaise, 0);
      if (!config.prepaidEnabled) {
        fail("failed-precondition", "Online payment is currently unavailable", { code: "PAYMENT_METHOD_UNAVAILABLE" });
      }
      if (!config.manualPaymentQrUrl) {
        fail("failed-precondition", "Online payment QR has not been configured", { code: "PAYMENT_QR_UNAVAILABLE" });
      }
      const nextOrderNumber = Number(counter.data()?.nextNumber ?? 1);
      const orderNumber = formatSku(config.orderPrefix, config.orderPadding, nextOrderNumber);
      const expiresAt = Timestamp.fromMillis(Date.now() + config.manualPaymentVerificationTtlMinutes * 60_000);
      const summariesByProduct = new Map<string, FirebaseFirestore.DocumentData[]>();
      products.forEach((product) => {
        if (!summariesByProduct.has(product.id)) summariesByProduct.set(product.id, product.data()?.variantSummary ?? []);
      });
      variants.forEach((variant, index) => {
        const quantity = input.items[index].quantity;
        const data = variant.data() ?? {};
        const balance = reserveInventory(Number(data.onHandQuantity ?? 0), Number(data.reservedQuantity ?? 0), quantity);
        const reservedQuantity = balance.reservedQuantity;
        const availableQuantity = balance.availableQuantity;
        tx.update(variant.ref, {
          reservedQuantity,
          availableQuantity,
          stockStatus: deriveStockStatus(availableQuantity, Number(data.lowStockThreshold ?? 0)),
          updatedAt: timestamp(),
        });
        const stockStatus = deriveStockStatus(availableQuantity, Number(data.lowStockThreshold ?? 0));
        summariesByProduct.set(
          input.items[index].productId,
          updateVariantSummary(summariesByProduct.get(input.items[index].productId) ?? [], input.items[index].variantId, availableQuantity, stockStatus),
        );
        tx.set(db.collection("inventoryMovements").doc(), {
          productId: input.items[index].productId,
          variantId: input.items[index].variantId,
          sku: data.sku,
          type: "reservation",
          quantityDelta: -quantity,
          orderId: orderRef.id,
          reason: "Checkout reservation",
          actorId: customer.auth.uid,
          createdAt: timestamp(),
        });
      });
      for (const [productId, variantSummary] of summariesByProduct) {
        tx.update(db.doc(`products/${productId}`), { variantSummary, ...aggregateProductStock(variantSummary), updatedAt: timestamp() });
      }
      const order = {
        orderNumber,
        userId: customer.auth.uid,
        userEmail: customer.auth.token.email ?? "",
        items: lineItems,
        subtotalPaise,
        deliveryFeePaise: config.deliveryFeePaise,
        discountTotalPaise: lineItems.reduce((sum, item) => sum + ((item.mrpPaise - item.unitSalePricePaise) * item.quantity), 0),
        taxTotalPaise: 0,
        grandTotalPaise: subtotalPaise + config.deliveryFeePaise,
        currency: config.currency,
        address: input.address,
        payment: {
          method: "online",
          mode: "manual_qr",
          status: "verification_pending",
          amountPaidPaise: 0,
          proofId: input.paymentProofId,
          submittedAt: timestamp(),
        },
        fulfilmentStatus: "pending",
        status: "pending",
        inventoryState: "reserved",
        reservationExpiresAt: expiresAt,
        createdAt: timestamp(),
        updatedAt: timestamp(),
        version: 1,
      };
      tx.create(orderRef, order);
      tx.update(paymentProofRef, {
        status: "attached",
        orderId: orderRef.id,
        orderNumber,
        attachedAt: timestamp(),
      });
      tx.set(orderCounterRef, { nextNumber: nextOrderNumber + 1, updatedAt: timestamp() }, { merge: true });
      tx.create(idempotencyRef, {
        orderId: orderRef.id,
        orderNumber,
        grandTotalPaise: order.grandTotalPaise,
        paymentMethod: input.paymentMethod,
        paymentStatus: order.payment.status,
        requiresVerification: true,
        createdAt: timestamp(),
      });
      writeEvent(tx, orderRef, "order_created", customer.auth.uid, { to: "pending" });
      return { existing: false, orderId: orderRef.id, orderNumber, paymentMethod: input.paymentMethod, order };
    });

    if (transactionResult.existing) return transactionResult;
    return {
      orderId: transactionResult.orderId,
      orderNumber: transactionResult.orderNumber,
      grandTotalPaise: transactionResult.order?.grandTotalPaise,
      paymentMethod: input.paymentMethod,
      paymentStatus: transactionResult.order?.payment?.status,
      requiresVerification: true,
    };
  },
);

export const transitionOrder = onCall(callableOptions, async (request) => {
  const admin = requireAdmin(request);
  const input = parse(z.object({
    orderId: z.string().min(1),
    newStatus: z.enum(["confirmed", "packed", "shipped", "delivered"]),
  }), request.data);
  const orderRef = db.doc(`orders/${input.orderId}`);
  await db.runTransaction(async (tx) => {
    const orderSnapshot = await tx.get(orderRef);
    if (!orderSnapshot.exists) fail("not-found", "Order not found");
    const order = orderSnapshot.data() ?? {};
    const currentStatus = fulfilmentStatusOf(order);
    if (!allowedFulfilmentTransition(currentStatus, input.newStatus)) {
      fail("failed-precondition", `Cannot move order from ${currentStatus} to ${input.newStatus}`, { code: "INVALID_STATUS_TRANSITION" });
    }
    if (input.newStatus === "confirmed" && order.payment?.method === "online" && paymentStatusOf(order) !== "paid") {
      fail("failed-precondition", "Online payment must be manually verified before this order can be confirmed", {
        code: "PAYMENT_VERIFICATION_REQUIRED",
      });
    }
    if (input.newStatus === "confirmed" && order.inventoryState === "reserved") {
      await commitOrderInventory(tx, orderRef, order, admin.auth.uid);
    }
    const updatedOrder = {
      ...order,
      fulfilmentStatus: input.newStatus,
      status: input.newStatus,
      inventoryState: input.newStatus === "confirmed" ? "committed" : order.inventoryState,
    };
    tx.update(orderRef, {
      fulfilmentStatus: input.newStatus,
      status: input.newStatus,
      ...(input.newStatus === "confirmed" ? { inventoryState: "committed" } : {}),
      updatedAt: timestamp(),
      version: FieldValue.increment(1),
    });
    writeEvent(tx, orderRef, "fulfilment_status_changed", admin.auth.uid, { from: currentStatus, to: input.newStatus });
    if (input.newStatus === "delivered") createSellerEarnings(tx, orderRef, updatedOrder);
  });
  return { orderId: input.orderId, fulfilmentStatus: input.newStatus };
});

export const cancelOrder = onCall(callableOptions, async (request) => {
  const admin = requireAdmin(request);
  const input = parse(cancellationSchema, request.data);
  await releaseOrderInventory(db.doc(`orders/${input.orderId}`), admin.auth.uid, input);
  return { orderId: input.orderId, fulfilmentStatus: "cancelled" };
});

export const verifyManualPayment = onCall(callableOptions, async (request) => {
  const admin = requireAdmin(request);
  const input = parse(z.object({
    orderId: z.string().trim().min(1).max(160),
    decision: z.enum(["approve", "reject"]),
    reference: z.string().trim().max(200).default(""),
    customerMessage: z.string().trim().max(1000).default(""),
    internalNote: z.string().trim().max(2000).default(""),
  }).superRefine((value, context) => {
    if (value.decision === "approve" && value.reference.length < 2) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["reference"], message: "Verification reference is required" });
    }
    if (value.decision === "reject" && value.customerMessage.length < 10) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["customerMessage"], message: "Customer message must be at least 10 characters" });
    }
  }), request.data);
  const orderRef = db.doc(`orders/${input.orderId}`);

  if (input.decision === "reject") {
    const before = await orderRef.get();
    if (!before.exists) fail("not-found", "Order not found");
    const beforeOrder = before.data() ?? {};
    if (beforeOrder.payment?.method !== "online" || beforeOrder.payment?.mode !== "manual_qr" || !beforeOrder.payment?.proofId) {
      fail("failed-precondition", "This is not a manual online payment order");
    }
    if (paymentStatusOf(beforeOrder) !== "verification_pending") {
      fail("failed-precondition", "This payment is not awaiting verification");
    }
    const order = await releaseOrderInventory(orderRef, admin.auth.uid, {
      reasonCode: "payment_issue",
      customerMessage: input.customerMessage,
      internalNote: input.internalNote,
    }, "verification_pending");
    const batch = db.batch();
    batch.update(orderRef, {
      "payment.status": "rejected",
      "payment.reviewedAt": timestamp(),
      "payment.reviewedBy": admin.auth.uid,
      "payment.reviewNote": input.internalNote,
      updatedAt: timestamp(),
      version: FieldValue.increment(1),
    });
    batch.set(db.doc(`paymentProofUploads/${order.payment.proofId}`), {
      status: "rejected",
      reviewedAt: timestamp(),
      reviewedBy: admin.auth.uid,
    }, { merge: true });
    await batch.commit();
    return { orderId: input.orderId, paymentStatus: "rejected", fulfilmentStatus: "cancelled" };
  }

  await db.runTransaction(async (tx) => {
    const snapshot = await tx.get(orderRef);
    if (!snapshot.exists) fail("not-found", "Order not found");
    const order = snapshot.data() ?? {};
    if (order.payment?.method !== "online" || order.payment?.mode !== "manual_qr" || !order.payment?.proofId) {
      fail("failed-precondition", "This is not a manual online payment order");
    }
    if (fulfilmentStatusOf(order) === "cancelled") fail("failed-precondition", "A cancelled order cannot be approved");
    if (paymentStatusOf(order) === "paid") return;
    if (paymentStatusOf(order) !== "verification_pending") {
      fail("failed-precondition", "This payment is not awaiting verification");
    }
    if (fulfilmentStatusOf(order) !== "pending") {
      fail("failed-precondition", "Only pending orders can be approved");
    }
    const sellerRefs = [...new Set((order.items ?? []).map((item: FirebaseFirestore.DocumentData) => item.sellerId).filter(Boolean))]
      .map((sellerId) => db.doc(`sellers/${sellerId}`));
    const sellers = await Promise.all(sellerRefs.map((ref) => tx.get(ref)));
    await commitOrderInventory(tx, orderRef, order, admin.auth.uid);
    const payment = {
      ...order.payment,
      status: "paid",
      amountPaidPaise: order.grandTotalPaise,
      reference: input.reference,
      paidAt: Timestamp.now(),
      reviewedAt: Timestamp.now(),
      reviewedBy: admin.auth.uid,
      reviewNote: input.internalNote,
    };
    tx.update(orderRef, {
      payment,
      fulfilmentStatus: "confirmed",
      status: "confirmed",
      inventoryState: "committed",
      updatedAt: timestamp(),
      version: FieldValue.increment(1),
    });
    tx.set(db.doc(`paymentProofUploads/${order.payment.proofId}`), {
      status: "verified",
      reviewedAt: timestamp(),
      reviewedBy: admin.auth.uid,
    }, { merge: true });
    writeEvent(tx, orderRef, "manual_payment_verified", admin.auth.uid, {
      paymentStatus: "paid",
      fulfilmentStatus: "confirmed",
      reference: input.reference,
    });
    tx.set(db.collection("notifications").doc(), {
      type: "payment_verified",
      status: "pending",
      orderId: orderRef.id,
      orderNumber: order.orderNumber,
      recipient: { email: order.userEmail, phone: order.address?.phone },
      payload: { customerName: order.address?.fullName, paymentStatus: "paid", fulfilmentStatus: "confirmed" },
      attempts: 0,
      createdAt: timestamp(),
    });
    sellers.forEach((seller) => {
      if (!seller.exists) return;
      tx.set(db.collection("notifications").doc(), {
        type: "seller_new_order",
        status: "pending",
        orderId: orderRef.id,
        orderNumber: order.orderNumber,
        sellerId: seller.id,
        recipient: { email: seller.data()?.email, phone: seller.data()?.phone, channels: seller.data()?.notificationChannels ?? [] },
        payload: {
          sellerName: seller.data()?.name,
          items: (order.items ?? []).filter((item: FirebaseFirestore.DocumentData) => item.sellerId === seller.id)
            .map((item: FirebaseFirestore.DocumentData) => ({ sku: item.sku, name: item.name, quantity: item.quantity })),
        },
        attempts: 0,
        createdAt: timestamp(),
      });
    });
  });
  return { orderId: input.orderId, paymentStatus: "paid", fulfilmentStatus: "confirmed" };
});

export const paymentWebhook = onRequest(
  { region: REGION, secrets: [paymentWebhookSecret] },
  async (request, response) => {
    if (request.method !== "POST") {
      response.status(405).send("Method not allowed");
      return;
    }
    const secret = paymentWebhookSecret.value();
    const signature = request.header("x-payment-signature") ?? "";
    if (!secret || !signature) {
      response.status(401).send("Missing signature");
      return;
    }
    const expected = createHmac("sha256", secret).update(request.rawBody).digest("hex");
    const receivedBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) {
      response.status(401).send("Invalid signature");
      return;
    }
    const parsed = z.object({
      eventId: z.string().min(1),
      orderId: z.string().min(1),
      providerPaymentId: z.string().min(1),
      status: z.enum(["paid", "failed", "refunded", "partially_refunded"]),
      amountPaise: z.number().int().min(0),
    }).safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({ error: parsed.error.flatten() });
      return;
    }
    try {
      await db.runTransaction(async (tx) => {
        const eventRef = db.doc(`paymentEvents/${parsed.data.eventId}`);
        const orderRef = db.doc(`orders/${parsed.data.orderId}`);
        const [priorEvent, orderSnapshot] = await Promise.all([tx.get(eventRef), tx.get(orderRef)]);
        if (priorEvent.exists) return;
        if (!orderSnapshot.exists) throw new Error("Order not found");
        const order = orderSnapshot.data() ?? {};
        if (parsed.data.status === "paid" && paymentStatusOf(order) === "paid") {
          tx.create(eventRef, { ...parsed.data, duplicateStatusEvent: true, createdAt: timestamp() });
          return;
        }
        if (parsed.data.status === "paid" && parsed.data.amountPaise !== order.grandTotalPaise) {
          throw new Error("Payment amount mismatch");
        }
        const updatedOrder = {
          ...order,
          payment: {
            ...order.payment,
            status: parsed.data.status,
            amountPaidPaise: parsed.data.status === "paid" ? parsed.data.amountPaise : order.payment?.amountPaidPaise ?? 0,
            providerPaymentId: parsed.data.providerPaymentId,
            paidAt: parsed.data.status === "paid" ? Timestamp.now() : order.payment?.paidAt ?? null,
          },
        };
        tx.create(eventRef, { ...parsed.data, createdAt: timestamp() });
        tx.update(orderRef, { payment: updatedOrder.payment, updatedAt: timestamp(), version: FieldValue.increment(1) });
        writeEvent(tx, orderRef, "payment_status_changed", "payment-provider", { to: parsed.data.status, eventId: parsed.data.eventId });
        createSellerEarnings(tx, orderRef, updatedOrder);
      });
      response.status(200).json({ received: true });
    } catch (error) {
      logger.error("Payment webhook failed", error);
      response.status(409).json({ error: (error as Error).message });
    }
  },
);

export const submitProductRequest = onCall(callableOptions, async (request) => {
  const customer = requireAuth(request);
  const input = parse(productRequestSchema, request.data);
  const ref = db.collection("productRequests").doc();
  await ref.create({
    ...input,
    userId: customer.auth.uid,
    userEmail: customer.auth.token.email ?? "",
    status: "new",
    assignedTo: null,
    adminNotes: "",
    createdAt: timestamp(),
    updatedAt: timestamp(),
  });
  await ref.collection("events").add({ type: "submitted", actorId: customer.auth.uid, createdAt: timestamp() });
  return { requestId: ref.id };
});

export const updateProductRequest = onCall(callableOptions, async (request) => {
  const admin = requireAdmin(request);
  const input = parse(z.object({
    requestId: z.string().min(1),
    status: z.enum(["new", "reviewing", "quoted", "accepted", "in_progress", "fulfilled", "rejected", "cancelled"]),
    assignedTo: z.string().trim().max(160).default(""),
    adminNotes: z.string().trim().max(5000).default(""),
    customerMessage: z.string().trim().max(2000).default(""),
  }), request.data);
  const ref = db.doc(`productRequests/${input.requestId}`);
  await db.runTransaction(async (tx) => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists) fail("not-found", "Product request not found");
    tx.update(ref, {
      status: input.status,
      assignedTo: input.assignedTo || null,
      adminNotes: input.adminNotes,
      updatedAt: timestamp(),
      updatedBy: admin.auth.uid,
    });
    tx.set(ref.collection("events").doc(), {
      type: "status_changed",
      from: snapshot.data()?.status,
      to: input.status,
      customerMessage: input.customerMessage,
      actorId: admin.auth.uid,
      createdAt: timestamp(),
    });
    if (input.customerMessage) {
      tx.set(db.collection("notifications").doc(), {
        type: "product_request_updated",
        status: "pending",
        requestId: ref.id,
        recipient: { email: snapshot.data()?.userEmail, phone: snapshot.data()?.contactNumber },
        payload: { customerName: snapshot.data()?.name, status: input.status, customerMessage: input.customerMessage },
        attempts: 0,
        createdAt: timestamp(),
      });
    }
  });
  return { requestId: input.requestId, status: input.status };
});

export const saveSeller = onCall(callableOptions, async (request) => {
  const admin = requireAdmin(request);
  const input = parse(z.object({
    id: z.string().min(1).optional(),
    name: z.string().trim().min(2).max(160),
    phone: z.string().trim().max(30).default(""),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().trim().max(500).default(""),
    payoutMethod: z.string().trim().max(100).default(""),
    payoutDetails: z.string().trim().max(500).default(""),
    notificationChannels: z.array(z.enum(["email", "sms", "whatsapp"])).default([]),
    status: z.enum(["active", "archived"]).default("active"),
  }), request.data);
  const ref = input.id ? db.doc(`sellers/${input.id}`) : db.collection("sellers").doc();
  const { id: _id, ...data } = input;
  await ref.set({ ...data, updatedAt: timestamp(), updatedBy: admin.auth.uid, createdAt: timestamp() }, { merge: true });
  return { sellerId: ref.id };
});

export const createSettlement = onCall(callableOptions, async (request) => {
  const admin = requireAdmin(request);
  const input = parse(z.object({
    sellerId: z.string().min(1),
    entryIds: z.array(z.string().min(1)).min(1).max(400),
    adjustmentsPaise: z.number().int().min(-100_000_000).max(100_000_000).default(0),
    adjustmentNote: z.string().trim().max(1000).default(""),
  }), request.data);
  const settlementRef = db.collection("settlements").doc();
  await db.runTransaction(async (tx) => {
    const sellerRef = db.doc(`sellers/${input.sellerId}`);
    const seller = await tx.get(sellerRef);
    const entryRefs = input.entryIds.map((id) => db.doc(`sellerLedger/${id}`));
    const entries = await Promise.all(entryRefs.map((ref) => tx.get(ref)));
    if (!seller.exists) fail("not-found", "Seller not found");
    let grossEarningsPaise = 0;
    entries.forEach((entry) => {
      if (!entry.exists || entry.data()?.sellerId !== input.sellerId || entry.data()?.status !== "payable") {
        fail("failed-precondition", "One or more ledger entries are not payable for this seller");
      }
      grossEarningsPaise += Number(entry.data()?.amountPaise ?? 0);
    });
    const netPayablePaise = grossEarningsPaise + (input.adjustmentsPaise ?? 0);
    if (netPayablePaise < 0) fail("invalid-argument", "Settlement net payable cannot be negative");
    tx.create(settlementRef, {
      sellerId: input.sellerId,
      sellerName: seller.data()?.name,
      entryIds: input.entryIds,
      grossEarningsPaise,
      adjustmentsPaise: input.adjustmentsPaise ?? 0,
      adjustmentNote: input.adjustmentNote,
      netPayablePaise,
      currency: "INR",
      status: "approved",
      createdAt: timestamp(),
      createdBy: admin.auth.uid,
    });
    entries.forEach((entry) => tx.update(entry.ref, { status: "included_in_settlement", settlementId: settlementRef.id }));
  });
  return { settlementId: settlementRef.id };
});

export const recordSettlementPayment = onCall(callableOptions, async (request) => {
  const admin = requireAdmin(request);
  const input = parse(z.object({
    settlementId: z.string().min(1),
    payoutReference: z.string().trim().min(2).max(300),
  }), request.data);
  const ref = db.doc(`settlements/${input.settlementId}`);
  await db.runTransaction(async (tx) => {
    const settlement = await tx.get(ref);
    if (!settlement.exists) fail("not-found", "Settlement not found");
    if (settlement.data()?.status === "paid") return;
    if (settlement.data()?.status !== "approved") fail("failed-precondition", "Settlement is not approved");
    const entryRefs = (settlement.data()?.entryIds ?? []).map((id: string) => db.doc(`sellerLedger/${id}`));
    const seller = await tx.get(db.doc(`sellers/${settlement.data()?.sellerId}`));
    await Promise.all(entryRefs.map((entryRef: DocumentReference) => tx.get(entryRef)));
    tx.update(ref, {
      status: "paid",
      payoutReference: input.payoutReference,
      paidAt: timestamp(),
      paidBy: admin.auth.uid,
    });
    entryRefs.forEach((entryRef: DocumentReference) => tx.update(entryRef, { status: "paid", paidAt: timestamp() }));
    tx.set(db.collection("notifications").doc(), {
      type: "settlement_paid",
      status: "pending",
      settlementId: ref.id,
      recipient: { email: seller.data()?.email, phone: seller.data()?.phone },
      payload: {
        sellerName: seller.data()?.name,
        netPayablePaise: settlement.data()?.netPayablePaise,
        payoutReference: input.payoutReference,
      },
      attempts: 0,
      createdAt: timestamp(),
    });
  });
  return { settlementId: input.settlementId, status: "paid" };
});

const bulkInputSchema = z.object({
  productIds: z.array(z.string().min(1)).min(1).max(400),
  operation: z.discriminatedUnion("type", [
    z.object({ type: z.literal("set_discount"), discountPercent: z.number().min(0).max(100) }),
    z.object({ type: z.literal("set_status"), status: z.enum(["draft", "active", "archived"]) }),
    z.object({ type: z.literal("set_best_seller_mode"), mode: z.enum(["auto", "force_on", "force_off"]) }),
    z.object({ type: z.literal("set_category"), categoryId: z.string().min(1), categoryName: z.string().min(1).max(120) }),
  ]),
});

const projectBulkChange = (product: FirebaseFirestore.DocumentData, operation: z.infer<typeof bulkInputSchema>["operation"]): Record<string, unknown> => {
  if (operation.type === "set_discount") {
    return {
      discountPercent: operation.discountPercent,
      salePricePaise: calculateSalePrice(product.mrpPaise, operation.discountPercent),
    };
  }
  if (operation.type === "set_status") {
    if (operation.status === "active" && (!(product.images ?? []).length || !(product.variantSummary ?? []).some((variant: FirebaseFirestore.DocumentData) => variant.status === "active"))) {
      throw new Error("Product requires an image and active variant before publication");
    }
    return { status: operation.status };
  }
  if (operation.type === "set_best_seller_mode") {
    return { merchandising: { ...(product.merchandising ?? {}), bestSellerMode: operation.mode } };
  }
  return {
    categoryId: operation.categoryId,
    categoryName: operation.categoryName,
    searchTokens: buildSearchTokens([
      product.name, product.description, operation.categoryName,
      ...(product.variantSummary ?? []).flatMap((variant: FirebaseFirestore.DocumentData) =>
        [variant.sku, variant.color?.name, variant.size]),
    ]),
  };
};

export const previewBulkProductUpdate = onCall(callableOptions, async (request) => {
  requireAdmin(request);
  const input = parse(bulkInputSchema, request.data);
  if (input.operation.type === "set_category" && !(await db.doc(`categories/${input.operation.categoryId}`).get()).exists) {
    fail("failed-precondition", "Selected category does not exist");
  }
  const snapshots = await Promise.all(input.productIds.map((id) => db.doc(`products/${id}`).get()));
  const valid = snapshots.filter((snapshot) => snapshot.exists);
  return {
    requestedCount: input.productIds.length,
    affectedCount: valid.length,
    excludedCount: snapshots.length - valid.length,
    examples: valid.slice(0, 10).map((snapshot) => ({
      productId: snapshot.id,
      name: snapshot.data()?.name,
      before: snapshot.data(),
      after: projectBulkChange(snapshot.data() ?? {}, input.operation),
    })),
  };
});

export const runBulkProductUpdate = onCall(callableOptions, async (request) => {
  const admin = requireAdmin(request);
  const input = parse(bulkInputSchema, request.data);
  if (input.operation.type === "set_category" && !(await db.doc(`categories/${input.operation.categoryId}`).get()).exists) {
    fail("failed-precondition", "Selected category does not exist");
  }
  const jobRef = db.collection("bulkJobs").doc();
  await jobRef.create({
    actorId: admin.auth.uid,
    productIds: input.productIds,
    operation: input.operation,
    status: "processing",
    processedCount: 0,
    failedCount: 0,
    errors: [],
    createdAt: timestamp(),
  });
  const errors: Array<{ productId: string; message: string }> = [];
  let processedCount = 0;
  for (let offset = 0; offset < input.productIds.length; offset += 100) {
    const chunk = input.productIds.slice(offset, offset + 100);
    const [snapshots, commercials] = await Promise.all([
      Promise.all(chunk.map((id) => db.doc(`products/${id}`).get())),
      Promise.all(chunk.map((id) => db.doc(`productCommercials/${id}`).get())),
    ]);
    const batch = db.batch();
    snapshots.forEach((snapshot, index) => {
      if (!snapshot.exists) {
        errors.push({ productId: snapshot.id, message: "Product not found" });
        return;
      }
      try {
        batch.update(snapshot.ref, {
          ...projectBulkChange(snapshot.data() ?? {}, input.operation),
          updatedAt: timestamp(),
          updatedBy: admin.auth.uid,
        });
        if (input.operation.type === "set_discount" && commercials[index].data()?.sellerPayoutType === "percentage") {
          const salePricePaise = calculateSalePrice(snapshot.data()?.mrpPaise, input.operation.discountPercent);
          const sellerPayoutPerUnitPaise = calculateSellerPayout(
            "percentage",
            Number(commercials[index].data()?.sellerPayoutValue ?? 0),
            salePricePaise,
          );
          batch.update(commercials[index].ref, { sellerPayoutPerUnitPaise, updatedAt: timestamp(), updatedBy: admin.auth.uid });
        }
        processedCount += 1;
      } catch (error) {
        errors.push({ productId: snapshot.id, message: (error as Error).message });
      }
    });
    await batch.commit();
    await jobRef.update({ processedCount, failedCount: errors.length, errors: errors.slice(0, 100) });
  }
  await jobRef.update({ status: errors.length ? "completed_with_errors" : "completed", completedAt: timestamp() });
  return { jobId: jobRef.id, processedCount, failedCount: errors.length, errors };
});

export const expireReservationsJob = async (): Promise<void> => {
    const snapshot = await db.collection("orders")
      .where("inventoryState", "==", "reserved")
      .where("reservationExpiresAt", "<=", Timestamp.now())
      .limit(100)
      .get();
    for (const order of snapshot.docs) {
      try {
        await releaseOrderInventory(order.ref, "system", {
          reasonCode: "payment_issue",
          customerMessage: "The payment window expired before payment was completed. Please place the order again.",
          internalNote: "Automatic reservation expiry",
        });
      } catch (error) {
        logger.error("Could not expire reservation", { orderId: order.id, error });
      }
    }
};

export const expireReservations = onSchedule(
  { region: REGION, schedule: "every 15 minutes", timeZone: "Asia/Kolkata" },
  expireReservationsJob,
);

export const recomputeBestSellersJob = async (): Promise<void> => {
    const config = await getConfig();
    const since = Timestamp.fromMillis(Date.now() - config.bestSellerWindowDays * 86_400_000);
    const orders = await db.collection("orders")
      .where("fulfilmentStatus", "==", "delivered")
      .where("createdAt", ">=", since)
      .get();
    const totals = new Map<string, { units: number; revenuePaise: number }>();
    for (const order of orders.docs) {
      if (paymentStatusOf(order.data()) !== "paid") continue;
      for (const item of order.data().items ?? []) {
        const current = totals.get(item.productId) ?? { units: 0, revenuePaise: 0 };
        current.units += item.quantity;
        current.revenuePaise += item.lineTotalPaise;
        totals.set(item.productId, current);
      }
    }
    const ranked = [...totals.entries()].sort((a, b) =>
      b[1].units - a[1].units || b[1].revenuePaise - a[1].revenuePaise);
    const rankMap = new Map(ranked.map(([productId], index) => [productId, index + 1]));
    const products = await db.collection("products").get();
    for (let offset = 0; offset < products.docs.length; offset += 400) {
      const batch = db.batch();
      products.docs.slice(offset, offset + 400).forEach((product) => {
        const aggregate = totals.get(product.id) ?? { units: 0, revenuePaise: 0 };
        const rank = rankMap.get(product.id) ?? null;
        const mode = product.data().merchandising?.bestSellerMode ?? "auto";
        const isBestSeller = mode === "force_on" || (mode === "auto" && rank !== null && rank <= config.bestSellerLimit);
        batch.update(product.ref, {
          salesMetrics: {
            unitsSold: aggregate.units,
            revenuePaise: aggregate.revenuePaise,
            bestSellerRank: rank,
            windowDays: config.bestSellerWindowDays,
            calculatedAt: timestamp(),
          },
          isBestSeller,
        });
      });
      await batch.commit();
    }
};

export const recomputeBestSellers = onSchedule(
  { region: REGION, schedule: "every day 02:00", timeZone: "Asia/Kolkata" },
  recomputeBestSellersJob,
);

const deliverNotificationSnapshot = async (snapshot: FirebaseFirestore.DocumentSnapshot): Promise<void> => {
    if (!snapshot) return;
    const endpoint = notificationEndpoint.value();
    const token = notificationToken.value();
    if (!endpoint || !token) {
      await snapshot.ref.update({
        status: "configuration_required",
        lastError: "Notification webhook is not configured",
        updatedAt: timestamp(),
      });
      return;
    }
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: snapshot.id, ...snapshot.data() }),
      });
      if (!response.ok) throw new Error(`Notification provider returned ${response.status}`);
      await snapshot.ref.update({ status: "sent", sentAt: timestamp(), attempts: FieldValue.increment(1) });
    } catch (error) {
      logger.error("Notification delivery failed", error);
      await snapshot.ref.update({
        status: "failed",
        lastError: (error as Error).message,
        attempts: FieldValue.increment(1),
        updatedAt: timestamp(),
      });
    }
};

export const processPendingNotificationsJob = async (limit = 50): Promise<void> => {
  const pending = await db.collection("notifications").where("status", "==", "pending").limit(limit).get();
  for (const snapshot of pending.docs) {
    await deliverNotificationSnapshot(snapshot);
  }
};

export const deliverNotification = onDocumentCreated(
  { region: REGION, document: "notifications/{notificationId}", secrets: [notificationEndpoint, notificationToken] },
  async (event) => {
    if (event.data) await deliverNotificationSnapshot(event.data);
  },
);

export const retryNotification = onCall(callableOptions, async (request) => {
  const admin = requireAdmin(request);
  const notificationId = z.string().min(1).parse(request.data?.notificationId);
  const original = await db.doc(`notifications/${notificationId}`).get();
  if (!original.exists) fail("not-found", "Notification not found");
  const copy = { ...original.data() };
  delete copy.sentAt;
  delete copy.lastError;
  await db.collection("notifications").add({
    ...copy,
    status: "pending",
    retryOf: original.id,
    attempts: 0,
    requestedBy: admin.auth.uid,
    createdAt: timestamp(),
  });
  return { success: true };
});

export const setAdminClaim = onCall(callableOptions, async (request) => {
  const admin = requireAdmin(request);
  const input = parse(z.object({ uid: z.string().min(1), enabled: z.boolean() }), request.data);
  const user = await getAuth().getUser(input.uid);
  await getAuth().setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), admin: input.enabled });
  await db.collection("auditEvents").add({
    type: "admin_claim_changed",
    targetUid: user.uid,
    enabled: input.enabled,
    actorId: admin.auth.uid,
    createdAt: timestamp(),
  });
  return { uid: user.uid, enabled: input.enabled };
});
