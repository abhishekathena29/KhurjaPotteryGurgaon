import { randomUUID, timingSafeEqual } from "node:crypto";
import path from "node:path";
import cors from "cors";
import express, { NextFunction, Request, RequestHandler, Response } from "express";
import multer from "multer";
import { getAppCheck } from "firebase-admin/app-check";
import { DecodedIdToken, getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import {
  deleteLocalPrivateImage,
  deleteStoredImage,
  downloadCloudinaryImage,
  readLocalPrivateImage,
  storeLocalPrivateImage,
  storeLocalPublicImage,
  uploadCloudinaryImage,
} from "./storage";
import {
  adjustInventory,
  archiveProduct,
  cancelOrder,
  createCheckout,
  createSettlement,
  deleteCategory,
  expireReservationsJob,
  getCatalogue,
  getAdminSnapshot,
  getProductAdmin,
  paymentWebhook,
  previewBulkProductUpdate,
  processPendingNotificationsJob,
  recomputeBestSellersJob,
  recordSettlementPayment,
  retryNotification,
  runBulkProductUpdate,
  saveCategory,
  saveProduct,
  saveSeller,
  setAdminClaim,
  submitProductRequest,
  transitionOrder,
  updateCommerceConfig,
  updateProductRequest,
  verifyManualPayment,
  verifyAdminAccess,
} from "./index";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

const storageDriver = process.env.BACKEND_STORAGE_DRIVER ?? "local";
const storageReady = storageDriver !== "cloudinary" || [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
].every((name) => Boolean(process.env[name]?.trim()));
const uploadRoot = path.resolve(process.env.BACKEND_UPLOAD_DIR ?? path.join(process.cwd(), "uploads"));
const publicBackendUrl = (process.env.BACKEND_PUBLIC_URL ?? "http://127.0.0.1:3001").replace(/\/$/, "");
if (storageDriver === "local") {
  app.use("/uploads", express.static(uploadRoot, { immutable: true, maxAge: "1y" }));
}

const configuredOrigins = (process.env.BACKEND_ALLOWED_ORIGINS ?? "http://127.0.0.1:5173,http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || configuredOrigins.includes(origin)) callback(null, true);
    else callback(new Error("Origin is not allowed"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["authorization", "content-type", "x-firebase-appcheck", "x-cron-secret"],
  maxAge: 3600,
}));

app.use(express.json({
  limit: "1mb",
  verify(request, _response, buffer) {
    (request as Request & { rawBody?: Buffer }).rawBody = buffer;
  },
}));

const callableHandlers: Record<string, RequestHandler> = {
  getCatalogue,
  updateCommerceConfig,
  verifyAdminAccess,
  getAdminSnapshot,
  saveCategory,
  deleteCategory,
  saveProduct,
  getProductAdmin,
  archiveProduct,
  adjustInventory,
  createCheckout,
  transitionOrder,
  cancelOrder,
  verifyManualPayment,
  submitProductRequest,
  updateProductRequest,
  saveSeller,
  createSettlement,
  recordSettlementPayment,
  previewBulkProductUpdate,
  runBulkProductUpdate,
  retryNotification,
  setAdminClaim,
} as unknown as Record<string, RequestHandler>;

app.get("/api/health", (_request, response) => {
  response.status(storageReady ? 200 : 503).json({
    ok: storageReady,
    service: "potters-central-backend",
    projectId: process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || null,
    storageDriver,
    storageReady,
  });
});

app.post("/api/call/:operation", (request, response, next) => {
  const handler = callableHandlers[request.params.operation];
  if (!handler) {
    response.status(404).json({ error: { status: "NOT_FOUND", message: "Backend operation not found" } });
    return;
  }
  Promise.resolve(handler(request, response, next)).catch(next);
});

const adminEmails = (): Set<string> => new Set((process.env.BACKEND_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean));

const authenticateIdentity = async (request: Request): Promise<DecodedIdToken> => {
  const authorization = request.header("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) throw Object.assign(new Error("Authentication is required"), { status: 401 });
  let decoded: DecodedIdToken;
  try {
    decoded = await getAuth().verifyIdToken(authorization.slice(7));
  } catch {
    throw Object.assign(new Error("Authentication token is invalid or expired"), { status: 401 });
  }
  if (process.env.BACKEND_ENFORCE_APP_CHECK !== "false") {
    const token = request.header("x-firebase-appcheck");
    if (!token) throw Object.assign(new Error("App Check token is required"), { status: 401 });
    try {
      await getAppCheck().verifyToken(token);
    } catch {
      throw Object.assign(new Error("App Check token is invalid or expired"), { status: 401 });
    }
  }
  return decoded;
};

const isAdministrator = (decoded: DecodedIdToken): boolean =>
  decoded.admin === true || Boolean(decoded.email && adminEmails().has(decoded.email.toLowerCase()));

const authenticateAdmin = async (request: Request): Promise<DecodedIdToken> => {
  const decoded = await authenticateIdentity(request);
  if (!isAdministrator(decoded)) throw Object.assign(new Error("Administrator role is required"), { status: 403 });
  return decoded;
};

const imageType = (buffer: Buffer): { contentType: string; extension: string } | null => {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { contentType: "image/jpeg", extension: "jpg" };
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { contentType: "image/png", extension: "png" };
  }
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return { contentType: "image/webp", extension: "webp" };
  }
  if (buffer.length >= 6 && ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"))) {
    return { contentType: "image/gif", extension: "gif" };
  }
  return null;
};

