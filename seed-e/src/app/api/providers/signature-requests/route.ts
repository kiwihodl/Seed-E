import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import * as speakeasy from "speakeasy";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    const password = searchParams.get("password");
    const twoFactorToken = searchParams.get("twoFactorToken");

    if (!username || !password || !twoFactorToken) {
      return NextResponse.json(
        { error: "Username, password, and 2FA token are required" },
        { status: 400 }
      );
    }

    // Find the provider
    const provider = await prisma.provider.findUnique({
      where: { username },
      include: {
        services: {
          include: {
            clients: {
              include: {
                signatureRequests: {
                  where: {
                    status: "PENDING",
                  },
                  orderBy: {
                    createdAt: "asc",
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    // Verify 2FA
    if (!provider.twoFactorSecret) {
      return NextResponse.json(
        { error: "2FA not set up for this provider" },
        { status: 400 }
      );
    }

    const verified = speakeasy.totp.verify({
      secret: provider.twoFactorSecret,
      encoding: "base32",
      token: twoFactorToken,
    });

    if (!verified) {
      return NextResponse.json({ error: "Invalid 2FA token" }, { status: 401 });
    }

    // Collect all pending signature requests
    const pendingRequests: Array<{
      id: string;
      createdAt: string;
      unsignedPsbt: string;
      unlocksAt: string;
      clientUsername: string;
      servicePolicyType: string;
      perSignatureFee: string;
    }> = [];

    for (const service of provider.services) {
      for (const client of service.clients) {
        for (const request of client.signatureRequests) {
          pendingRequests.push({
            id: request.id,
            createdAt: request.createdAt.toISOString(),
            unsignedPsbt: request.unsignedPsbt,
            unlocksAt: request.unlocksAt.toISOString(),
            clientUsername: client.username,
            servicePolicyType: service.policyType,
            perSignatureFee: service.perSignatureFee.toString(),
          });
        }
      }
    }

    return NextResponse.json({
      pendingRequests,
      totalCount: pendingRequests.length,
    });
  } catch (error) {
    console.error("Failed to fetch signature requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch signature requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      username,
      password,
      twoFactorToken,
      signatureRequestId,
      signedPsbt,
    } = body;

    if (
      !username ||
      !password ||
      !twoFactorToken ||
      !signatureRequestId ||
      !signedPsbt
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Find the provider
    const provider = await prisma.provider.findUnique({
      where: { username },
    });

    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    // Verify 2FA
    if (!provider.twoFactorSecret) {
      return NextResponse.json(
        { error: "2FA not set up for this provider" },
        { status: 400 }
      );
    }

    const verified = speakeasy.totp.verify({
      secret: provider.twoFactorSecret,
      encoding: "base32",
      token: twoFactorToken,
    });

    if (!verified) {
      return NextResponse.json({ error: "Invalid 2FA token" }, { status: 401 });
    }

    // Find the signature request
    const signatureRequest = await prisma.signatureRequest.findUnique({
      where: { id: signatureRequestId },
      include: {
        client: {
          include: {
            service: {
              include: {
                provider: true,
              },
            },
          },
        },
      },
    });

    if (!signatureRequest) {
      return NextResponse.json(
        { error: "Signature request not found" },
        { status: 404 }
      );
    }

    // Verify the provider owns this service
    if (signatureRequest.client.service.providerId !== provider.id) {
      return NextResponse.json(
        { error: "Unauthorized to sign this request" },
        { status: 403 }
      );
    }

    // Check if the request is still pending
    if (signatureRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Signature request is not pending" },
        { status: 400 }
      );
    }

    // Check if the request has unlocked
    if (signatureRequest.unlocksAt > new Date()) {
      return NextResponse.json(
        { error: "Signature request has not unlocked yet" },
        { status: 400 }
      );
    }

    // Update the signature request
    await prisma.signatureRequest.update({
      where: { id: signatureRequestId },
      data: {
        signedPsbt,
        signedAt: new Date(),
        status: "SIGNED",
      },
    });

    return NextResponse.json({
      message: "PSBT signed successfully",
      signatureRequestId,
    });
  } catch (error) {
    console.error("Failed to submit signed PSBT:", error);
    return NextResponse.json(
      { error: "Failed to submit signed PSBT" },
      { status: 500 }
    );
  }
}
