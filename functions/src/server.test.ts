import assert from "node:assert/strict";
import { before, test } from "node:test";
import request from "supertest";

let app: Awaited<typeof import("./server")>["default"];

before(async () => {
  process.env.BACKEND_ENFORCE_APP_CHECK = "false";
  app = (await import("./server")).default;
});

test("backend health endpoint is available", async () => {
  const response = await request(app).get("/api/health").expect(200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.service, "potters-central-backend");
});

test("unknown callable operations fail closed", async () => {
  const response = await request(app)
    .post("/api/call/notAnOperation")
    .send({ data: {} })
    .expect(404);
  assert.equal(response.body.error.status, "NOT_FOUND");
});

test("removed offline payment operation is not exposed", async () => {
  const response = await request(app)
    .post("/api/call/recordCodPayment")
    .send({ data: {} })
    .expect(404);
  assert.equal(response.body.error.status, "NOT_FOUND");
});

test("admin callable operations require a Firebase ID token", async () => {
  const response = await request(app)
    .post("/api/call/verifyAdminAccess")
    .send({ data: {} })
    .expect(401);
  assert.equal(response.body.error.status, "UNAUTHENTICATED");
});

test("cron jobs reject missing server credentials", async () => {
  const response = await request(app)
    .post("/api/jobs/expire-reservations")
    .expect(401);
  assert.equal(response.body.error.message, "Invalid cron credentials");
});

test("payment QR and proof uploads require authentication", async () => {
  await request(app).post("/api/payment-qr").expect(401);
  await request(app).post("/api/payment-proofs").expect(401);
  await request(app).get("/api/payment-proofs/00000000-0000-4000-8000-000000000000").expect(401);
});
