import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();

export async function GET() {
  try {
    // For now, return empty array since we haven't implemented signature requests yet
    // This will be populated when clients start making signature requests
    const requests: Array<{
      id: string;
      serviceId: string;
      serviceName: string;
      status: "PENDING" | "SIGNED" | "COMPLETED" | "EXPIRED";
      createdAt: string;
      expiresAt: string;
      penaltyDate: string;
      fee: number;
    }> = [];

    return NextResponse.json({
      requests: requests,
    });
  } catch (error) {
    console.error("Error fetching signature requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch signature requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { clientId, serviceId, psbtData } = await request.json();

    // Validate input
    if (!clientId || !serviceId || !psbtData) {
      return NextResponse.json(
        { error: "Client ID, service ID, and unsigned PSBT are required" },
        { status: 400 }
      );
    }

    // TODO: Implement signature request creation
    // This will include:
    // 1. Validate client exists
    // 2. Validate service exists
    // 3. Validate PSBT format
    // 4. Create signature request record
    // 5. Calculate timeout and penalty dates

    return NextResponse.json(
      { message: "Signature request created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating signature request:", error);
    return NextResponse.json(
      { error: "Failed to create signature request" },
      { status: 500 }
    );
  }
}