const maximumImageBytes = Number(process.env.BACKEND_MAX_IMAGE_BYTES ?? 10 * 1024 * 1024);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maximumImageBytes, files: 1 },
});

app.post("/api/product-images/:productId", upload.single("image"), async (request, response, next) => {
  try {
    await authenticateAdmin(request);
    const productId = String(request.params.productId);
    if (!/^[A-Za-z0-9_-]{1,160}$/.test(productId)) {
      response.status(400).json({ error: { message: "Invalid product ID" } });
      return;
    }
    if (!request.file) {
      response.status(400).json({ error: { message: "An image file is required" } });
      return;
    }
    const detected = imageType(request.file.buffer);
    if (!detected) {
      response.status(415).json({ error: { message: "Only valid JPEG, PNG, WebP, or GIF images are accepted" } });
      return;
    }
    const imageId = randomUUID();
    let storagePath = `products/${productId}/${imageId}/original.${detected.extension}`;
    let url: string;
    if (storageDriver === "local") {
      await storeLocalPublicImage(storagePath, request.file.buffer);
      url = `${publicBackendUrl}/uploads/${storagePath.split("/").map(encodeURIComponent).join("/")}`;
    } else if (storageDriver === "firebase") {
      const downloadToken = randomUUID();
      const bucket = getStorage().bucket();
      await bucket.file(storagePath).save(request.file.buffer, {
        resumable: false,
        contentType: detected.contentType,
        metadata: {
          cacheControl: "public,max-age=31536000,immutable",
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
            productId,
            imageId,
            originalName: request.file.originalname,
          },
        },
      });
      url = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket.name)}/o/${encodeURIComponent(storagePath)}?alt=media&token=${downloadToken}`;
    } else if (storageDriver === "cloudinary") {
      const uploaded = await uploadCloudinaryImage({
        buffer: request.file.buffer,
        relativePublicId: `products/${productId}/${imageId}`,
        image: detected,
        deliveryType: "upload",
        tags: ["product-image"],
      });
      storagePath = uploaded.storagePath;
      url = uploaded.url;
    } else {
      throw new Error(`Unsupported BACKEND_STORAGE_DRIVER: ${storageDriver}`);
    }
    response.status(201).json({ id: imageId, storagePath, url, alt: "", sortOrder: 0 });
  } catch (error) {
    next(error);
  }
});

app.post("/api/payment-qr", upload.single("image"), async (request, response, next) => {
  try {
    const admin = await authenticateAdmin(request);
    if (!request.file) {
      response.status(400).json({ error: { message: "A QR code image is required" } });
      return;
    }
    const detected = imageType(request.file.buffer);
    if (!detected) {
      response.status(415).json({ error: { message: "Only valid JPEG, PNG, WebP, or GIF images are accepted" } });
      return;
    }
    const imageId = randomUUID();
    let storagePath = `payment/qr/${imageId}.${detected.extension}`;
    let url: string;
    if (storageDriver === "local") {
      await storeLocalPublicImage(storagePath, request.file.buffer);
      url = `${publicBackendUrl}/uploads/${storagePath.split("/").map(encodeURIComponent).join("/")}`;
    } else if (storageDriver === "firebase") {
      const bucket = getStorage().bucket();
      const downloadToken = randomUUID();
      await bucket.file(storagePath).save(request.file.buffer, {
        resumable: false,
        contentType: detected.contentType,
        metadata: {
          cacheControl: "public,max-age=3600",
          metadata: { firebaseStorageDownloadTokens: downloadToken, kind: "manual-payment-qr" },
        },
      });
      url = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket.name)}/o/${encodeURIComponent(storagePath)}?alt=media&token=${downloadToken}`;
    } else if (storageDriver === "cloudinary") {
      const uploaded = await uploadCloudinaryImage({
        buffer: request.file.buffer,
        relativePublicId: `payment/qr/${imageId}`,
        image: detected,
        deliveryType: "upload",
        tags: ["payment-qr"],
      });
      storagePath = uploaded.storagePath;
      url = uploaded.url;
    } else {
      throw new Error(`Unsupported BACKEND_STORAGE_DRIVER: ${storageDriver}`);
    }
    const configRef = getFirestore().doc("commerceConfig/default");
    const previousConfig = await configRef.get();
    const previousStoragePath = String(previousConfig.data()?.manualPaymentQrStoragePath ?? "");
    const batch = getFirestore().batch();
    const updatedAt = FieldValue.serverTimestamp();
    batch.set(configRef, {
      manualPaymentQrUrl: url,
      manualPaymentQrStoragePath: storagePath,
      manualPaymentQrUpdatedAt: updatedAt,
      manualPaymentQrUpdatedBy: admin.uid,
      updatedAt,
    }, { merge: true });
    batch.set(getFirestore().doc("publicConfig/commerce"), {
      manualPaymentQrUrl: url,
      updatedAt,
    }, { merge: true });
    try {
      await batch.commit();
    } catch (error) {
      await deleteStoredImage(storagePath, "payment/qr").catch((cleanupError) =>
        console.warn("Could not remove payment QR after configuration update failed", { storagePath, cleanupError }));
      throw error;
    }
    if (previousStoragePath && previousStoragePath !== storagePath) {
      deleteStoredImage(previousStoragePath, "payment/qr").catch((error) =>
        console.warn("Could not remove superseded payment QR", { previousStoragePath, error }));
    }
    response.status(201).json({ id: imageId, storagePath, url });
  } catch (error) {
    next(error);
  }
});

