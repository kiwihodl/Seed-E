import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId");

    if (!providerId) {
      return NextResponse.json(
        { error: "Provider ID is required" },
        { status: 400 }
      );
    }

    // Get all services for this provider (including purchased ones)
    const services = await prisma.service.findMany({
      where: {
        providerId: providerId,
        isActive: true,
      },
      include: {
        provider: {
          select: {
            username: true,
          },
        },
        servicePurchases: {
          include: {
            client: {
              select: {
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data for provider view
    const transformedServices = services.map((service) => ({
      id: service.id,
      providerName: service.provider.username,
      policyType: service.policyType,
      xpubHash: service.xpubHash,
      initialBackupFee: Number(service.initialBackupFee),
      perSignatureFee: Number(service.perSignatureFee),
      monthlyFee: service.monthlyFee ? Number(service.monthlyFee) : undefined,
      minTimeDelay: service.minTimeDelay,
      createdAt: service.createdAt.toISOString(),
      isPurchased: service.isPurchased,
      purchases: service.servicePurchases.map((purchase) => ({
        id: purchase.id,
        clientUsername: purchase.client.username,
        purchasedAt: purchase.createdAt.toISOString(),
        expiresAt: purchase.expiresAt?.toISOString(),
        isActive: purchase.isActive,
      })),
    }));

    return NextResponse.json({
      services: transformedServices,
    });
  } catch (error) {
    console.error("Error fetching provider services:", error);
    return NextResponse.json(
      { error: "Failed to fetch provider services" },
      { status: 500 }
    );
  }
}
