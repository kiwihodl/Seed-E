import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { mergeEffectiveMaterials, mergeEffectiveShipping } from "@/lib/pricing";

export const runtime = "nodejs";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            username: true,
            keybaseHandle: true,
            shippingPolicyDefault: true,
            materialsCatalog: true,
          },
        },
      },
    });
    if (!service)
      return NextResponse.json({ error: "Service not found" }, { status: 404 });

    const effectiveShipping = mergeEffectiveShipping(
      service.provider.shippingPolicyDefault,
      service.shippingOverrides
    );
    const effectiveMaterials = mergeEffectiveMaterials(
      service.provider.materialsCatalog,
      service.materialsOverrides
    );

    const payload = {
      serviceId: service.id,
      providerName: service.provider.username,
      serviceType: service.serviceType,
      fees: {
        setupFee: Number(service.initialBackupFee),
        signingFee: Number(service.perSignatureFee),
        annualFee: service.annualFee ? Number(service.annualFee) : undefined,
      },
      materials: effectiveMaterials,
      shippingPolicy: effectiveShipping,
      createdAt: service.createdAt.toISOString(),
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error("Service details error", err);
    return NextResponse.json(
      { error: "Failed to fetch service details" },
      { status: 500 }
    );
  }
}