app.post("/api/payment-proofs", upload.single("image"), async (request, response, next) => {
  try {
    const customer = await authenticateIdentity(request);
    if (!request.file) {
      response.status(400).json({ error: { message: "A payment screenshot is required" } });
      return;
    }
    const detected = imageType(request.file.buffer);
    if (!detected) {
      response.status(415).json({ error: { message: "Only valid JPEG, PNG, WebP, or GIF images are accepted" } });
      return;
    }
    const proofId = randomUUID();
    let storagePath = `payment-proofs/${customer.uid}/${proofId}.${detected.extension}`;
    let localRelativePath = "";
    if (storageDriver === "local") {
      localRelativePath = path.join(customer.uid, `${proofId}.${detected.extension}`);
      await storeLocalPrivateImage(localRelativePath, request.file.buffer);
    } else if (storageDriver === "firebase") {
      await getStorage().bucket().file(storagePath).save(request.file.buffer, {
        resumable: false,
        contentType: detected.contentType,
        metadata: { cacheControl: "private,no-store", metadata: { ownerId: customer.uid, proofId } },
      });
    } else if (storageDriver === "cloudinary") {
      const uploaded = await uploadCloudinaryImage({
        buffer: request.file.buffer,
        relativePublicId: `payment-proofs/${proofId}`,
        image: detected,
        deliveryType: "authenticated",
        tags: ["payment-proof"],
      });
      storagePath = uploaded.storagePath;
    } else {
      throw new Error(`Unsupported BACKEND_STORAGE_DRIVER: ${storageDriver}`);
    }
    try {
      await getFirestore().doc(`paymentProofUploads/${proofId}`).create({
        ownerId: customer.uid,
        ownerEmail: customer.email ?? "",
        status: "uploaded",
        storageDriver,
        storagePath,
        localRelativePath,
        contentType: detected.contentType,
        originalName: request.file.originalname.slice(0, 300),
        sizeBytes: request.file.size,
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      const cleanup = storageDriver === "local"
        ? deleteLocalPrivateImage(localRelativePath)
        : deleteStoredImage(storagePath, "payment-proofs");
      await cleanup.catch((cleanupError) =>
        console.warn("Could not remove payment proof after metadata creation failed", { proofId, cleanupError }));
      throw error;
    }
    response.status(201).json({ id: proofId, contentType: detected.contentType, originalName: request.file.originalname });
  } catch (error) {
    next(error);
  }
});

app.get("/api/payment-proofs/:proofId", async (request, response, next) => {
  try {
    const identity = await authenticateIdentity(request);
    const proofId = String(request.params.proofId);
    if (!/^[0-9a-f-]{36}$/i.test(proofId)) {
      response.status(400).json({ error: { message: "Invalid payment proof ID" } });
      return;
    }
    const snapshot = await getFirestore().doc(`paymentProofUploads/${proofId}`).get();
    if (!snapshot.exists) {
      response.status(404).json({ error: { message: "Payment proof not found" } });
      return;
    }
    const proof = snapshot.data() ?? {};
    if (proof.ownerId !== identity.uid && !isAdministrator(identity)) {
      response.status(403).json({ error: { message: "You cannot view this payment proof" } });
      return;
    }
    let buffer: Buffer;
    if (proof.storageDriver === "local") {
      buffer = await readLocalPrivateImage(String(proof.localRelativePath ?? ""));
    } else if (proof.storageDriver === "firebase") {
      [buffer] = await getStorage().bucket().file(String(proof.storagePath)).download();
    } else if (proof.storageDriver === "cloudinary") {
      buffer = await downloadCloudinaryImage(String(proof.storagePath));
    } else {
      throw Object.assign(new Error("Stored payment proof driver is invalid"), { status: 500 });
    }
    response.set({
      "content-type": String(proof.contentType ?? "application/octet-stream"),
      "cache-control": "private, no-store, max-age=0",
      "content-disposition": `inline; filename="payment-proof-${proofId}"`,
      "x-content-type-options": "nosniff",
    });
    response.send(buffer);
  } catch (error) {
    next(error);
  }
});

app.post("/api/payment-webhook", paymentWebhook as unknown as RequestHandler);

const validCronSecret = (candidate: string): boolean => {
  const expected = process.env.BACKEND_CRON_SECRET ?? "";
  const left = Buffer.from(candidate);
  const right = Buffer.from(expected);
  return Boolean(expected) && left.length === right.length && timingSafeEqual(left, right);
};

const cron = (job: () => Promise<void>): RequestHandler => async (request, response, next) => {
  if (!validCronSecret(request.header("x-cron-secret") ?? "")) {
    response.status(401).json({ error: { message: "Invalid cron credentials" } });
    return;
  }
  try {
    await job();
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
};

app.post("/api/jobs/expire-reservations", cron(expireReservationsJob));
app.post("/api/jobs/recompute-best-sellers", cron(recomputeBestSellersJob));
app.post("/api/jobs/process-notifications", cron(() => processPendingNotificationsJob(50)));

app.use((error: Error & { status?: number }, _request: Request, response: Response, _next: NextFunction) => {
  const uploadStatus = error instanceof multer.MulterError ? (error.code === "LIMIT_FILE_SIZE" ? 413 : 400) : undefined;
  const status = uploadStatus ?? (error.status && error.status >= 400 && error.status < 600 ? error.status : 500);
  if (status === 500) console.error(error);
  response.status(status).json({ error: { message: status === 500 ? "Internal backend error" : error.message } });
});

let activeServer: ReturnType<typeof app.listen> | undefined;

if (require.main === module) {
  const port = Number(process.env.PORT ?? 3001);
  const host = process.env.HOST ?? "127.0.0.1";
  activeServer = app.listen(port, host, () =>
    process.stdout.write(`Potters Central backend listening on ${host}:${port}\n`));
  const shutdown = (signal: string): void => {
    process.stdout.write(`${signal} received; closing backend gracefully\n`);
    activeServer?.close((error) => {
      if (error) {
        console.error(error);
        process.exitCode = 1;
      }
    });
  };
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
}

export default app;
