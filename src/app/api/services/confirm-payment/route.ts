import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { paymentHash } = await request.json();

    if (!paymentHash) {
      return NextResponse.json(
        { error: "Payment hash is required" },
        { status: 400 }
      );
    }

    // Find the pending purchase by payment hash
    const purchase = await prisma.servicePurchase.findUnique({
      where: { paymentHash },
      include: {
        service: true,
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );
    }

    if (purchase.isActive) {
      return NextResponse.json(
        { error: "Payment already confirmed" },
        { status: 409 }
      );
    }

    // Use a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Mark the purchase as active
      await tx.servicePurchase.update({
        where: { id: purchase.id },
        data: { isActive: true },
      });

      // Mark the service as purchased
      await tx.service.update({
        where: { id: purchase.serviceId },
        data: { isPurchased: true },
      });
    });

    return NextResponse.json({
      message: "Payment confirmed successfully",
      purchase: {
        id: purchase.id,
        serviceId: purchase.serviceId,
        clientId: purchase.clientId,
        isActive: true,
      },
    });
  } catch (error) {
    console.error("Payment confirmation error:", error);
    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 }
    );
  }
}
