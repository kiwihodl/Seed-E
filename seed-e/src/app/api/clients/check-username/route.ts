import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Check if username already exists (both providers and clients)
    const existingProvider = await prisma.provider.findUnique({
      where: { username: name.trim() },
    });

    const existingClient = await prisma.client.findUnique({
      where: { username: name.trim() },
    });

    return NextResponse.json({
      available: !existingProvider && !existingClient,
    });
  } catch (error) {
    console.error("Username check error:", error);
    return NextResponse.json(
      { error: "Failed to check username availability" },
      { status: 500 }
    );
  }
}
