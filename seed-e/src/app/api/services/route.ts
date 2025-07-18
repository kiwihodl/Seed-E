import { NextResponse, NextRequest } from "next/server";
import { PrismaClient, KeyPolicyType } from "@prisma/client";

const prisma = new PrismaClient();

// Function to shuffle an array (Fisher-Yates shuffle)
function shuffle(array: any[]) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const policyType = searchParams.get("policyType") as KeyPolicyType | null;
    const maxInitialBackupFee = searchParams.get("maxInitialBackupFee");
    const maxPerSignatureFee = searchParams.get("maxPerSignatureFee");
    const maxMonthlyFee = searchParams.get("maxMonthlyFee");
    const sortBy = searchParams.get("sortBy");

    const where: any = {
      isActive: true,
    };

    if (policyType && Object.values(KeyPolicyType).includes(policyType)) {
      where.policyType = policyType;
    }

    if (maxInitialBackupFee) {
      where.initialBackupFee = {
        lte: BigInt(maxInitialBackupFee),
      };
    }

    if (maxPerSignatureFee) {
      where.perSignatureFee = {
        lte: BigInt(maxPerSignatureFee),
      };
    }

    if (maxMonthlyFee) {
      where.monthlyFee = {
        lte: BigInt(maxMonthlyFee),
      };
    }

    const orderBy: any = {};
    if (sortBy === "penalties_asc") {
      orderBy.provider = { penaltyCount: "asc" };
    } else if (sortBy === "delay_desc") {
      orderBy.minTimeDelay = "desc";
    }

    const services = await prisma.service.findMany({
      where,
      orderBy,
      include: {
        provider: {
          select: {
            name: true,
            createdAt: true,
          },
        },
      },
    });

    // Randomize the order of services ONLY if no specific sort order is applied
    const finalServices = !sortBy ? shuffle(services) : services;

    return NextResponse.json(finalServices);
  } catch (error) {
    console.error("Failed to fetch services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
