import assert from "node:assert/strict";
import test from "node:test";
import {
  CloudinaryReference,
  cloudinaryDownloadUrl,
  decodeCloudinaryReference,
  encodeCloudinaryReference,
} from "./storage";

test("Cloudinary storage references round-trip without exposing credentials", () => {
  const reference: CloudinaryReference = {
    version: 1,
    resourceType: "image",
    deliveryType: "authenticated",
    publicId: "potters-central/payment-proofs/customer-1/proof-1",
    format: "png",
    assetVersion: 123456,
  };
  const encoded = encodeCloudinaryReference(reference);
  assert.match(encoded, /^cloudinary:[A-Za-z0-9_-]+$/);
  assert.equal(encoded.includes("api_secret"), false);
  assert.deepEqual(decodeCloudinaryReference(encoded), reference);
});

test("Cloudinary storage references reject malformed or unsafe values", () => {
  assert.equal(decodeCloudinaryReference("products/example.jpg"), null);
  assert.equal(decodeCloudinaryReference("cloudinary:not-json"), null);
  const unsafe = encodeCloudinaryReference({
    version: 1,
    resourceType: "image",
    deliveryType: "upload",
    publicId: "/unsafe/path",
    format: "jpg",
    assetVersion: 1,
  });
  assert.equal(decodeCloudinaryReference(unsafe), null);
});

test("Cloudinary storage references preserve public delivery metadata", () => {
  const reference: CloudinaryReference = {
    version: 1,
    resourceType: "image",
    deliveryType: "upload",
    publicId: "potters-central/products/product-1/image-1",
    format: "webp",
    assetVersion: 99,
  };
  assert.deepEqual(decodeCloudinaryReference(encodeCloudinaryReference(reference)), reference);
});

test("authenticated payment-proof references produce signed delivery URLs", () => {
  process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
  process.env.CLOUDINARY_API_KEY = "test-key";
  process.env.CLOUDINARY_API_SECRET = "test-secret";
  process.env.CLOUDINARY_FOLDER = "potters-central";
  const storagePath = encodeCloudinaryReference({
    version: 1,
    resourceType: "image",
    deliveryType: "authenticated",
    publicId: "potters-central/payment-proofs/customer-1/proof-1",
    format: "png",
    assetVersion: 123456,
  });
  const url = cloudinaryDownloadUrl(storagePath);
  assert.match(url, /^https:\/\/res\.cloudinary\.com\/test-cloud\/image\/authenticated\/s--[A-Za-z0-9_-]+--\/v123456\//);
  assert.match(url, /proof-1\.png$/);
});

test("signed delivery refuses references outside the configured application folder", () => {
  process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
  process.env.CLOUDINARY_API_KEY = "test-key";
  process.env.CLOUDINARY_API_SECRET = "test-secret";
  process.env.CLOUDINARY_FOLDER = "potters-central";
  const storagePath = encodeCloudinaryReference({
    version: 1,
    resourceType: "image",
    deliveryType: "authenticated",
    publicId: "another-application/payment-proof",
    format: "png",
    assetVersion: 1,
  });
  assert.throws(() => cloudinaryDownloadUrl(storagePath), /outside the configured application folder/);
});
