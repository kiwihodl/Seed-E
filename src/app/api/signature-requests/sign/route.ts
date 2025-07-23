import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { signatureRequestId, signedPsbtData, providerId } =
      await request.json();

    // Validate required fields
    if (!signatureRequestId || !signedPsbtData || !providerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find the signature request
    const signatureRequest = await prisma.signatureRequest.findUnique({
      where: {
        id: signatureRequestId,
      },
      include: {
        service: {
          include: {
            provider: true,
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
    if (signatureRequest.service.providerId !== providerId) {
      return NextResponse.json(
        { error: "Unauthorized to sign this request" },
        { status: 403 }
      );
    }

    // Check if request is still pending
    if (signatureRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Request is not in pending status" },
        { status: 400 }
      );
    }

    // Validate signed PSBT format
    const psbtValidation = await validateSignedPSBT(signedPsbtData);
    if (!psbtValidation.isValid) {
      return NextResponse.json(
        { error: psbtValidation.error },
        { status: 400 }
      );
    }

    // Update the signature request
    const updatedRequest = await prisma.signatureRequest.update({
      where: {
        id: signatureRequestId,
      },
      data: {
        signedPsbtData,
        signedAt: new Date(),
        status: "SIGNED",
      },
    });

    console.log(`✅ PSBT signed for request: ${signatureRequestId}`);

    return NextResponse.json({
      success: true,
      message: "PSBT signed successfully",
      signatureRequestId: updatedRequest.id,
    });
  } catch (error) {
    console.error("❌ Error signing PSBT:", error);
    return NextResponse.json({ error: "Failed to sign PSBT" }, { status: 500 });
  }
}

async function validateSignedPSBT(
  signedPsbtData: string
): Promise<{ isValid: boolean; error?: string }> {
  try {
    // Decode base64 PSBT
    const psbtBuffer = Buffer.from(signedPsbtData, "base64");

    // Basic PSBT format validation
    if (psbtBuffer.length < 10) {
      return { isValid: false, error: "PSBT too short to be valid" };
    }

    // Check PSBT magic bytes (0x70736274)
    const magicBytes = psbtBuffer.subarray(0, 5);
    if (magicBytes.toString("hex") !== "70736274ff") {
      return { isValid: false, error: "Invalid PSBT format" };
    }

    return { isValid: true };
  } catch (error) {
    console.error("Signed PSBT validation error:", error);
    return { isValid: false, error: "Invalid signed PSBT data" };
  }
}
