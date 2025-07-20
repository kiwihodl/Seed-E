import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import * as bitcoin from "bitcoinjs-lib";
import BIP32Factory from "bip32";
import * as ecc from "tiny-secp256k1";
import ECPairFactory from "ecpair";
import { hashXpub } from "@/lib/xpub-hash";
import { lightningService } from "@/lib/lightning";

bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);
const ECPair = ECPairFactory(ecc);

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

const validateSignatureFromXpub = (
  xpub: string,
  signature: string,
  message: string
): { isValid: boolean; error?: string } => {
  try {
    // Parse the xpub
    const node = bip32.fromBase58(xpub);

    // Create the message hash
    const messageHash = bitcoin.crypto.sha256(Buffer.from(message, "utf8"));

    // Convert signature from hex to buffer
    const signatureBuffer = Buffer.from(signature, "hex");

    // Verify the signature using the xpub's public key
    const isValid = ECPair.fromPublicKey(node.publicKey).verify(
      messageHash,
      signatureBuffer
    );

    if (!isValid) {
      return {
        isValid: false,
        error:
          "Signature verification failed - signature does not match the provided xpub",
      };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: "Failed to verify signature" };
  }
};

const validateLightningAddress = (
  address: string
): { isValid: boolean; error?: string } => {
  try {
    // Basic Lightning address validation
    if (!address.includes("@")) {
      return {
        isValid: false,
        error: "Lightning address must contain '@' (e.g., user@getalby.com)",
      };
    }

    const [username, domain] = address.split("@");

    if (!username || !domain) {
      return { isValid: false, error: "Invalid Lightning address format" };
    }

    if (username.length < 1) {
      return { isValid: false, error: "Username part cannot be empty" };
    }

    if (domain.length < 3) {
      return {
        isValid: false,
        error: "Domain part must be at least 3 characters",
      };
    }

    // Additional validation could be added here for specific domains
    // For now, we'll do basic format checking

    return { isValid: true };
  } catch {
    return { isValid: false, error: "Invalid Lightning address format" };
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId");

    // Build the where clause
    const whereClause: {
      isActive: boolean;
      providerId?: string;
    } = {
      isActive: true,
    };

    // If providerId is provided, filter by it
    if (providerId) {
      whereClause.providerId = providerId;
    }

    const policies = await prisma.service.findMany({
      where: whereClause,
      include: {
        servicePurchases: {
          include: {
            client: {
              select: {
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convert BigInt to numbers and format for frontend
    const formattedPolicies = policies.map((policy) => ({
      id: policy.id,
      policyType: policy.policyType,
      xpub: policy.encryptedXpub || policy.xpubHash, // Return actual xpub if available, otherwise hash
      xpubHash: policy.xpubHash, // Use xpubHash instead of xpub
      controlSignature: policy.controlSignature,
      initialBackupFee: Number(policy.initialBackupFee),
      perSignatureFee: Number(policy.perSignatureFee),
      monthlyFee: policy.monthlyFee ? Number(policy.monthlyFee) : undefined,
      minTimeDelay: policy.minTimeDelay,
      lightningAddress: policy.lightningAddress, // Changed from bolt12Offer
      createdAt: policy.createdAt.toISOString(),
      isPurchased: policy.isPurchased,
      servicePurchases: policy.servicePurchases.map((purchase) => ({
        id: purchase.id,
        client: {
          username: purchase.client.username,
        },
        createdAt: purchase.createdAt.toISOString(),
        isActive: purchase.isActive,
      })),
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
      providerId,
      policyType,
      xpub,
      controlSignature,
      initialBackupFee,
      perSignatureFee,
      monthlyFee,
      minTimeDelayDays,
      lightningAddress, // Changed from bolt12Offer
    } = await request.json();

    console.log("Received request data:", {
      providerId,
      policyType,
      xpub: xpub?.substring(0, 20) + "...",
      controlSignature: controlSignature?.substring(0, 20) + "...",
      initialBackupFee,
      perSignatureFee,
      monthlyFee,
      minTimeDelayDays,
      lightningAddress: lightningAddress?.substring(0, 20) + "...", // Changed from bolt12Offer
    });

    // Validate required fields
    if (
      !providerId ||
      !policyType ||
      !xpub ||
      !controlSignature ||
      !initialBackupFee ||
      !perSignatureFee ||
      !minTimeDelayDays ||
      !lightningAddress // Changed from bolt12Offer
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

    // Validate that the signature comes from the xpub's private key
    const message = "Control signature for Seed-E service";
    const signatureFromXpubValidation = validateSignatureFromXpub(
      xpub,
      controlSignature,
      message
    );
    if (!signatureFromXpubValidation.isValid) {
      return NextResponse.json(
        { error: signatureFromXpubValidation.error },
        { status: 400 }
      );
    }

    // Real Lightning address validation
    const lightningValidation = validateLightningAddress(lightningAddress); // Changed from bolt12Offer
    if (!lightningValidation.isValid) {
      return NextResponse.json(
        { error: lightningValidation.error },
        { status: 400 }
      );
    }

    // Check if Lightning address supports LNURL verify
    try {
      const validationResult = await lightningService.validateLightningAddress(
        lightningAddress
      );
      if (!validationResult.isValid) {
        return NextResponse.json(
          { error: validationResult.error },
          { status: 400 }
        );
      }

      if (!validationResult.supportsLnurlVerify) {
        return NextResponse.json(
          {
            error:
              "This Lightning address doesn't support LNURL verify. Please use a Lightning address from a provider that supports LNURL verify (e.g., Alby, Voltage, etc.).",
          },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error(
        "Error validating Lightning address LNURL verify support:",
        error
      );
      return NextResponse.json(
        {
          error:
            "Failed to validate Lightning address LNURL verify support. Please try again.",
        },
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

    console.log("Looking for provider with ID:", providerId);

    // Find the provider by ID
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
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
        encryptedXpub: xpub.trim(), // Store the actual xpub for provider access
        controlSignature: controlSignature.trim(),
        initialBackupFee: BigInt(initialBackupFee),
        perSignatureFee: BigInt(perSignatureFee),
        monthlyFee: monthlyFee ? BigInt(monthlyFee) : null,
        minTimeDelay: timeDelayDays * 24, // Convert days to hours for storage
        lightningAddress: lightningAddress.trim(), // Store the lightning address
        isActive: true,
        isPurchased: false,
      },
    });

    console.log("Service created successfully with ID:", newService.id);

    return NextResponse.json(
      {
        message: "Service created successfully",
        serviceId: newService.id,
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
          lightningAddress: newService.lightningAddress, // Return lightning address
          createdAt: newService.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create service:", error);

    // Check if it's a duplicate xpub error
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002" &&
      "meta" in error &&
      error.meta &&
      typeof error.meta === "object" &&
      "target" in error.meta &&
      Array.isArray(error.meta.target) &&
      error.meta.target.includes("xpubHash")
    ) {
      return NextResponse.json(
        {
          error:
            "This xpub is already registered. Please use a different xpub.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
