import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    // Fetch signature requests for this client
    const signatureRequests = await prisma.signatureRequest.findMany({
      where: {
        clientId: clientId,
      },
      include: {
        service: {
          include: {
            provider: {
              select: {
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(
      `✅ Found ${signatureRequests.length} signature requests for client ${clientId}`
    );

    return NextResponse.json({
      signatureRequests: signatureRequests.map((request) => ({
        id: request.id,
        status: request.status,
        createdAt: request.createdAt,
        unlocksAt: request.unlocksAt,
        signedAt: request.signedAt,
        signatureFee: Number(request.signatureFee),
        paymentConfirmed: request.paymentConfirmed,
        providerName: request.service.provider.username,
        policyType: request.service.policyType,
        psbtHash: request.psbtHash,
        signedPsbtData: request.signedPsbtData,
      })),
    });
  } catch (error) {
    console.error("❌ Error fetching signature requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch signature requests" },
      { status: 500 }
    );
  }
}
