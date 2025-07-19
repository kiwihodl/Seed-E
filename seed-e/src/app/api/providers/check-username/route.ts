import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json(
        { error: "Provider name is required" },
        { status: 400 }
      );
    }

    // Check if provider name already exists
    const existingProvider = await prisma.provider.findFirst({
      where: {
        username: name.trim(),
      },
    });

    return NextResponse.json({
      available: !existingProvider,
    });
  } catch (error) {
    console.error("Username check error:", error);
    return NextResponse.json(
      { error: "Failed to check username availability" },
      { status: 500 }
    );
  }
}
