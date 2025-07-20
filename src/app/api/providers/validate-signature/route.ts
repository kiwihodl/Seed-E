import { NextRequest, NextResponse } from "next/server";
import * as bitcoin from "bitcoinjs-lib";
import BIP32Factory from "bip32";
import * as ecc from "tiny-secp256k1";
import ECPairFactory from "ecpair";

bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);
const ECPair = ECPairFactory(ecc);

const validateSignatureFromXpub = (
  xpub: string,
  signature: string,
  message: string
): { isValid: boolean; error?: string } => {
  try {
    console.log("🔍 Validating signature:", {
      xpub: xpub.substring(0, 20) + "...",
      signature: signature.substring(0, 20) + "...",
      message,
    });

    // Parse the xpub
    const node = bip32.fromBase58(xpub);
    console.log("✅ Xpub parsed successfully");

    // Create the message hash
    const messageHash = bitcoin.crypto.sha256(Buffer.from(message, "utf8"));
    console.log("✅ Message hash created:", messageHash.toString("hex"));

    // Convert signature from hex to buffer
    const signatureBuffer = Buffer.from(signature, "hex");
    console.log(
      "✅ Signature converted to buffer, length:",
      signatureBuffer.length
    );

    // Get the public key from the xpub node
    const publicKey = node.publicKey;
    console.log("✅ Public key extracted, length:", publicKey.length);

    // Create ECPair from public key
    const ecpair = ECPair.fromPublicKey(publicKey);
    console.log("✅ ECPair created from public key");

    // Verify the signature using the xpub's public key
    const isValid = ecpair.verify(messageHash, signatureBuffer);
    console.log("✅ Signature verification result:", isValid);
    console.log("🔍 Verification details:", {
      messageHash: messageHash.toString("hex"),
      signatureLength: signatureBuffer.length,
      publicKeyLength: publicKey.length,
    });

    if (!isValid) {
      return {
        isValid: false,
        error:
          "Signature verification failed - signature does not match the provided xpub",
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error("❌ Signature validation error:", error);
    console.error("❌ Error details:", {
      message: (error as Error).message,
      stack: (error as Error).stack,
    });
    return { isValid: false, error: "Failed to verify signature" };
  }
};

export async function POST(request: NextRequest) {
  try {
    const { xpub, signature, message } = await request.json();

    if (!xpub || !signature || !message) {
      return NextResponse.json(
        { error: "Xpub, signature, and message are required" },
        { status: 400 }
      );
    }

    // Validate signature format first
    if (signature.length !== 128) {
      return NextResponse.json(
        {
          isValid: false,
          error: "Signature must be 64 bytes (128 hex characters)",
        },
        { status: 400 }
      );
    }

    if (!/^[0-9a-fA-F]{128}$/.test(signature)) {
      return NextResponse.json(
        { isValid: false, error: "Signature must be valid hex format" },
        { status: 400 }
      );
    }

    // Validate that the signature comes from the xpub's private key
    const validationResult = validateSignatureFromXpub(
      xpub,
      signature,
      message
    );

    return NextResponse.json({
      isValid: validationResult.isValid,
      error: validationResult.error,
    });
  } catch (error) {
    console.error("Error validating signature:", error);
    return NextResponse.json(
      { isValid: false, error: "Failed to validate signature" },
      { status: 500 }
    );
  }
}
