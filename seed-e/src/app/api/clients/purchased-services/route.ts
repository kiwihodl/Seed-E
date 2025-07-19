import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    // Get all purchased services for this client (including inactive/pending ones)
    const purchases = await prisma.servicePurchase.findMany({
      where: {
        clientId: clientId,
        // Removed isActive: true filter to show all purchases
      },
      include: {
        service: {
          include: {
            provider: {
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

    // Transform data for client view
    const transformedPurchases = purchases.map((purchase) => ({
      id: purchase.id,
      serviceId: purchase.service.id,
      providerName: purchase.service.provider.username,
      policyType: purchase.service.policyType,
      xpubHash: purchase.service.xpubHash,
      initialBackupFee: Number(purchase.service.initialBackupFee),
      perSignatureFee: Number(purchase.service.perSignatureFee),
      monthlyFee: purchase.service.monthlyFee
        ? Number(purchase.service.monthlyFee)
        : undefined,
      minTimeDelay: purchase.service.minTimeDelay,
      purchasedAt: purchase.createdAt.toISOString(),
      expiresAt: purchase.expiresAt?.toISOString(),
      isActive: purchase.isActive,
      paymentHash: purchase.paymentHash,
    }));

    return NextResponse.json({
      purchasedServices: transformedPurchases,
    });
  } catch (error) {
    console.error("Error fetching client purchased services:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchased services" },
      { status: 500 }
    );
  }
}
