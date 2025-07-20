import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { lightningService } from "@/lib/lightning";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle different webhook types from LND
    if (body.type === "invoice_updated" || body.type === "invoice_confirmed") {
      const { id: paymentHash, is_confirmed } = body.data;

      if (is_confirmed) {
        // Find the purchase with this payment hash
        const purchase = await prisma.servicePurchase.findFirst({
          where: { paymentHash },
          include: {
            service: {
              include: {
                provider: {
                  select: { username: true },
                },
              },
            },
            client: {
              select: { username: true },
            },
          },
        });

        if (purchase && !purchase.isActive) {
          // Activate the purchase
          await prisma.servicePurchase.update({
            where: { id: purchase.id },
            data: { isActive: true },
          });

          console.log(
            `Payment confirmed for purchase ${purchase.id}: ${purchase.client.username} -> ${purchase.service.provider.username}`
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Manual payment status check endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentHash = searchParams.get("paymentHash");

    if (!paymentHash) {
      return NextResponse.json(
        { error: "Payment hash is required" },
        { status: 400 }
      );
    }

    // Check payment status via LND
    const isPaid = await lightningService.checkPaymentStatus(paymentHash);

    if (isPaid) {
      // Find and activate the purchase
      const purchase = await prisma.servicePurchase.findFirst({
        where: { paymentHash },
        include: {
          service: {
            include: {
              provider: {
                select: { username: true },
              },
            },
          },
          client: {
            select: { username: true },
          },
        },
      });

      if (purchase && !purchase.isActive) {
        await prisma.servicePurchase.update({
          where: { id: purchase.id },
          data: { isActive: true },
        });

        console.log(
          `Payment confirmed for purchase ${purchase.id}: ${purchase.client.username} -> ${purchase.service.provider.username}`
        );
      }
    }

    return NextResponse.json({
      isPaid,
      paymentHash,
    });
  } catch (error) {
    console.error("Payment status check error:", error);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    );
  }
}
