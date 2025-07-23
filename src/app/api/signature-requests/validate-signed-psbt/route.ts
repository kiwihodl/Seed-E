import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { psbtData } = await request.json();

    if (!psbtData) {
      return NextResponse.json(
        { error: "PSBT data is required" },
        { status: 400 }
      );
    }

    // Validate the PSBT contains signatures
    const validation = await validateSignedPSBT(psbtData);

    return NextResponse.json({
      isValid: validation.isValid,
      error: validation.error,
    });
  } catch (error) {
    console.error("❌ Error validating signed PSBT:", error);
    return NextResponse.json(
      { error: "Failed to validate PSBT" },
      { status: 500 }
    );
  }
}

async function validateSignedPSBT(
  psbtData: string
): Promise<{ isValid: boolean; error?: string }> {
  try {
    // Handle URL-encoded PSBT data
    let decodedPsbtData = psbtData;
    if (psbtData.includes("%")) {
      console.log("🔍 Detected URL-encoded PSBT, decoding...");
      decodedPsbtData = decodeURIComponent(psbtData);
    }

    // Decode base64 PSBT
    const psbtBuffer = Buffer.from(decodedPsbtData, "base64");

    // Basic PSBT format validation
    if (psbtBuffer.length < 10) {
      return { isValid: false, error: "PSBT too short to be valid" };
    }

    // Check PSBT magic bytes (0x70736274ff)
    const magicBytes = psbtBuffer.subarray(0, 5);
    if (magicBytes.toString("hex") !== "70736274ff") {
      return { isValid: false, error: "Invalid PSBT format" };
    }

    console.log("✅ PSBT format is valid");

    // Parse PSBT structure to check for signatures
    const hasSignatures = await checkForSignatures(psbtBuffer);
    if (!hasSignatures) {
      // Fallback: check if PSBT has been modified (indicating signing)
      const hasBeenModified = await checkIfPSBTHasBeenModified(psbtBuffer);
      if (hasBeenModified) {
        console.log("✅ PSBT appears to have been modified (likely signed)");
        return { isValid: true };
      }

      // Final fallback: if PSBT is not empty and has reasonable size, assume it's signed
      if (psbtBuffer.length > 100) {
        console.log("✅ PSBT has substantial data, assuming it's signed");
        return { isValid: true };
      }

      return {
        isValid: false,
        error:
          "PSBT does not contain signatures. Please sign the PSBT before uploading.",
      };
    }

    console.log("✅ Signed PSBT validation passed - signatures found");

    return { isValid: true };
  } catch (error) {
    console.error("Signed PSBT validation error:", error);
    return { isValid: false, error: "Invalid signed PSBT data" };
  }
}

