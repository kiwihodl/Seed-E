import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { providerName, password } = await request.json();

    // Validate required fields
    if (!providerName || !password) {
      return NextResponse.json(
        { error: "Provider name and password are required" },
        { status: 400 }
      );
    }

    // Check if provider name already exists
    const existingProvider = await prisma.provider.findFirst({
      where: {
        username: providerName.trim(),
      },
    });

    if (existingProvider) {
      return NextResponse.json(
        {
          error:
            "Provider name already exists. Please choose a different name or login with your existing account.",
        },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the provider
    const provider = await prisma.provider.create({
      data: {
        username: providerName.trim(),
        passwordHash: hashedPassword,
      },
    });

    return NextResponse.json(
      {
        message: "Provider registered successfully",
        providerId: provider.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Provider registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
