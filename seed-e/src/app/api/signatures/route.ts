import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import * as speakeasy from "speakeasy";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, twoFactorToken, unsignedPsbt } = body;

    if (!username || !password || !twoFactorToken || !unsignedPsbt) {
      return NextResponse.json(
        {
          error:
            "Username, password, 2FA token, and unsigned PSBT are required",
        },
        { status: 400 }
      );
    }

    // Find the client
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
    });

    if (!verified) {
      return NextResponse.json({ error: "Invalid 2FA token" }, { status: 401 });
    }

    // Check if subscription is active
    if (
      client.subscriptionExpiresAt &&
      client.subscriptionExpiresAt < new Date()
    ) {
      return NextResponse.json(
        { error: "Subscription has expired" },
        { status: 402 }
      );
    }

    // Calculate unlock time based on provider's minimum time delay
    const unlocksAt = new Date();
    unlocksAt.setHours(unlocksAt.getHours() + client.service.minTimeDelay);

    // Create the signature request
    const signatureRequest = await prisma.signatureRequest.create({
      data: {
        clientId: client.id,
        unsignedPsbt,
        unlocksAt,
      },
    });

    return NextResponse.json({
      id: signatureRequest.id,
      unlocksAt: signatureRequest.unlocksAt,
      message: "Signature request created successfully",
    });
  } catch (error) {
    console.error("Failed to create signature request:", error);
    return NextResponse.json(
      { error: "Failed to create signature request" },
      { status: 500 }
    );
  }
}