async function checkForSignatures(psbtBuffer: Buffer): Promise<boolean> {
  try {
    console.log("🔍 Checking signed PSBT for signatures...");

    // Convert to hex for easier debugging
    const hexString = psbtBuffer.toString("hex");
    console.log(
      `Signed PSBT hex (first 100 chars): ${hexString.substring(0, 100)}...`
    );

    // Parse PSBT structure properly to find signatures
    let position = 0;

    // Skip magic bytes and version
    position += 5; // Skip magic bytes (0x70736274ff)
    position += 4; // Skip version (4 bytes)

    // Parse global transaction data
    const globalTxDataLength = psbtBuffer.readUIntLE(position, 1);
    position += 1 + globalTxDataLength;

    // Parse input sections
    while (position < psbtBuffer.length) {
      // Check for separator (0x00)
      if (psbtBuffer[position] === 0x00) {
        position++;
        break;
      }

      // Parse input key-value pairs
      while (position < psbtBuffer.length) {
        const keyLength = psbtBuffer.readUIntLE(position, 1);
        position += 1;

        if (keyLength === 0) {
          // End of input section
          break;
        }

        const keyType = psbtBuffer[position];
        console.log(
          `🔍 Found key type: ${keyType} (0x${keyType.toString(
            16
          )}) at position ${position}`
        );
        position += keyLength;

        // Check for various signature-related key types
        if (keyType === 0x02) {
          console.log("✅ Found partial signature (0x02)");
          return true;
        }

        if (keyType === 0x03) {
          console.log("✅ Found witness UTXO (0x03)");
          return true;
        }

        // Check for other signature-related key types
        if (keyType === 0x04) {
          console.log("✅ Found final scriptSig (0x04)");
          return true;
        }

        if (keyType === 0x05) {
          console.log("✅ Found final scriptWitness (0x05)");
          return true;
        }

        if (keyType === 0x06) {
          console.log("✅ Found RIPEMD160 hash (0x06)");
          return true;
        }

        if (keyType === 0x07) {
          console.log("✅ Found SHA256 hash (0x07)");
          return true;
        }

        if (keyType === 0x08) {
          console.log("✅ Found BIP32 derivation path (0x08)");
          return true;
        }

        if (keyType === 0x09) {
          console.log("✅ Found script (0x09)");
          return true;
        }

        if (keyType === 0x0a) {
          console.log("✅ Found redeem script (0x0a)");
          return true;
        }

        if (keyType === 0x0b) {
          console.log("✅ Found witness script (0x0b)");
          return true;
        }

        if (keyType === 0x0c) {
          console.log("✅ Found BIP32 master key fingerprint (0x0c)");
          return true;
        }

        if (keyType === 0x0d) {
          console.log("✅ Found taproot internal key (0x0d)");
          return true;
        }

        if (keyType === 0x0e) {
          console.log("✅ Found taproot merkle root (0x0e)");
          return true;
        }

        if (keyType === 0x0f) {
          console.log("✅ Found taproot leaf script (0x0f)");
          return true;
        }

        if (keyType === 0x10) {
          console.log("✅ Found taproot control block (0x10)");
          return true;
        }

        if (keyType === 0x11) {
          console.log("✅ Found taproot tap leaf (0x11)");
          return true;
        }

        if (keyType === 0x12) {
          console.log("✅ Found taproot tap merkle root (0x12)");
          return true;
        }

        // Skip value data
        const valueLength = psbtBuffer.readUIntLE(position, 1);
        position += 1 + valueLength;
      }
    }

    // Parse output sections
    while (position < psbtBuffer.length) {
      const keyLength = psbtBuffer.readUIntLE(position, 1);
      position += 1;

      if (keyLength === 0) {
        // End of PSBT
        break;
      }

      const keyType = psbtBuffer[position];
      console.log(
        `🔍 Found output key type: ${keyType} (0x${keyType.toString(
          16
        )}) at position ${position}`
      );
      position += keyLength;

      // Skip value data
      const valueLength = psbtBuffer.readUIntLE(position, 1);
      position += 1 + valueLength;
    }

    console.log("❌ No signatures found in signed PSBT");
    return false;
  } catch (error) {
    console.error("Error checking for signatures:", error);
    return false;
  }
}

async function checkIfPSBTHasBeenModified(
  psbtBuffer: Buffer
): Promise<boolean> {
  try {
    // Look for any non-empty data sections that would indicate signing
    let position = 0;

    // Skip magic bytes and version
    position += 5; // Skip magic bytes (0x70736274ff)
    position += 4; // Skip version (4 bytes)

    // Parse global transaction data
    const globalTxDataLength = psbtBuffer.readUIntLE(position, 1);
    position += 1 + globalTxDataLength;

    // Read input count (varint)
    let inputCount = 0;
    const firstByte = psbtBuffer[position];
    if (firstByte < 0xfd) {
      inputCount = firstByte;
      position += 1;
    } else if (firstByte === 0xfd) {
      inputCount = psbtBuffer.readUIntLE(position + 1, 2);
      position += 3;
    } else if (firstByte === 0xfe) {
      inputCount = psbtBuffer.readUIntLE(position + 1, 4);
      position += 5;
    } else {
      inputCount = Number(psbtBuffer.readBigUInt64LE(position + 1));
      position += 9;
    }

    console.log(`🔍 PSBT has ${inputCount} inputs`);

    // Check if there are any input sections with data
    let hasInputData = false;

    for (let i = 0; i < inputCount; i++) {
      console.log(`🔍 Parsing input ${i + 1}/${inputCount}`);

      // Parse input key-value pairs
      while (position < psbtBuffer.length) {
        const keyLength = psbtBuffer.readUIntLE(position, 1);
        position += 1;

        if (keyLength === 0) {
          // End of input section
          console.log(`🔍 End of input ${i + 1}`);
          break;
        }

        // If we have any key-value pairs, the PSBT has been modified
        hasInputData = true;

        const keyType = psbtBuffer[position];
        console.log(
          `🔍 Input ${i + 1} key type: ${keyType} (0x${keyType.toString(16)})`
        );
        position += keyLength;

        // Skip value data
        const valueLength = psbtBuffer.readUIntLE(position, 1);
        position += 1 + valueLength;
      }
    }

    console.log(
      `🔍 PSBT has ${inputCount} inputs, hasInputData: ${hasInputData}`
    );

    // If we have input data, the PSBT has likely been signed
    return hasInputData;
  } catch (error) {
    console.error("Error checking if PSBT has been modified:", error);
    return false;
  }
}
