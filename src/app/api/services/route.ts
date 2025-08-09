import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { mergeEffectiveMaterials, mergeEffectiveShipping } from "@/lib/pricing";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get only available (non-purchased) services with provider information
    const services = await prisma.service.findMany({
      where: {
        isPurchased: false, // Only show services that haven't been purchased
        isActive: true, // Only show active services
      },
      include: {
        provider: {
          select: {
            username: true,
            shippingPolicyDefault: true,
            materialsCatalog: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data for client view with marketplace summaries
    const transformedServices = services.map((service: any) => {
      const effectiveShipping = mergeEffectiveShipping(
        service.provider.shippingPolicyDefault,
        service.shippingOverrides
      );
      const effectiveMaterials = mergeEffectiveMaterials(
        service.provider.materialsCatalog,
        service.materialsOverrides
      );
      const hasMaterials = Boolean(
        (effectiveMaterials.sleeves && effectiveMaterials.sleeves.length > 0) ||
          (effectiveMaterials.blankPlates &&
            effectiveMaterials.blankPlates.length > 0)
      );
      let shippingPolicySummary: any = { mode: effectiveShipping.mode };
      if (effectiveShipping.mode === "FLAT") {
        shippingPolicySummary = {
          mode: "FLAT",
          shipsTo: (effectiveShipping as any).shipsTo?.map((r: any) => ({
            regionCode: r.regionCode,
            regionName: r.regionName,
          })),
        };
      } else {
        shippingPolicySummary = {
          mode: "REGION_BASED",
          regions: effectiveShipping.regions.map((r) => ({
            regionCode: r.regionCode,
            regionName: r.regionName,
          })),
        };
      }
      const leadTimeBusinessDays = (effectiveShipping as any)
        .leadTimeBusinessDays;

      return {
        id: service.id,
        providerName: service.provider.username,
        serviceType: service.serviceType,
        policyType: service.policyType,
        xpubHash: service.xpubHash,
        initialBackupFee: Number(service.initialBackupFee),
        perSignatureFee: Number(service.perSignatureFee),
        monthlyFee: service.monthlyFee ? Number(service.monthlyFee) : undefined,
        minTimeDelay: service.minTimeDelay,
        createdAt: service.createdAt.toISOString(),
        isPurchased: service.isPurchased,
        hasMaterials,
        shippingPolicySummary,
        leadTimeBusinessDays,
      };
    });

    return NextResponse.json({
      services: transformedServices,
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
