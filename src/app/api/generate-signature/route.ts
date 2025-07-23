import { NextResponse } from "next/server";
import BIP32Factory from "bip32";
import * as ecc from "tiny-secp256k1";
import crypto from "crypto";

// Initialize BIP32 with secp256k1
const bip32 = BIP32Factory(ecc);

export async function POST(request: Request) {
  try {
    const { xpub, derivationPath } = await request.json();

    if (!xpub) {
      return NextResponse.json({ error: "Xpub is required" }, { status: 400 });
    }

    // For testing purposes, we'll generate a new key that matches the xpub format
    // In a real scenario, you would need the actual private key
    console.log(
      "🔍 Generating test signature for xpub:",
      xpub.substring(0, 20) + "..."
    );

    // Create a message to sign
    const message = "Control signature for Seed-E service";
    const messageBuffer = Buffer.from(message, "utf8");

    // Hash the message first (required for ECDSA signing)
    const messageHash = crypto
      .createHash("sha256")
      .update(messageBuffer)
      .digest();

    // For testing: Generate a new key and derive the xpub to match the format
    const timestamp = Date.now().toString();
    const seed = crypto.createHash("sha256").update(timestamp).digest();
    const masterKey = bip32.fromSeed(seed);

    // Use the derivation path from the QR code if provided, otherwise use default
    const path = derivationPath || "m/48'/0'/0'/2'";
    const derivedKey = masterKey.derivePath(path);

    // Get the xpub for verification
    const generatedXpub = derivedKey.neutered().toBase58();
    console.log("🔍 Generated xpub:", generatedXpub.substring(0, 20) + "...");

    // Sign the message hash with the private key
    const signature = derivedKey.sign(messageHash);

    // Convert signature to hex (128 characters)
    const signatureHex = Buffer.from(signature).toString("hex");

    console.log(
      "✅ Generated signature:",
      signatureHex.substring(0, 20) + "..."
    );

    return NextResponse.json({
      xpub: generatedXpub,
      message,
      messageHash: messageHash.toString("hex"),
      derivationPath: path,
      masterFingerprint: Buffer.from(masterKey.fingerprint)
        .toString("hex")
        .toUpperCase(),
    });
  } catch (error) {
    console.error("Failed to generate signature:", error);
    return NextResponse.json(
      { error: "Failed to generate signature" },
      { status: 500 }
    );
  }
}
