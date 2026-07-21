import { z } from "zod";

const id = z.string().trim().min(1).max(160);
const money = z.number().int().min(0).max(100_000_000);

export const imageSchema = z.object({
  id: id,
  storagePath: z.string().max(1000).optional().default(""),
  url: z.string().url().max(3000),
  alt: z.string().trim().max(200).default(""),
  sortOrder: z.number().int().min(0).max(100),
  colorId: z.string().trim().max(100).optional(),
});

export const variantSchema = z.object({
  id: id.optional(),
  sku: z.string().trim().max(80).optional().default(""),
  color: z.object({
    id: id,
    name: z.string().trim().min(1).max(80),
    hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().or(z.literal("")),
  }),
  size: z.string().trim().max(80).optional().default(""),
  onHandQuantity: z.number().int().min(0).max(1_000_000),
  lowStockThreshold: z.number().int().min(0).max(1_000_000).default(0),
  status: z.enum(["active", "inactive"]).default("active"),
  imageIds: z.array(id).max(20).default([]),
});

export const productSchema = z.object({
  id: id.optional(),
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(5000).default(""),
  dimensions: z.string().trim().max(200).default(""),
  categoryId: id,
  categoryName: z.string().trim().min(1).max(120),
  mrpPaise: money,
  discountPercent: z.number().min(0).max(100),
  status: z.enum(["draft", "active", "archived"]),
  images: z.array(imageSchema).max(20),
  variants: z.array(variantSchema).min(1).max(100),
  sellerId: id.optional().or(z.literal("")),
  sellerPayoutType: z.enum(["fixed", "percentage"]).default("fixed"),
  sellerPayoutValue: z.number().min(0).max(100_000_000).default(0),
  unitCostPaise: money.optional().default(0),
  packagingCostPaise: money.optional().default(0),
  merchandising: z.object({
    bestSellerMode: z.enum(["auto", "force_on", "force_off"]).default("auto"),
    featured: z.boolean().default(false),
  }),
});

export const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(160),
  phone: z.string().regex(/^\d{10}$/),
  line1: z.string().trim().min(3).max(300),
  line2: z.string().trim().max(300).default(""),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().min(2).max(120),
  pincode: z.string().regex(/^\d{6}$/),
});

export const checkoutSchema = z.object({
  idempotencyKey: z.string().uuid(),
  items: z.array(z.object({
    productId: id,
    variantId: id,
    quantity: z.number().int().min(1).max(100),
  })).min(1).max(50),
  address: addressSchema,
  paymentMethod: z.literal("online"),
  paymentProofId: z.string().uuid({ message: "Payment screenshot is required for online payment" }),
});

export const cancellationSchema = z.object({
  orderId: id,
  reasonCode: z.enum(["out_of_stock", "customer_request", "address_issue", "payment_issue", "other"]),
  customerMessage: z.string().trim().min(10).max(1000),
  internalNote: z.string().trim().max(2000).default(""),
});

export const productRequestSchema = z.object({
  name: z.string().trim().min(2).max(160),
  contactNumber: z.string().regex(/^\+?[0-9]{10,15}$/),
  productCategory: z.string().trim().min(1).max(120),
  preferredColor: z.string().trim().max(120).default(""),
  productSize: z.string().trim().max(120).default(""),
  expectedByDate: z.string().max(30).default(""),
  referenceProductLink: z.string().url().max(2000).optional().or(z.literal("")),
  additionalDetails: z.string().trim().max(5000).default(""),
  attachmentUrls: z.array(z.string().url()).max(5).default([]),
});
