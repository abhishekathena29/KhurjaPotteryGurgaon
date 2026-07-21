import { readFileSync } from "node:fs";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { buildSearchTokens, calculateSalePrice, deriveStockStatus, formatSku, normalizeSku, validateConfig } from "../domain";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const apply = process.argv.includes("--apply");
const stockIndex = process.argv.indexOf("--stock");
const stockFile = stockIndex >= 0 ? process.argv[stockIndex + 1] : "";
const stock: Record<string, number> = stockFile ? JSON.parse(readFileSync(stockFile, "utf8")) : {};

const run = async (): Promise<void> => {
  const [configSnapshot, productsSnapshot, categoriesSnapshot, sellersSnapshot] = await Promise.all([
    db.doc("commerceConfig/default").get(),
    db.collection("products").get(),
    db.collection("categories").get(),
    db.collection("sellers").get(),
  ]);
  if (!configSnapshot.exists) throw new Error("Initialize commerceConfig/default before migration");
  const config = validateConfig(configSnapshot.data() ?? {});
  const categories = new Map(categoriesSnapshot.docs.map((doc) => [String(doc.data().name).toLowerCase(), doc]));
  const sellers = new Map(sellersSnapshot.docs.map((doc) => [String(doc.data().name).toLowerCase(), doc]));
  const legacy = productsSnapshot.docs.filter((doc) => doc.data().schemaVersion !== 2);
  const report: Array<Record<string, unknown>> = [];

  for (const product of legacy) {
    const data = product.data();
    const category = categories.get(String(data.category ?? "").toLowerCase());
    const openingQuantity = stock[product.id] ?? (data.sku ? stock[data.sku] : undefined);
    if (!category) {
      report.push({ productId: product.id, status: "blocked", reason: "Category could not be matched" });
      continue;
    }
    if (!apply) {
      report.push({
        productId: product.id,
        name: data.name ?? data.category,
        status: "ready",
        openingQuantity: openingQuantity ?? 0,
        publication: openingQuantity === undefined ? "draft (stocktake required)" : "preserve legacy status",
      });
      continue;
    }

    await db.runTransaction(async (tx) => {
      const counterRef = db.doc("counters/productSku");
      const counter = await tx.get(counterRef);
      let nextNumber = Number(counter.data()?.nextNumber ?? 1);
      let sku = normalizeSku(String(data.sku ?? ""));
      let claim = sku ? await tx.get(db.doc(`skus/${sku}`)) : null;
      if (!sku || (claim?.exists && claim.data()?.productId !== product.id)) {
        do {
          sku = formatSku(config.skuPrefix, config.skuPadding, nextNumber++);
          claim = await tx.get(db.doc(`skus/${sku}`));
        } while (claim.exists);
      }
      const variantRef = product.ref.collection("variants").doc();
      const quantity = Number.isSafeInteger(openingQuantity) && Number(openingQuantity) >= 0 ? Number(openingQuantity) : 0;
      const discountPercent = Math.min(99, Math.max(0, Number(data.discount ?? 0)));
      const legacySalePricePaise = Math.max(0, Math.round(Number(data.price ?? 0) * 100));
      const mrpPaise = discountPercent > 0
        ? Math.round(legacySalePricePaise / (1 - discountPercent / 100))
        : legacySalePricePaise;
      const salePricePaise = calculateSalePrice(mrpPaise, discountPercent);
      const colorName = String(data.color || "Unspecified");
      const colorId = colorName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "unspecified";
      const imageUrls: string[] = data.imageUrls ?? (data.imageUrl ? [data.imageUrl] : []);
      const images = imageUrls.map((url, index) => ({ id: `legacy-${index}`, storagePath: "", url, alt: data.name || data.category || "Product", sortOrder: index }));
      const seller = sellers.get(String(data.sellerName ?? data.ownerName ?? "").toLowerCase());
      const status = openingQuantity === undefined ? "draft" : (data.isActive === false ? "draft" : "active");
      const variant = {
        id: variantRef.id,
        sku,
        color: { id: colorId, name: colorName, hex: "" },
        size: String(data.size ?? ""),
        status: "active",
        imageIds: [],
        onHandQuantity: quantity,
        reservedQuantity: 0,
        availableQuantity: quantity,
        lowStockThreshold: 0,
        stockStatus: deriveStockStatus(quantity, 0),
        createdAt: data.createdAt ?? FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      tx.set(variantRef, variant);
      tx.set(db.doc(`skus/${sku}`), { displaySku: sku, productId: product.id, variantId: variantRef.id, createdAt: FieldValue.serverTimestamp() });
      tx.set(product.ref, {
        name: data.name || data.category || "Product",
        slug: String(data.name || data.category || "product").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        description: data.description || "",
        dimensions: data.dimensions || "",
        categoryId: category.id,
        categoryName: category.data().name,
        mrpPaise,
        discountPercent,
        salePricePaise,
        currency: config.currency,
        images,
        variantSummary: [{ id: variant.id, sku, color: variant.color, size: variant.size, status: "active", imageIds: [], availableQuantity: quantity, stockStatus: variant.stockStatus }],
        availableQuantity: quantity,
        stockStatus: variant.stockStatus,
        status,
        merchandising: { bestSellerMode: "auto", featured: false },
        salesMetrics: { unitsSold: 0, revenuePaise: 0, bestSellerRank: null },
        searchTokens: buildSearchTokens([data.name, data.category, data.description, sku, colorName, data.size]),
        schemaVersion: 2,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      tx.set(db.doc(`productCommercials/${product.id}`), {
        sellerId: seller?.id ?? null,
        sellerPayoutType: "fixed",
        sellerPayoutValue: 0,
        sellerPayoutPerUnitPaise: 0,
        unitCostPaise: 0,
        packagingCostPaise: 0,
        migrationReviewRequired: true,
        updatedAt: FieldValue.serverTimestamp(),
      });
      tx.set(db.collection("inventoryMovements").doc(), {
        productId: product.id, variantId: variantRef.id, sku, type: "opening", quantityDelta: quantity,
        reason: "Legacy catalogue migration", actorId: "migration", createdAt: FieldValue.serverTimestamp(),
      });
      tx.set(counterRef, { nextNumber, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    });
    report.push({ productId: product.id, status: "migrated" });
  }
  process.stdout.write(`${JSON.stringify({ mode: apply ? "apply" : "dry-run", total: legacy.length, report }, null, 2)}\n`);
};

run().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
