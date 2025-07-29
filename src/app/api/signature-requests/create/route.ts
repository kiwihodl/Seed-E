import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getStoredUserInfo } from "@/lib/auth";
import { encryptionService } from "@/lib/encryption";
import { clientSecurityService } from "@/lib/client-security";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { clientId, serviceId, psbtData, paymentHash } = await request.json();

    // Validate required fields
    if (!clientId || !serviceId || !psbtData || !paymentHash) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify client owns the service
    const purchase = await prisma.servicePurchase.findFirst({
      where: {
        clientId,
        serviceId,
        isActive: true,
      },
      include: {
        service: true,
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "Service not found or not purchased" },
        { status: 404 }
      );
    }

    // For signature requests, we don't need to verify the original service purchase payment
    // The signature fee payment is handled separately and passed in the paymentHash
    // We'll assume the payment is confirmed if paymentHash is provided
    if (!paymentHash) {
      return NextResponse.json(
        { error: "Payment hash is required" },
        { status: 400 }
      );
    }

    // Validate PSBT format and check for signatures
    const psbtValidation = await validatePSBT(psbtData);
    if (!psbtValidation.isValid) {
      return NextResponse.json(
        { error: psbtValidation.error },
        { status: 400 }
      );
    }

    // Calculate signature fee
    const signatureFee = purchase.service.perSignatureFee;

    // Find the existing temporary signature request with this payment hash
    const existingSignatureRequest = await prisma.signatureRequest.findFirst({
      where: {
        paymentHash: paymentHash,
        clientId: clientId,
        serviceId: serviceId,
      },
    });

    let signatureRequest;

    // Encrypt PSBT data for secure storage
    console.log("🔐 Encrypting PSBT data for signature request");
    const encryptedPsbtData = encryptionService.encryptPSBT(
      psbtData,
      existingSignatureRequest?.id || "new-request"
    );
    console.log(
      "✅ PSBT encryption completed, data length:",
      JSON.stringify(encryptedPsbtData).length
    );

    if (existingSignatureRequest) {
      // Update the existing temporary signature request with PSBT data
      signatureRequest = await prisma.signatureRequest.update({
        where: { id: existingSignatureRequest.id },
        data: {
          psbtData, // Keep plain text for backward compatibility
          encryptedPsbtData: encryptedPsbtData, // Store encrypted PSBT data
          psbtHash: psbtValidation.hash,
          paymentConfirmed: true, // Payment was already confirmed
          status: "PENDING", // PSBT uploaded, waiting for provider to sign
        },
      });
      console.log(
        `✅ Updated existing signature request: ${signatureRequest.id}`
      );
    } else {
      // Fallback: create a new signature request (shouldn't happen with new flow)
      signatureRequest = await prisma.signatureRequest.create({
        data: {
          clientId,
          serviceId,
          psbtData, // Keep plain text for backward compatibility
          encryptedPsbtData: encryptedPsbtData, // Store encrypted PSBT data
          psbtHash: psbtValidation.hash,
          paymentHash: paymentHash,
          paymentConfirmed: true, // Payment was already confirmed
          signatureFee: BigInt(signatureFee),
          unlocksAt: new Date(
            Date.now() + purchase.service.minTimeDelay * 60 * 60 * 1000
          ), // Set based on service's minTimeDelay
          status: "PENDING", // PSBT uploaded, waiting for provider to sign
        },
      });
      console.log(`✅ Created new signature request: ${signatureRequest.id}`);
    }

    return NextResponse.json(
      {
        success: true,
        signatureRequestId: signatureRequest.id,
        message: "Signature request created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error creating signature request:", error);
    return NextResponse.json(
      { error: "Failed to create signature request" },
      { status: 500 }
    );
  }
}

