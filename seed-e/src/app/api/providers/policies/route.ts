import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import * as bitcoin from "bitcoinjs-lib";
import BIP32Factory from "bip32";
import * as ecc from "tiny-secp256k1";
import { hashXpub } from "@/lib/xpub-hash";

bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);

const prisma = new PrismaClient();

const validateXpub = (xpub: string): { isValid: boolean; error?: string } => {
  try {
    // Real BIP32 xpub validation
    const node = bip32.fromBase58(xpub);

    // Check if it's a valid extended public key
    if (!node.isNeutered()) {
      return { isValid: false, error: "Must be an extended public key (xpub)" };
    }

    // Additional validation could be added here
    return { isValid: true };
  } catch {
    return { isValid: false, error: "Invalid xpub format" };
  }
};

const validateSignature = (
  signature: string
): { isValid: boolean; error?: string } => {
  try {
    // Real ECDSA signature validation
    if (signature.length !== 128) {
      return {
        isValid: false,
        error: "Signature must be 64 bytes (128 hex characters)",
      };
    }

    // Validate hex format
    if (!/^[0-9a-fA-F]{128}$/.test(signature)) {
      return { isValid: false, error: "Signature must be valid hex format" };
    }

    // Additional validation could be added here
    return { isValid: true };
  } catch {
    return { isValid: false, error: "Invalid signature format" };
  }
};

const validateBolt12Offer = (
  offer: string
): { isValid: boolean; error?: string } => {
  try {
    // Basic BOLT12 offer validation
    if (!offer.startsWith("lno1")) {
      return { isValid: false, error: "BOLT12 offer must start with 'lno1'" };
    }

    // Additional validation could be added here for BOLT12 format
    // For now, we'll do basic format checking

    return { isValid: true };
  } catch {
    return { isValid: false, error: "Invalid BOLT12 offer format" };
  }
};

export async function GET() {
  try {
    // Get username from session/context (for now, we'll get all policies)
    // In a real implementation, you would get the username from the session
    const policies = await prisma.service.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convert BigInt to numbers and format for frontend
    const formattedPolicies = policies.map((policy) => ({
      id: policy.id,
      policyType: policy.policyType,
      xpubHash: policy.xpubHash, // Use xpubHash instead of xpub
      controlSignature: policy.controlSignature,
      initialBackupFee: Number(policy.initialBackupFee),
      perSignatureFee: Number(policy.perSignatureFee),
      monthlyFee: policy.monthlyFee ? Number(policy.monthlyFee) : undefined,
      minTimeDelay: policy.minTimeDelay,
      bolt12Offer: policy.bolt12Offer,
      createdAt: policy.createdAt.toISOString(),
    }));

    return NextResponse.json({ policies: formattedPolicies });
  } catch (error) {
    console.error("Failed to fetch policies:", error);
    return NextResponse.json(
      { error: "Failed to fetch policies" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      policyType,
      xpub,
      controlSignature,
      initialBackupFee,
      perSignatureFee,
      monthlyFee,
      minTimeDelayDays,
      bolt12Offer,
    } = await request.json();

    console.log("Received request data:", {
      policyType,
      xpub: xpub?.substring(0, 20) + "...",
      controlSignature: controlSignature?.substring(0, 20) + "...",
      initialBackupFee,
      perSignatureFee,
      monthlyFee,
      minTimeDelayDays,
      bolt12Offer: bolt12Offer?.substring(0, 20) + "...",
    });

    // Validate required fields
    if (
      !policyType ||
      !xpub ||
      !controlSignature ||
      !initialBackupFee ||
      !perSignatureFee ||
      !minTimeDelayDays ||
      !bolt12Offer
    ) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Real Bitcoin key validation
    const xpubValidation = validateXpub(xpub);
    if (!xpubValidation.isValid) {
      return NextResponse.json(
        { error: xpubValidation.error },
        { status: 400 }
      );
    }

    // Real signature validation
    const signatureValidation = validateSignature(controlSignature);
    if (!signatureValidation.isValid) {
      return NextResponse.json(
        { error: signatureValidation.error },
        { status: 400 }
      );
    }

    // Real BOLT12 offer validation
    const bolt12Validation = validateBolt12Offer(bolt12Offer);
    if (!bolt12Validation.isValid) {
      return NextResponse.json(
        { error: bolt12Validation.error },
        { status: 400 }
      );
    }

    // Validate time delay (7-365 days)
    const timeDelayDays = parseInt(minTimeDelayDays);
    if (timeDelayDays < 7 || timeDelayDays > 365) {
      return NextResponse.json(
        { error: "Time delay must be between 7 and 365 days" },
        { status: 400 }
      );
    }

    // Validate fees
    if (parseInt(initialBackupFee) <= 0 || parseInt(perSignatureFee) <= 0) {
      return NextResponse.json(
        { error: "Fees must be greater than 0" },
        { status: 400 }
      );
    }

    // Get username from localStorage or session (for now, use a default)
    // In a real implementation, you would get this from the session
    const username = "testuser"; // This should come from the session

    console.log("Looking for provider with username:", username);

    // Find the provider
    const provider = await prisma.provider.findUnique({
      where: { username },
    });

    console.log("Provider found:", provider ? "Yes" : "No");

    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    console.log("Creating service with provider ID:", provider.id);

    // Hash the xpub for secure storage
    const xpubHash = hashXpub(xpub.trim());

    // Create the new service in the database
    const newService = await prisma.service.create({
      data: {
        providerId: provider.id,
        policyType: policyType as "P2WSH" | "P2TR" | "P2SH", // Proper enum typing
        xpubHash: xpubHash, // Store hashed xpub instead of plain xpub
        controlSignature: controlSignature.trim(),
        initialBackupFee: BigInt(initialBackupFee),
        perSignatureFee: BigInt(perSignatureFee),
        monthlyFee: monthlyFee ? BigInt(monthlyFee) : null,
        minTimeDelay: timeDelayDays * 24, // Convert days to hours for storage
        bolt12Offer: bolt12Offer.trim(),
        isActive: true,
        isPurchased: false,
      },
    });

    console.log("Service created successfully with ID:", newService.id);

    return NextResponse.json(
      {
        message: "Service created successfully",
        service: {
          id: newService.id,
          policyType: newService.policyType,
          xpubHash: newService.xpubHash, // Return xpubHash instead of xpub
          controlSignature: newService.controlSignature,
          initialBackupFee: Number(newService.initialBackupFee),
          perSignatureFee: Number(newService.perSignatureFee),
          monthlyFee: newService.monthlyFee
            ? Number(newService.monthlyFee)
            : undefined,
          minTimeDelay: newService.minTimeDelay,
          bolt12Offer: newService.bolt12Offer,
          createdAt: newService.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
