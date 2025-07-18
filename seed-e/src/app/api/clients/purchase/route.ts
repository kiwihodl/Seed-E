import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import https from "https";
import axios from "axios";

export const runtime = "nodejs"; // Use the full Node.js runtime

const prisma = new PrismaClient();

// This is the real implementation that connects to an LND node.
async function generateLightningInvoice(
  memo: string,
  amount: bigint
): Promise<{ invoice: string; paymentHash: string }> {
  const { LND_REST_URL, LND_INVOICE_MACAROON } = process.env;

  if (!LND_REST_URL || !LND_INVOICE_MACAROON) {
    throw new Error("LND environment variables not set");
  }

  const agent = new https.Agent({
    rejectUnauthorized: false,
  });

  try {
    const response = await axios.post(
      `${LND_REST_URL}/v1/invoices`,
      {
        memo: memo,
        value: String(amount), // Amount in sats
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Grpc-Metadata-macaroon": LND_INVOICE_MACAROON,
        },
        httpsAgent: agent,
      }
    );

    const data = response.data;

    // LND returns the payment hash as a base64 encoded string. We need to convert it to hex.
    const paymentHash = Buffer.from(data.r_hash, "base64").toString("hex");

    return {
      invoice: data.payment_request,
      paymentHash: paymentHash,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("LND invoice creation failed:", error.response?.data);
      throw new Error(
        `Failed to create LND invoice: ${
          error.response?.data?.error || error.message
        }`
      );
    }
    console.error("An unexpected error occurred:", error);
    throw new Error("An unexpected error occurred during invoice creation.");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { serviceId, username, password } = body;

    if (!serviceId || !username || !password) {
      return NextResponse.json(
        { error: "Missing serviceId, username, or password" },
        { status: 400 }
      );
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Associate the paymentHash with the client
    // to verify payment later via a webhook.
    const { invoice, paymentHash } = await generateLightningInvoice(
      `Purchase for ${username} on Seed-E`,
      service.initialBackupFee
    );

    // Create the client record
    const client = await prisma.client.create({
      data: {
        username,
        passwordHash,
        paymentHash, // Store the payment hash to verify later
        serviceId: service.id,
        // Set subscriptionExpiresAt after payment confirmation
      },
    });

    console.log(
      `Created client ${client.username} with paymentHash ${paymentHash}`
    );

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("Purchase initiation failed:", error);
    return NextResponse.json(
      { error: "Purchase initiation failed" },
      { status: 500 }
    );
  }
}
