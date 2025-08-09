import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { encryptionService } from "@/lib/encryption";

export const runtime = "nodejs";

const prisma = new PrismaClient();

type ShipmentInput = {
  recipientAlias: string;
  regionCode: string;
  trackingCarrier?: string;
  trackingNumber: string;
  shippedAt?: string;
};

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params.orderId;
    const body = (await req.json()) as {
      providerId: string;
      shipments: ShipmentInput[];
    };
    const { providerId, shipments } = body || {};
    if (!providerId || !Array.isArray(shipments) || shipments.length === 0) {
      return NextResponse.json(
        { error: "providerId and shipments are required" },
        { status: 400 }
      );
    }

    const purchase = await prisma.servicePurchase.findUnique({
      where: { id: orderId },
      include: { service: { select: { providerId: true } } },
    });
    if (!purchase) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (purchase.service.providerId !== providerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const existing: any[] = Array.isArray(purchase.shipments)
      ? (purchase.shipments as any)
      : [];

    const merged: any[] = [...existing];

    for (const s of shipments) {
      if (!s.recipientAlias || !s.regionCode || !s.trackingNumber) continue;
      const ctx = `shipment:${purchase.id}:${s.recipientAlias}:${s.regionCode}`;
      const encrypted = encryptionService.encrypt(s.trackingNumber, ctx);
      const entry = {
        recipientAlias: s.recipientAlias,
        regionCode: s.regionCode,
        trackingCarrier: s.trackingCarrier || null,
        trackingNumberEncrypted: encrypted,
        shippedAt: s.shippedAt || new Date().toISOString(),
      };

      // Replace any existing entry for the same alias+region
      const idx = merged.findIndex(
        (m) =>
          m.recipientAlias === s.recipientAlias && m.regionCode === s.regionCode
      );
      if (idx >= 0) merged[idx] = entry;
      else merged.push(entry);
    }

    await prisma.servicePurchase.update({
      where: { id: purchase.id },
      data: { shipments: merged },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Shipments update error", err);
    return NextResponse.json(
      { error: "Failed to update shipments" },
      { status: 500 }
    );
  }
}
