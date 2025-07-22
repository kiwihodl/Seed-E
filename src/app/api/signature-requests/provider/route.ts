import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId");

    if (!providerId) {
      return NextResponse.json(
        { error: "Provider ID is required" },
        { status: 400 }
      );
    }

    const signatureRequests = await prisma.signatureRequest.findMany({
      where: {
        service: {
          providerId,
        },
        status: "PENDING",
      },
      include: {
        client: true,
        service: {
          include: {
            provider: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Transform the data for the frontend
    const transformedRequests = signatureRequests.map((request) => ({
      id: request.id,
      clientId: request.clientId,
      clientName: request.client.username,
      serviceId: request.serviceId,
      serviceName: request.service.provider.username,
      policyType: request.service.policyType,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
      unlocksAt: request.unlocksAt.toISOString(),
      fee: Number(request.signatureFee),
      psbtHash: request.psbtHash,
      hasPsbtData: !!request.psbtData,
    }));

    return NextResponse.json(transformedRequests);
  } catch (error) {
    console.error("❌ Error fetching provider signature requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch signature requests" },
      { status: 500 }
    );
  }
}
