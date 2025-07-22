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

    const signatureRequests = await prisma.signatureRequest.findMany({
      where: {
        clientId,
      },
      include: {
        service: {
          include: {
            provider: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the data for the frontend
    const transformedRequests = signatureRequests.map((request) => ({
      id: request.id,
      serviceId: request.serviceId,
      serviceName: request.service.provider.username,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
      expiresAt: request.unlocksAt.toISOString(),
      penaltyDate: request.unlocksAt.toISOString(), // For compatibility
      fee: Number(request.signatureFee),
      providerName: request.service.provider.username,
      policyType: request.service.policyType,
      signedAt: request.signedAt?.toISOString(),
      hasSignedPsbt: !!request.signedPsbtData,
    }));

    return NextResponse.json(transformedRequests);
  } catch (error) {
    console.error("❌ Error fetching signature requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch signature requests" },
      { status: 500 }
    );
  }
}
