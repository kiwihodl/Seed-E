import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if username already exists (both providers and clients)
    const existingProvider = await prisma.provider.findUnique({
      where: { username },
    });

    const existingClient = await prisma.client.findUnique({
      where: { username },
    });

    if (existingProvider || existingClient) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create client
    const client = await prisma.client.create({
      data: {
        username,
        passwordHash: hashedPassword,
        twoFactorSecret: null, // Will be set during 2FA setup
        recoveryKey: null, // Will be generated during setup
      },
    });

    return NextResponse.json(
      {
        message: "Client registered successfully",
        clientId: client.id,
        username: client.username,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Client registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
