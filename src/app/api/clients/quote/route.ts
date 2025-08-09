import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  computeQuote,
  mergeEffectiveMaterials,
  mergeEffectiveShipping,
  QuoteRequest,
} from "@/lib/pricing";

export const runtime = "nodejs";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as QuoteRequest & { serviceId: string };
    const { serviceId } = body;
    if (!serviceId)
      return NextResponse.json(
        { error: "serviceId is required" },
        { status: 400 }
      );

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        provider: {
          select: { shippingPolicyDefault: true, materialsCatalog: true },
        },
      },
    });
    if (!service)
      return NextResponse.json({ error: "Service not found" }, { status: 404 });

    const shipping = mergeEffectiveShipping(
      service.provider.shippingPolicyDefault,
      service.shippingOverrides
    );
    const materials = mergeEffectiveMaterials(
      service.provider.materialsCatalog,
      service.materialsOverrides
    );

    // Validate shipsTo if FLAT; REGION_BASED uses explicit region list
    if (shipping.mode === "FLAT") {
      const shipsTo = (shipping as any).shipsTo || [];
      const allowed = new Set(shipsTo.map((r: any) => r.regionCode));
      for (const r of body.recipients || []) {
        if (!allowed.has(r.regionCode)) {
          return NextResponse.json(
            { error: `Unsupported region ${r.regionCode}` },
            { status: 400 }
          );
        }
      }
    } else {
      const allowed = new Set(shipping.regions.map((r) => r.regionCode));
      for (const r of body.recipients || []) {
        if (!allowed.has(r.regionCode)) {
          return NextResponse.json(
            { error: `Unsupported region ${r.regionCode}` },
            { status: 400 }
          );
        }
      }
    }

    if ((body.recipients || []).length > 21) {
      return NextResponse.json({ error: "Max 21 recipients" }, { status: 400 });
    }

    const breakdown = computeQuote(body, materials, shipping, {
      setupFee: Number(service.initialBackupFee),
      annualFee: service.annualFee ? Number(service.annualFee) : undefined,
    });

    // Minimal quote shape without persistence for Phase A
    return NextResponse.json({
      quoteId: null,
      pricingBreakdown: breakdown,
      expiresAt: null,
    });
  } catch (err) {
    console.error("Quote error", err);
    return NextResponse.json(
      { error: "Failed to compute quote" },
      { status: 500 }
    );
  }
}
