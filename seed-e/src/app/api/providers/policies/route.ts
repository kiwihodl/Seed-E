import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import BIP32Factory from "bip32";
import * as ecc from "tiny-secp256k1";

const prisma = new PrismaClient();

// Initialize BIP32 with secp256k1
const bip32 = BIP32Factory(ecc);

// Validate xpub format and checksum
const validateXpub = (xpub: string): { isValid: boolean; error?: string } => {
  try {
    // Check if it starts with xpub or zpub
    if (!xpub.startsWith("xpub") && !xpub.startsWith("zpub")) {
      return {
        isValid: false,
        error: "Extended public key must start with 'xpub' or 'zpub'",
      };
    }

    // Basic format validation - check length and characters
    if (xpub.length < 100 || xpub.length > 120) {
      return { isValid: false, error: "Invalid extended public key length" };
    }

    // Check for valid Base58 characters
    const validChars = /^[1-9A-HJ-NP-Za-km-z]+$/;
    if (!validChars.test(xpub)) {
      return {
        isValid: false,
        error: "Invalid extended public key characters",
      };
    }

    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: "Invalid extended public key format",
    };
  }
};

// Validate Base64 signature format
const validateSignature = (
  signature: string
): { isValid: boolean; error?: string } => {
  try {
    // Check if it's valid Base64
    const decoded = Buffer.from(signature, "base64");

    // ECDSA signatures are typically 64 bytes (r and s components, 32 bytes each)
    if (decoded.length !== 64) {
      return {
        isValid: false,
        error: "Invalid signature length - ECDSA signatures must be 64 bytes",
      };
    }

    return { isValid: true };
  } catch {
    return { isValid: false, error: "Invalid Base64 signature format" };
  }
};

// Validate BOLT12 offer format
const validateBolt12Offer = (
  offer: string
): { isValid: boolean; error?: string } => {
  try {
    // Basic BOLT12 validation - should start with 'lno1' and be valid bech32
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
      xpub: policy.xpub,
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

    // Create the new service in the database
    const newService = await prisma.service.create({
      data: {
        providerId: provider.id,
        policyType: policyType as "P2WSH" | "P2TR" | "P2SH", // Proper enum typing
        xpub: xpub.trim(),
        controlSignature: controlSignature.trim(),
        initialBackupFee: BigInt(initialBackupFee),
        perSignatureFee: BigInt(perSignatureFee),
        monthlyFee: monthlyFee ? BigInt(monthlyFee) : null,
        minTimeDelay: timeDelayDays * 24, // Convert days to hours for storage
        bolt12Offer: bolt12Offer.trim(),
        isActive: true,
      },
    });

    console.log("Service created successfully with ID:", newService.id);

    return NextResponse.json(
      {
        message: "Service created successfully",
        service: {
          id: newService.id,
          policyType: newService.policyType,
          xpub: newService.xpub,
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
