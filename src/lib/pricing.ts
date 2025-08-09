/*
  Pricing and configuration helpers for marketplace Phase A
*/

export type SkuItem = {
  sku: string;
  name?: string;
  description?: string;
  priceSats?: number;
  priceUsd?: number;
  shipUnits?: number; // lightweight measure for tiering
  shipFeeSatsPerOrder?: number;
  shipFeeSatsPerRecipient?: number;
};

export type MaterialsCatalog = {
  sleeves?: SkuItem[];
  blankPlates?: SkuItem[];
  seedPickerCards?: SkuItem[];
  entropiaPills?: SkuItem[];
};

export type PackagingTiers = {
  tiers: { maxUnits: number; multiplier: number }[];
  defaultMultiplier: number;
};

export type ProgressiveSkuRule = {
  skuFamily: "sleeves" | "blankPlates";
  stepQty: number;
  multiplierPerStep: number; // e.g., 1.5
};

export type ShippingPolicy =
  | {
      mode: "FLAT";
      flatFeeSats: number;
      shipsTo: { regionCode: string; regionName: string }[];
      packagingTiers?: PackagingTiers;
      packagingTiersPerOrder?: PackagingTiers;
      progressiveSkuMultipliers?: ProgressiveSkuRule[];
      leadTimeBusinessDays?: number;
      blackoutDates?: string[];
    }
  | {
      mode: "REGION_BASED";
      regions: {
        regionCode: string;
        regionName: string;
        baseFeeSats: number;
        perRecipientMultiplier?: number;
      }[];
      packagingTiers?: PackagingTiers;
      packagingTiersPerOrder?: PackagingTiers;
      progressiveSkuMultipliers?: ProgressiveSkuRule[];
      leadTimeBusinessDays?: number;
      blackoutDates?: string[];
    };

export type QuoteRequest = {
  serviceType: "ONE_TIME" | "MANAGED";
  years?: number; // managed only
  sleeves?: { sku: string; quantity: number }[];
  blankPlates?: { sku: string; quantity: number }[];
  seedPickerCards?: { sku: string; quantity: number }[];
  entropiaPills?: { sku: string; quantity: number }[];
  recipients: {
    alias: string;
    regionCode: string;
    items?: { sku: string; quantity: number }[];
  }[];
};

export type QuoteBreakdown = {
  setupFee: number;
  materialsFee: number;
  shippingFee: number;
  managedYearsFee?: number;
  total: number;
};

export function toNumber(bigOrNum: number | bigint | null | undefined): number {
  if (bigOrNum == null) return 0;
  if (typeof bigOrNum === "bigint") return Number(bigOrNum);
  return bigOrNum;
}

function getSatsPerUsd(): number {
  const env = process.env.SATS_PER_USD;
  const n = env ? Number(env) : NaN;
  if (!isNaN(n) && n > 0) return n;
  return 5000; // fallback
}

function priceToSats(item: SkuItem): number {
  if (typeof item.priceSats === "number") return item.priceSats;
  if (typeof item.priceUsd === "number")
    return Math.round(item.priceUsd * getSatsPerUsd());
  return 0;
}

export function findSku(
  catalog: MaterialsCatalog,
  sku: string
): { family: keyof MaterialsCatalog; item: SkuItem } | null {
  for (const family of [
    "sleeves",
    "blankPlates",
    "seedPickerCards",
    "entropiaPills",
  ] as const) {
    const list = catalog[family] || [];
    const item = list.find((i) => i.sku === sku);
    if (item) return { family, item };
  }
  return null;
}

export function computeProgressiveMultiplier(
  rules: ProgressiveSkuRule[] | undefined,
  family: "sleeves" | "blankPlates",
  qty: number
): number {
  if (!rules || qty <= 0) return 1;
  const rule = rules.find((r) => r.skuFamily === family);
  if (!rule || rule.stepQty <= 0) return 1;
  const steps = Math.floor(qty / rule.stepQty);
  if (steps <= 0) return 1;
  return Math.pow(rule.multiplierPerStep, steps);
}

export function computePackagingTierMultiplier(
  packaging: PackagingTiers | undefined,
  units: number
): number {
  if (!packaging) return 1;
  for (const t of packaging.tiers) {
    if (units <= t.maxUnits) return t.multiplier;
  }
  return packaging.defaultMultiplier ?? 1;
}

export function mergeEffectiveShipping(
  providerPolicy: any,
  serviceOverrides: any | null
): ShippingPolicy {
  // Shallow merge is sufficient for Phase A
  const base = (providerPolicy || {}) as ShippingPolicy;
  if (!serviceOverrides) return base;
  return { ...(base as any), ...(serviceOverrides as any) } as ShippingPolicy;
}

export function mergeEffectiveMaterials(
  providerCatalog: any,
  serviceOverrides: any | null
): MaterialsCatalog {
  const base = (providerCatalog || {}) as MaterialsCatalog;
  if (!serviceOverrides) return base;
  return { ...(base as any), ...(serviceOverrides as any) } as MaterialsCatalog;
}

