import { NextResponse } from "next/server";
import BIP32Factory from "bip32";
import * as ecc from "tiny-secp256k1";
import crypto from "crypto";

// Initialize BIP32 with secp256k1
const bip32 = BIP32Factory(ecc);

export async function GET() {
  try {
    // Generate a real master key with a different seed each time
    const timestamp = Date.now().toString();
    const seed = crypto.createHash("sha256").update(timestamp).digest();
    const masterKey = bip32.fromSeed(seed);

    // Derive the first account (m/44'/0'/0')
    const account = masterKey.derivePath("m/44'/0'/0'");

    // Get the xpub (extended public key)
    const xpub = account.neutered().toBase58();

    // Create a message to sign
    const message = "I authorize this service policy creation";
    const messageBuffer = Buffer.from(message, "utf8");

    // Hash the message first (required for ECDSA signing)
    const messageHash = crypto
      .createHash("sha256")
      .update(messageBuffer)
      .digest();

    // Sign the message hash with the private key
    const signature = account.sign(messageHash);

    // Convert signature to Base64 string
    const signatureBase64 = Buffer.from(signature).toString("base64");

    // Generate a BOLT12 offer (simplified for testing)
    const bolt12Offer =
      "lno1qgsyx6hk6umndph4jqtf9v6kkhlnnmw009juyzd9q7pwgkht7dtwwmxe3g98acmmal9y5x6n9ypmz2w33xggwd28xq7fwwccxqp58xjm8wf3v9e8k6mr5d9cxzun5v5c6w3vy6jz0mcq27rvw0";

    return NextResponse.json({
      xpub,
      controlSignature: signatureBase64,
      bolt12Offer,
      message,
      messageHash: messageHash.toString("hex"),
      signatureLength: signature.length,
    });
  } catch (error) {
    console.error("Failed to generate test data:", error);
    return NextResponse.json(
      { error: "Failed to generate test data" },
      { status: 500 }
    );
  }
}
