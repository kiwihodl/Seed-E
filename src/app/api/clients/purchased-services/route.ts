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

    // Get only ACTIVE purchased services for this client (where payment has been confirmed)
    const purchases = await prisma.servicePurchase.findMany({
      where: {
        clientId: clientId,
        isActive: true, // Only show active purchases where payment was confirmed
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
      // masterFingerprint and derivationPath REMOVED to fix build error
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
      xpubKey: purchase.service.encryptedXpub, // Use the actual xpub key instead of hash
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
