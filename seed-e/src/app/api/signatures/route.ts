import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import * as speakeasy from "speakeasy";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Validate request method
    if (request.method !== "POST") {
      return NextResponse.json(
        { error: "Method not allowed" },
        { status: 405 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { username, password, twoFactorToken, unsignedPsbt } = body;

    // Validate required fields
    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required and must be a string" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required and must be a string" },
        { status: 400 }
      );
    }

    if (!twoFactorToken || typeof twoFactorToken !== "string") {
      return NextResponse.json(
        { error: "2FA token is required and must be a string" },
        { status: 400 }
      );
    }

    if (!unsignedPsbt || typeof unsignedPsbt !== "string") {
      return NextResponse.json(
        { error: "Unsigned PSBT is required and must be a string" },
        { status: 400 }
      );
    }

    // Validate PSBT format (basic check for base64)
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(unsignedPsbt)) {
      return NextResponse.json(
        { error: "Invalid PSBT format. Must be base64 encoded" },
        { status: 400 }
      );
    }

    // Find the client with service and provider info
    const client = await prisma.client.findUnique({
      where: { username },
      include: {
        service: {
          include: {
            provider: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Verify 2FA
    if (!client.twoFactorSecret) {
      return NextResponse.json(
        { error: "2FA not set up for this client" },
        { status: 400 }
      );
    }

    const verified = speakeasy.totp.verify({
      secret: client.twoFactorSecret,
      encoding: "base32",
      token: twoFactorToken,
      window: 2, // Allow 2 time steps for clock skew
    });

    if (!verified) {
      return NextResponse.json({ error: "Invalid 2FA token" }, { status: 401 });
    }

    // Check subscription status
    if (
      client.subscriptionExpiresAt &&
      client.subscriptionExpiresAt < new Date()
    ) {
      return NextResponse.json(
        { error: "Subscription has expired. Please renew your subscription." },
        { status: 402 }
      );
    }

    // Calculate unlock time based on service's minimum time delay
    const unlocksAt = new Date();
    unlocksAt.setHours(unlocksAt.getHours() + client.service.minTimeDelay);

    // Create signature request
    const signatureRequest = await prisma.signatureRequest.create({
      data: {
        clientId: client.id,
        unsignedPsbt,
        unlocksAt,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      id: signatureRequest.id,
      unlocksAt: signatureRequest.unlocksAt,
      message: "Signature request created successfully",
      minTimeDelay: client.service.minTimeDelay,
    });
  } catch (error) {
    console.error("Failed to create signature request:", error);

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { error: "Duplicate signature request" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
