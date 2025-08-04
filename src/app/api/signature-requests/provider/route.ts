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

    // First check if there are any active services (purchased keys) for this provider
    const activeServices = await prisma.service.findMany({
      where: {
        providerId,
        servicePurchases: {
          some: {
            isActive: true,
          },
        },
      },
      select: {
        id: true,
      },
    });

    // If no active services, return empty array (no need to check for signature requests)
    if (activeServices.length === 0) {
      return NextResponse.json([]);
    }

    const signatureRequests = await prisma.signatureRequest.findMany({
      where: {
        service: {
          providerId,
        },
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
        createdAt: "desc",
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
