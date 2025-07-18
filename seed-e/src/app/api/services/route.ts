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

    const services = await prisma.service.findMany({
      where,
      include: {
        provider: {
          select: {
            name: true,
            createdAt: true,
          },
        },
      },
    });

    // Randomize the order of services to ensure neutrality
    const shuffledServices = shuffle(services);

    return NextResponse.json(shuffledServices);
  } catch (error) {
    console.error("Failed to fetch services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