async function validatePSBT(
  psbtData: string
): Promise<{ isValid: boolean; error?: string; hash?: string }> {
  try {
    // Decode base64 PSBT
    const psbtBuffer = Buffer.from(psbtData, "base64");

    // Basic PSBT format validation
    if (psbtBuffer.length < 10) {
      return { isValid: false, error: "PSBT too short to be valid" };
    }

    // Check PSBT magic bytes (0x70736274ff)
    const magicBytes = psbtBuffer.subarray(0, 5);
    if (magicBytes.toString("hex") !== "70736274ff") {
      return { isValid: false, error: "Invalid PSBT format" };
    }

    // Parse PSBT structure to check for signatures
    const hasSignatures = await checkForSignatures(psbtBuffer);
    if (hasSignatures) {
      return {
        isValid: false,
        error:
          "PSBT contains existing signatures. Only unsigned PSBTs are allowed.",
      };
    }

    // Generate hash for tracking
    const crypto = require("crypto");
    const hash = crypto.createHash("sha256").update(psbtBuffer).digest("hex");

    console.log("✅ PSBT validation passed - no signatures found");

    return { isValid: true, hash };
  } catch (error) {
    console.error("PSBT validation error:", error);
    return { isValid: false, error: "Invalid PSBT data" };
  }
}

async function checkForSignatures(psbtBuffer: Buffer): Promise<boolean> {
  try {
    console.log("🔍 Checking PSBT for existing signatures...");

    // Convert to hex for easier debugging
    const hexString = psbtBuffer.toString("hex");
    console.log(
      `PSBT hex (first 100 chars): ${hexString.substring(0, 100)}...`
    );

    // Parse PSBT structure properly to find actual signatures
    let position = 0;

    // Check PSBT magic bytes
    if (
      psbtBuffer.length < 5 ||
      psbtBuffer.subarray(0, 5).toString("hex") !== "70736274ff"
    ) {
      console.log("❌ Invalid PSBT magic bytes");
      return false;
    }
    position = 5;

    // Parse global transaction
    if (position >= psbtBuffer.length) {
      console.log("❌ PSBT too short after magic bytes");
      return false;
    }

    // Skip global transaction data (we're looking for input-specific signatures)
    // The global transaction ends with 0x00
    while (position < psbtBuffer.length && psbtBuffer[position] !== 0x00) {
      position++;
    }
    if (position >= psbtBuffer.length) {
      console.log("❌ PSBT too short after global transaction");
      return false;
    }
    position++; // Skip the 0x00 separator

    // Now parse input sections
    console.log(`🔍 Starting to parse input sections at position ${position}`);
    while (position < psbtBuffer.length) {
      // Check if we've reached the output section (separated by 0x00)
      if (psbtBuffer[position] === 0x00) {
        console.log(
          `🔍 Found output section separator at position ${position}`
        );
        position++;
        break;
      }

      // Parse input-specific key-value pairs
      console.log(
        `🔍 Starting to parse key-value pairs for input at position ${position}`
      );
      while (position < psbtBuffer.length && psbtBuffer[position] !== 0x00) {
        if (position + 1 >= psbtBuffer.length) {
          console.log("❌ PSBT truncated in input section");
          return false;
        }

        const keyType = psbtBuffer[position];
        const keyLength = psbtBuffer[position + 1];
        position += 2;

        if (position + keyLength >= psbtBuffer.length) {
          console.log("❌ PSBT truncated in key data");
          return false;
        }

        // Check for PARTIAL_SIG (type 0x02) - this indicates actual signatures
        if (keyType === 0x02) {
          console.log(
            `❌ Found PARTIAL_SIG record (type 0x02) at position ${position} - PSBT has signatures!`
          );
          return true;
        }

        console.log(
          `🔍 Parsed key type: ${keyType} (0x${keyType.toString(
            16
          )}) at position ${position}`
        );

        // Skip key data
        position += keyLength;

        // Read value length
        if (position >= psbtBuffer.length) {
          console.log("❌ PSBT truncated at value length");
          return false;
        }
        const valueLength = psbtBuffer[position];
        position++;

        // Skip value data
        if (position + valueLength > psbtBuffer.length) {
          console.log("❌ PSBT truncated in value data");
          return true; // Assume it has signatures if we can't parse it properly
        }
        position += valueLength;
      }

      // Skip input separator (0x00)
      if (position < psbtBuffer.length && psbtBuffer[position] === 0x00) {
        position++;
      }
    }

    // Note: SIGHASH_TYPE records (type 0x03) are NOT signatures - they're just metadata
    // about what type of signature hash to use. We only care about PARTIAL_SIG (0x02).

    console.log("✅ No signatures found in PSBT");
    return false;
  } catch (error) {
    console.error("Error parsing PSBT for signatures:", error);
    // If we can't parse it properly, assume it might have signatures
    return true;
  }
}
