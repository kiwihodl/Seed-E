import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: signatureRequestId } = await params;
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    // Find the signature request
    const signatureRequest = await prisma.signatureRequest.findUnique({
      where: {
        id: signatureRequestId,
      },
    });

    if (!signatureRequest) {
      return NextResponse.json(
        { error: "Signature request not found" },
        { status: 404 }
      );
    }

    // Verify the client owns this request
    if (signatureRequest.clientId !== clientId) {
      return NextResponse.json(
        { error: "Unauthorized to access this request" },
        { status: 403 }
      );
    }

    // Check if the PSBT has been signed
    if (!signatureRequest.signedPsbtData) {
      return NextResponse.json(
        { error: "PSBT has not been signed yet" },
        { status: 400 }
      );
    }

    // Check if the time delay has passed
    if (new Date() < signatureRequest.unlocksAt) {
      return NextResponse.json(
        { error: "Time delay has not passed yet" },
        { status: 400 }
      );
    }

    // Update status to COMPLETED if it's still SIGNED
    if (signatureRequest.status === "SIGNED") {
      await prisma.signatureRequest.update({
        where: {
          id: signatureRequestId,
        },
        data: {
          status: "COMPLETED",
        },
      });
    }

    // Return the signed PSBT data
    return NextResponse.json({
      success: true,
      signedPsbtData: signatureRequest.signedPsbtData,
      signedAt: signatureRequest.signedAt?.toISOString(),
      unlocksAt: signatureRequest.unlocksAt.toISOString(),
    });
  } catch (error) {
    console.error("❌ Error downloading signed PSBT:", error);
    return NextResponse.json(
      { error: "Failed to download signed PSBT" },
      { status: 500 }
    );
  }
}
