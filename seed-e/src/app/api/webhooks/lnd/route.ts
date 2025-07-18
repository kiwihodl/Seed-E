import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const paymentHash = Buffer.from(body.payment_hash, "base64").toString(
      "hex"
    );

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
        paymentHash: null,
      },
    });

    console.log(
      `Successfully processed payment for client ${
        client.username
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
