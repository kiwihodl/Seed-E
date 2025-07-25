import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json(
        { error: "Name parameter is required" },
        { status: 400 }
      );
    }

    // Test database connection first
    await prisma.$connect();

    const existingProvider = await prisma.provider.findUnique({
      where: { username: name },
    });

    return NextResponse.json({
      available: !existingProvider,
    });
  } catch (error) {
    console.error("Error checking provider username:", error);

    // Check if it's a database connection error
    if (error instanceof Error) {
      if (
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("ENOTFOUND")
      ) {
        return NextResponse.json(
          { error: "Database connection failed. Please try again later." },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to check username availability" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
