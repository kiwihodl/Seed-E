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

    // Find the service purchase by payment hash
    const servicePurchase = await prisma.servicePurchase.findUnique({
      where: { paymentHash },
      include: {
        client: true,
        service: true,
      },
    });

    if (!servicePurchase) {
      console.log(`Webhook received for unknown paymentHash: ${paymentHash}`);
      return NextResponse.json(
        { message: "Service purchase for payment hash not found" },
        { status: 200 }
      );
    }

    // Calculate the new expiration date (30 days from now)
    const newExpirationDate = new Date();
    newExpirationDate.setDate(newExpirationDate.getDate() + 30);

    // Update the service purchase
    await prisma.servicePurchase.update({
      where: { id: servicePurchase.id },
      data: {
        expiresAt: newExpirationDate,
        isActive: true,
        paymentHash: null, // Clear the payment hash after processing
      },
    });

    console.log(
      `Successfully processed payment for client ${
        servicePurchase.client.username
      }. Service active until ${newExpirationDate.toISOString()}.`
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
