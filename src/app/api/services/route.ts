import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

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
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform data for client view
    const transformedServices = services.map(
      (service: {
        id: string;
        provider: { username: string };
        policyType: string;
        xpubHash: string;
        initialBackupFee: bigint;
        perSignatureFee: bigint;
        monthlyFee: bigint | null;
        minTimeDelay: number;
        createdAt: Date;
        isPurchased: boolean;
      }) => ({
        id: service.id,
        providerName: service.provider.username,
        policyType: service.policyType,
        xpubHash: service.xpubHash, // Only send hash, not actual xpub
        initialBackupFee: Number(service.initialBackupFee),
        perSignatureFee: Number(service.perSignatureFee),
        monthlyFee: service.monthlyFee ? Number(service.monthlyFee) : undefined,
        minTimeDelay: service.minTimeDelay,
        createdAt: service.createdAt.toISOString(),
        isPurchased: service.isPurchased,
      })
    );

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
