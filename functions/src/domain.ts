export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export type CommerceConfig = {
  currency: "INR";
  deliveryFeePaise: number;
  prepaidEnabled: boolean;
  reservationTtlMinutes: number;
  manualPaymentVerificationTtlMinutes: number;
  manualPaymentQrUrl: string;
  manualPaymentPayeeName: string;
  manualPaymentInstructions: string;
  skuPrefix: string;
  skuPadding: number;
  orderPrefix: string;
  orderPadding: number;
  bestSellerWindowDays: number;
  bestSellerLimit: number;
};

export const normalizeSku = (value: string): string =>
  value.trim().toUpperCase().replace(/[^A-Z0-9_-]+/g, "-").replace(/-+/g, "-");

export const formatSku = (prefix: string, padding: number, number: number): string => {
  const normalizedPrefix = normalizeSku(prefix);
  if (!normalizedPrefix) throw new Error("SKU prefix is required");
  if (!Number.isInteger(padding) || padding < 1 || padding > 12) {
    throw new Error("SKU padding must be an integer from 1 to 12");
  }
  if (!Number.isSafeInteger(number) || number < 1) throw new Error("SKU number is invalid");
  return `${normalizedPrefix}-${String(number).padStart(padding, "0")}`;
};

export const calculateSalePrice = (mrpPaise: number, discountPercent: number): number => {
  if (!Number.isSafeInteger(mrpPaise) || mrpPaise < 0) throw new Error("MRP must be non-negative integer paise");
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
    throw new Error("Discount must be between 0 and 100");
  }
  return mrpPaise - Math.round((mrpPaise * discountPercent) / 100);
};

export const calculateMargin = (
  salePricePaise: number,
  sellerPayoutPaise: number,
  variableCostPaise = 0,
): { amountPaise: number; percent: number } => {
  const amountPaise = salePricePaise - sellerPayoutPaise - variableCostPaise;
  return {
    amountPaise,
    percent: salePricePaise === 0 ? 0 : Number(((amountPaise / salePricePaise) * 100).toFixed(2)),
  };
};

export const deriveStockStatus = (
  availableQuantity: number,
  lowStockThreshold: number,
): StockStatus => {
  if (availableQuantity <= 0) return "out_of_stock";
  if (availableQuantity <= lowStockThreshold) return "low_stock";
  return "in_stock";
};

export type InventoryBalance = { onHandQuantity: number; reservedQuantity: number; availableQuantity: number };

const validInventory = (onHandQuantity: number, reservedQuantity: number): void => {
  if (!Number.isSafeInteger(onHandQuantity) || !Number.isSafeInteger(reservedQuantity) ||
      onHandQuantity < 0 || reservedQuantity < 0 || reservedQuantity > onHandQuantity) {
    throw new Error("Inventory balance is inconsistent");
  }
};

export const reserveInventory = (onHandQuantity: number, reservedQuantity: number, quantity: number): InventoryBalance => {
  validInventory(onHandQuantity, reservedQuantity);
  if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error("Reservation quantity must be positive integer");
  const nextReserved = reservedQuantity + quantity;
  if (nextReserved > onHandQuantity) throw new Error("OUT_OF_STOCK");
  return { onHandQuantity, reservedQuantity: nextReserved, availableQuantity: onHandQuantity - nextReserved };
};

export const commitInventory = (onHandQuantity: number, reservedQuantity: number, quantity: number): InventoryBalance => {
  validInventory(onHandQuantity, reservedQuantity);
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > reservedQuantity) {
    throw new Error("Reservation cannot be committed");
  }
  const nextOnHand = onHandQuantity - quantity;
  const nextReserved = reservedQuantity - quantity;
  return { onHandQuantity: nextOnHand, reservedQuantity: nextReserved, availableQuantity: nextOnHand - nextReserved };
};

export const releaseInventory = (onHandQuantity: number, reservedQuantity: number, quantity: number): InventoryBalance => {
  validInventory(onHandQuantity, reservedQuantity);
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > reservedQuantity) {
    throw new Error("Reservation cannot be released");
  }
  const nextReserved = reservedQuantity - quantity;
  return { onHandQuantity, reservedQuantity: nextReserved, availableQuantity: onHandQuantity - nextReserved };
};

