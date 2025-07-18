import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Note: The structure of the LND webhook payload might need to be adjusted
    // based on your specific LND configuration (e.g., v1/invoices/subscribe).
    // We are assuming a simple payload with a payment_hash for this example.
    const body = await request.json();
    const paymentHash = body.payment_hash;

    if (!paymentHash) {
      return NextResponse.json(
        { error: "Missing payment_hash" },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { paymentHash },
    });

    if (!client) {
      // It's possible LND sends a webhook for an invoice not related to our app.
      // In that case, we can't find a client, so we just acknowledge and ignore.
      console.log(`Webhook received for unknown paymentHash: ${paymentHash}`);
      return NextResponse.json(
        { message: "Client for payment hash not found" },
        { status: 200 }
      );
    }

    // Calculate the new expiration date (30 days from now)
    const newExpirationDate = new Date();
    newExpirationDate.setDate(newExpirationDate.getDate() + 30);

    // Update the client's subscription
    await prisma.client.update({
      where: { id: client.id },
      data: {
        subscriptionExpiresAt: newExpirationDate,
        // We can clear the paymentHash now that it has been used
        paymentHash: null,
      },
    });

    console.log(
      `Successfully processed payment for client ${
        client.clientId
      }. Subscription active until ${newExpirationDate.toISOString()}.`
    );

    return NextResponse.json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("LND Webhook processing failed:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
