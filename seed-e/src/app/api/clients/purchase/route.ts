import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// In a real app, this would be a call to our LND node
// using the provider's bolt12Offer and the service's fee.
async function generateLightningInvoice(
  bolt12Offer: string,
  amount: bigint,
  clientId: string
): Promise<{ invoice: string; paymentHash: string }> {
  console.log(
    `Generating invoice for offer ${bolt12Offer} with amount ${amount} for client ${clientId}`
  );
  // Simulate invoice generation
  const simulatedInvoice = `lnbc${amount}psim...${clientId}`;
  const simulatedPaymentHash = `dummyPaymentHash_${Date.now()}`;
  return { invoice: simulatedInvoice, paymentHash: simulatedPaymentHash };
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

    // Here we would typically associate the paymentHash with the client
    // to verify payment later via a webhook.
    const { invoice, paymentHash } = await generateLightningInvoice(
      service.bolt12Offer,
      service.initialBackupFee,
      username // Use username for invoice metadata if needed
    );

    // Create the client record
    const client = await prisma.client.create({
      data: {
        username,
        passwordHash,
        paymentHash, // Store the payment hash to verify later
        serviceId: service.id,
        // We will set subscriptionExpiresAt after payment confirmation
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