export const restoreCommittedInventory = (onHandQuantity: number, reservedQuantity: number, quantity: number): InventoryBalance => {
  validInventory(onHandQuantity, reservedQuantity);
  if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error("Restore quantity must be positive integer");
  const nextOnHand = onHandQuantity + quantity;
  return { onHandQuantity: nextOnHand, reservedQuantity, availableQuantity: nextOnHand - reservedQuantity };
};

export const normalizeSearchText = (value: string): string =>
  value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");

export const buildSearchTokens = (values: Array<string | undefined>): string[] => {
  const words = normalizeSearchText(values.filter(Boolean).join(" ")).split(" ").filter(Boolean);
  const tokens = new Set<string>();
  for (const word of words) {
    tokens.add(word);
    for (let i = 2; i <= Math.min(word.length, 12); i += 1) tokens.add(word.slice(0, i));
  }
  return [...tokens].slice(0, 500);
};

export const validateConfig = (value: Record<string, unknown>): CommerceConfig => {
  const integer = (key: string, min: number, max: number): number => {
    const candidate = value[key];
    if (!Number.isSafeInteger(candidate) || (candidate as number) < min || (candidate as number) > max) {
      throw new Error(`${key} must be an integer between ${min} and ${max}`);
    }
    return candidate as number;
  };
  const boolean = (key: string): boolean => {
    if (typeof value[key] !== "boolean") throw new Error(`${key} must be boolean`);
    return value[key] as boolean;
  };
  const skuPrefix = normalizeSku(String(value.skuPrefix ?? ""));
  const orderPrefix = normalizeSku(String(value.orderPrefix ?? ""));
  if (!skuPrefix) throw new Error("skuPrefix is required");
  if (!orderPrefix) throw new Error("orderPrefix is required");
  if (value.currency !== "INR") throw new Error("currency must be INR");
  const manualPaymentQrUrl = String(value.manualPaymentQrUrl ?? "").trim();
  if (manualPaymentQrUrl) {
    try {
      const parsed = new URL(manualPaymentQrUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Unsupported protocol");
    } catch {
      throw new Error("manualPaymentQrUrl must be a valid HTTP(S) URL");
    }
  }
  const manualPaymentPayeeName = String(value.manualPaymentPayeeName ?? "").trim();
  const manualPaymentInstructions = String(value.manualPaymentInstructions ?? "").trim();
  if (manualPaymentPayeeName.length > 160) throw new Error("manualPaymentPayeeName is too long");
  if (manualPaymentInstructions.length > 1000) throw new Error("manualPaymentInstructions is too long");
  return {
    currency: "INR",
    deliveryFeePaise: integer("deliveryFeePaise", 0, 10_000_000),
    prepaidEnabled: boolean("prepaidEnabled"),
    reservationTtlMinutes: integer("reservationTtlMinutes", 1, 1_440),
    manualPaymentVerificationTtlMinutes: value.manualPaymentVerificationTtlMinutes === undefined
      ? integer("reservationTtlMinutes", 1, 1_440)
      : integer("manualPaymentVerificationTtlMinutes", 1, 10_080),
    manualPaymentQrUrl,
    manualPaymentPayeeName,
    manualPaymentInstructions,
    skuPrefix,
    skuPadding: integer("skuPadding", 1, 12),
    orderPrefix,
    orderPadding: integer("orderPadding", 1, 12),
    bestSellerWindowDays: integer("bestSellerWindowDays", 1, 365),
    bestSellerLimit: integer("bestSellerLimit", 1, 100),
  };
};

export const allowedFulfilmentTransition = (from: string, to: string): boolean => {
  const transitions: Record<string, string[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["packed", "cancelled"],
    packed: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: [],
  };
  return Boolean(transitions[from]?.includes(to));
};

export const calculateSellerPayout = (
  type: "fixed" | "percentage",
  value: number,
  salePricePaise: number,
): number => {
  if (type === "fixed") return Math.max(0, Math.round(value));
  if (value < 0 || value > 100) throw new Error("Seller payout percentage must be between 0 and 100");
  return Math.round((salePricePaise * value) / 100);
};
