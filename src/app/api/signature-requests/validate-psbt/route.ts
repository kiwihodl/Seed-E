import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { psbtData } = await request.json();

    // Validate required fields
    if (!psbtData) {
      return NextResponse.json(
        { error: "PSBT data is required" },
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

    return NextResponse.json({
      success: true,
      message: "PSBT validation passed",
      hash: psbtValidation.hash,
    });
  } catch (error) {
    console.error("❌ Error validating PSBT:", error);
    return NextResponse.json(
      { error: "Failed to validate PSBT" },
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
      return {
        isValid: false,
        error:
          "PSBT file is too short to be valid. Please ensure you're uploading a proper PSBT file.",
      };
    }

    // Check PSBT magic bytes (0x70736274ff)
    const magicBytes = psbtBuffer.subarray(0, 5);
    if (magicBytes.toString("hex") !== "70736274ff") {
      return {
        isValid: false,
        error:
          "Invalid PSBT format. Please ensure you're uploading a valid PSBT file.",
      };
    }

    // Parse PSBT structure to check for signatures
    const hasSignatures = await checkForSignatures(psbtBuffer);
    if (hasSignatures) {
      return {
        isValid: false,
        error:
          "This PSBT contains existing signatures. Only unsigned PSBTs are allowed for signature requests.",
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

    console.log("✅ No signatures found in PSBT");
    return false;
  } catch (error) {
    console.error("Error parsing PSBT for signatures:", error);
    // If we can't parse it properly, assume it might have signatures
    return true;
  }
}
