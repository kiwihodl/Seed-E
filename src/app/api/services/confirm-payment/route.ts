import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { lightningService } from "@/lib/lightning";

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

    console.log("🔍 Confirm-payment API called with hash:", paymentHash);

    // Find the pending purchase with this payment hash
    const purchase = await prisma.servicePurchase.findFirst({
      where: {
        paymentHash: paymentHash,
        // Remove the isActive: false filter to check all purchases
      },
      include: {
        service: {
          include: {
            provider: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    });

    if (!purchase) {
      console.log("❌ Purchase not found for hash:", paymentHash);
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );
    }

    console.log(
      "✅ Found purchase:",
      purchase.id,
      "Active:",
      purchase.isActive
    );

    // If purchase is already active, return confirmed
    if (purchase.isActive) {
      console.log("✅ Purchase already confirmed");
      return NextResponse.json({
        confirmed: true,
        method: "already_confirmed",
        purchaseId: purchase.id,
        serviceId: purchase.serviceId,
        providerUsername: purchase.service.provider.username,
      });
    }

    // Get the Lightning address and amount from the service
    const lightningAddress =
      purchase.service.lightningAddress || "highlyregarded@getalby.com";
    const amountSats = Number(purchase.service.initialBackupFee);
    const amountMsats = amountSats * 1000; // Convert to millisatoshis

    console.log(`🔍 Using Lightning address: ${lightningAddress}`);
    console.log(`💰 Amount: ${amountSats} sats (${amountMsats} msats)`);

    // Check payment status using Lightning service with LNURL verify
    const isPaid = await lightningService.checkPaymentStatusWithContext(
      paymentHash,
      lightningAddress,
      amountMsats, // Use millisatoshis for Lightning address verification
      purchase.verifyUrl // Pass the stored verify URL
    );

    if (isPaid) {
      // Payment confirmed - activate the purchase and mark service as purchased
      try {
        await prisma.$transaction([
          // Update the purchase to active
          prisma.servicePurchase.update({
            where: { id: purchase.id },
            data: { isActive: true },
          }),
          // Mark the service as purchased
          prisma.service.update({
            where: { id: purchase.serviceId },
            data: { isPurchased: true },
          }),
        ]);

        console.log(
          "✅ Payment confirmed via LNURL verify, purchase activated and service marked as purchased"
        );
        return NextResponse.json({
          confirmed: true,
          method: "lnurl_verify",
        });
      } catch (transactionError) {
        console.error("❌ Transaction failed:", transactionError);
        return NextResponse.json(
          { error: "Failed to update purchase and service status" },
          { status: 500 }
        );
      }
    } else {
      console.log("💰 Payment status check result:", isPaid);
      console.log("⏳ Payment not yet confirmed");
      console.log("ℹ️  LNURL verify indicates payment not settled");

      return NextResponse.json({
        confirmed: false,
        method: "lnurl_verify",
        message: "Payment not yet confirmed via LNURL verify.",
        purchaseId: purchase.id,
        serviceId: purchase.serviceId,
        providerUsername: purchase.service.provider.username,
        amount: amountSats,
        lightningAddress: lightningAddress,
      });
    }
  } catch (error) {
    console.error("❌ Payment confirmation error:", error);
    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 }
    );
  }
}