export function computeQuote(
  request: QuoteRequest,
  materials: MaterialsCatalog,
  shipping: ShippingPolicy,
  fees: { setupFee: number; annualFee?: number },
  options?: { nowMs?: number }
): QuoteBreakdown {
  const recipients = request.recipients || [];
  const recipientsCount = recipients.length;

  // Prepare per-recipient item mapping
  const globalSleeves = request.sleeves || [];
  const globalPlates = request.blankPlates || [];
  const globalCards = (request as any).seedPickerCards || [];
  const globalPills = (request as any).entropiaPills || [];

  const perRecipient: {
    sleeves: { sku: string; quantity: number }[];
    blankPlates: { sku: string; quantity: number }[];
    seedPickerCards: { sku: string; quantity: number }[];
    entropiaPills: { sku: string; quantity: number }[];
    regionCode: string;
  }[] = recipients.map((r) => ({
    sleeves: [],
    blankPlates: [],
    seedPickerCards: [],
    entropiaPills: [],
    regionCode: r.regionCode,
  }));

  if (recipientsCount > 0) {
    // Distribute globals evenly if items not specified
    function distribute(
      globalList: { sku: string; quantity: number }[],
      family: "sleeves" | "blankPlates" | "seedPickerCards" | "entropiaPills"
    ) {
      for (const { sku, quantity } of globalList) {
        let remaining = quantity;
        let idx = 0;
        while (remaining > 0) {
          const take = 1;
          (perRecipient[idx][family] as any).push({ sku, quantity: take });
          remaining -= take;
          idx = (idx + 1) % recipientsCount;
        }
      }
    }

    distribute(globalSleeves, "sleeves");
    distribute(globalPlates, "blankPlates");
    distribute(globalCards, "seedPickerCards");
    distribute(globalPills, "entropiaPills");

    // Apply overrides if provided
    recipients.forEach((r, i) => {
      if (r.items && Array.isArray(r.items)) {
        // Reset and rebuild families from items list
        perRecipient[i].sleeves = [];
        perRecipient[i].blankPlates = [];
        for (const it of r.items) {
          const match = findSku(materials, it.sku);
          if (!match) continue;
          (perRecipient[i][match.family] as any).push({
            sku: it.sku,
            quantity: it.quantity,
          });
        }
      }
    });
  }

  // Materials fee
  let materialsFee = 0;
  function addMaterials(list: { sku: string; quantity: number }[]) {
    for (const { sku, quantity } of list) {
      const found = findSku(materials, sku);
      if (!found) continue;
      materialsFee += priceToSats(found.item) * quantity;
    }
  }
  addMaterials(globalSleeves);
  addMaterials(globalPlates);
  addMaterials(globalCards);
  addMaterials(globalPills);

  // Shipping fee
  let shippingSubtotal = 0;
  let totalUnitsOrder = 0;
  const progressive = (shipping as any).progressiveSkuMultipliers as
    | ProgressiveSkuRule[]
    | undefined;
  const perRecipientPackaging = (shipping as any).packagingTiers as
    | PackagingTiers
    | undefined;
  const perOrderPackaging = (shipping as any).packagingTiersPerOrder as
    | PackagingTiers
    | undefined;

  for (let i = 0; i < perRecipient.length; i++) {
    const r = perRecipient[i];
    // Base fee by policy
    let base = 0;
    if (shipping.mode === "FLAT") {
      base = (shipping as any).flatFeeSats || 0;
    } else {
      const region = shipping.regions.find(
        (x) => x.regionCode === r.regionCode
      );
      if (!region) throw new Error(`Unsupported region ${r.regionCode}`);
      base = region.baseFeeSats * (region.perRecipientMultiplier || 1);
    }

    // Progressive multipliers per family
    const sleevesQty = r.sleeves.reduce((acc, x) => acc + x.quantity, 0);
    const platesQty = r.blankPlates.reduce((acc, x) => acc + x.quantity, 0);
    const sleevesMult = computeProgressiveMultiplier(
      progressive,
      "sleeves",
      sleevesQty
    );
    const platesMult = computeProgressiveMultiplier(
      progressive,
      "blankPlates",
      platesQty
    );
    const progressiveMult = sleevesMult * platesMult;

    // Packaging tier multiplier per recipient
    let units = 0;
    for (const it of [
      ...r.sleeves,
      ...r.blankPlates,
      ...r.seedPickerCards,
      ...r.entropiaPills,
    ]) {
      const match = findSku(materials, it.sku);
      if (!match) continue;
      units += (match.item.shipUnits || 0) * it.quantity;
    }
    totalUnitsOrder += units;
    const packagingMult = computePackagingTierMultiplier(
      perRecipientPackaging,
      units
    );

    const recipientShipping = base * progressiveMult * packagingMult;
    shippingSubtotal += recipientShipping;
  }

  // Per-order packaging multiplier
  const orderMult = computePackagingTierMultiplier(
    perOrderPackaging,
    totalUnitsOrder
  );
  const shippingFee = Math.round(shippingSubtotal * orderMult);

  const setupFee = fees.setupFee || 0;
  const managedYearsFee =
    request.serviceType === "MANAGED" && fees.annualFee && request.years
      ? toNumber(fees.annualFee) * Math.min(Math.max(request.years, 1), 10)
      : undefined;

  const total = setupFee + materialsFee + shippingFee + (managedYearsFee || 0);

  return { setupFee, materialsFee, shippingFee, managedYearsFee, total };
}
