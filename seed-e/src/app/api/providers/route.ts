import { NextResponse } from "next/server";
import { PrismaClient, KeyPolicyType } from "@prisma/client";
import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import ECPairFactory from "ecpair";
import BIP32Factory from "bip32";
import * as bcrypt from "bcryptjs";

const ECPair = ECPairFactory(ecc);
const bip32 = BIP32Factory(ecc);
const prisma = new PrismaClient();

const BTC_MESSAGE_PREFIX = "\x18Bitcoin Signed Message:\n";

function verifySignature(
  xpub: string,
  signature: string,
  message: string
): boolean {
  try {
    const messageWithPrefix = Buffer.concat([
      Buffer.from(BTC_MESSAGE_PREFIX),
      Buffer.from(String(message.length)),
      Buffer.from(message),
    ]);
    const messageHash = bitcoin.crypto.sha256(messageWithPrefix);

    const signatureBuffer = Buffer.from(signature, "base64");

    const node = bip32.fromBase58(xpub);
    return ECPair.fromPublicKey(node.publicKey).verify(
      messageHash,
      signatureBuffer
    );
  } catch (e) {
    console.error("Signature verification failed", e);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      username,
      password,
      policyType,
      xpub,
      controlSignature,
      initialBackupFee,
      perSignatureFee,
      bolt12Offer,
      monthlyFee,
      minTimeDelay,
    } = body;

    // Basic validation
    if (
      !username ||
      !password ||
      !policyType ||
      !xpub ||
      !controlSignature ||
      initialBackupFee === undefined ||
      perSignatureFee === undefined ||
      !bolt12Offer
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate enum
    if (!Object.values(KeyPolicyType).includes(policyType)) {
      return NextResponse.json(
        { error: "Invalid policyType" },
        { status: 400 }
      );
    }

    const messageToVerify = `I, ${username}, attest that this signature was created by the private key corresponding to xpub: ${xpub} for use with Seed-E.`;
    if (!verifySignature(xpub, controlSignature, messageToVerify)) {
      return NextResponse.json(
        { error: "Invalid control signature" },
        { status: 400 }
      );
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create a new provider and their first service in a transaction
    const newService = await prisma.$transaction(async (tx) => {
      const provider = await tx.provider.create({
        data: {
          username,
          passwordHash,
        },
      });

      const service = await tx.service.create({
        data: {
          providerId: provider.id,
          policyType,
          xpub,
          controlSignature,
          initialBackupFee: BigInt(initialBackupFee),
          perSignatureFee: BigInt(perSignatureFee),
          minTimeDelay: minTimeDelay ? Number(minTimeDelay) : 168, // Default to 168 hours (7 days)
          bolt12Offer,
          isActive: true,
          monthlyFee: monthlyFee ? BigInt(monthlyFee) : undefined,
        },
        include: {
          provider: true,
        },
      });
      return service;
    });

    return NextResponse.json(newService, { status: 201 });
  } catch (error) {
    console.error("Failed to create service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
