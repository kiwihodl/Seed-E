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
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );
    }

    if (purchase.isActive) {
      return NextResponse.json(
        { error: "Cannot cancel an active purchase" },
        { status: 409 }
      );
    }

    // Delete the pending purchase and reset service status
    await prisma.$transaction(async (tx) => {
      // Delete the pending purchase
      await tx.servicePurchase.delete({
        where: { id: purchase.id },
      });

      // Reset the service's purchased status
      await tx.service.update({
        where: { id: purchase.serviceId },
        data: {
          isPurchased: false,
        },
      });
    });

    return NextResponse.json({
      message: "Purchase cancelled successfully",
    });
  } catch (error) {
    console.error("Purchase cancellation error:", error);
    return NextResponse.json(
      { error: "Failed to cancel purchase" },
      { status: 500 }
    );
  }
}
