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

export async function POST(request: NextRequest) {
  try {
    const { xpub, providerId } = await request.json();

    if (!xpub || !providerId) {
      return NextResponse.json(
        { error: "Xpub and providerId are required" },
        { status: 400 }
      );
    }

    console.log("🔍 Validating xpub format and checking duplicates");

    // Basic xpub format validation - more flexible for different network types
    const validPrefixes = ["xpub", "Xpub", "ypub", "Ypub", "zpub", "Zpub"];
    const hasValidPrefix = validPrefixes.some((prefix) =>
      xpub.trim().startsWith(prefix)
    );

    if (!hasValidPrefix) {
      return NextResponse.json(
        {
          isValid: false,
          error:
            "Invalid xpub format. Must start with xpub, Xpub, ypub, Ypub, zpub, or Zpub",
        },
        { status: 400 }
      );
    }

    // Basic length check (xpub should be around 111 characters, but can vary)
    if (xpub.trim().length < 100 || xpub.trim().length > 120) {
      return NextResponse.json(
        {
          isValid: false,
          error: "Invalid xpub length",
        },
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

    if (existingService) {
      return NextResponse.json(
        {
          isValid: false,
          error: "This xpub has already been added for this provider",
        },
        { status: 400 }
      );
    }

    console.log("✅ Xpub validation successful");
    return NextResponse.json({
      isValid: true,
      message: "Xpub is valid and not a duplicate",
    });
  } catch (error) {
    console.error("❌ Error validating xpub:", error);
    return NextResponse.json(
      { error: "Failed to validate xpub" },
      { status: 500 }
    );
  }
}
