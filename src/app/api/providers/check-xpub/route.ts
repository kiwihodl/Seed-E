import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hashXpub } from "@/lib/xpub-hash";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const xpub = searchParams.get("xpub");
    const providerId = searchParams.get("providerId");

    if (!xpub || !providerId) {
      return NextResponse.json(
        { error: "Xpub and providerId are required" },
        { status: 400 }
      );
    }

    // Hash the xpub to check against stored hashes
    const xpubHash = hashXpub(xpub.trim());

    // Check if this xpub hash already exists for this provider
    const existingService = await prisma.service.findFirst({
      where: {
        xpubHash: xpubHash,
        providerId: providerId,
        isActive: true,
      },
    });

    return NextResponse.json({
      isDuplicate: !!existingService,
      existingServiceId: existingService?.id || null,
    });
  } catch (error) {
    console.error("Error checking xpub duplicate:", error);
    return NextResponse.json(
      { error: "Failed to check xpub duplicate" },
      { status: 500 }
    );
  }
}
