import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { lightningService } from "@/lib/lightning";
import { encryptionService } from "@/lib/encryption";

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

    console.log(`🔍 Confirm-payment API called with hash: ${paymentHash}`);

    // First, try to find an existing signature request
    let signatureRequest = await prisma.signatureRequest.findFirst({
      where: { paymentHash },
      include: { service: true },
    });

    // If no signature request exists yet, check payment status directly
    if (!signatureRequest) {
      console.log(
        "🔍 No signature request found, checking payment status directly"
      );

      // For signature requests, we need to get the service info from the payment hash
      // Since we don't have a signature request yet, we'll use a default Lightning address
      const lightningAddress = "highlyregarded@getalby.com"; // Default for now
      const amountSats = 1; // Default signature fee
      const amountMsats = amountSats * 1000;

      console.log(`🔍 Using default Lightning address: ${lightningAddress}`);
      console.log(`💰 Amount: ${amountSats} sats (${amountMsats} msats)`);

      try {
        const verifyResult =
          await lightningService.checkPaymentStatusWithContext(
            paymentHash,
            lightningAddress,
            amountMsats,
            null // No verify URL for direct payment check
          );

        console.log(`✅ Direct payment check result:`, verifyResult);

        if (verifyResult) {
          console.log("✅ Payment confirmed via direct check");
          return NextResponse.json({
            success: true,
            confirmed: true,
            message: "Payment confirmed",
            method: "direct_check",
          });
        } else {
          console.log("💰 Payment not yet confirmed via direct check");
          return NextResponse.json({
            success: true,
            confirmed: false,
            message: "Payment not yet confirmed",
            method: "direct_check",
          });
        }
      } catch (verifyError) {
        console.error("❌ Error verifying payment directly:", verifyError);
        return NextResponse.json(
          { error: "Failed to verify payment" },
          { status: 500 }
        );
      }
    }

    // If signature request exists, proceed with normal flow
    const lightningAddress = signatureRequest.service.lightningAddress;
    console.log(`🔍 Using Lightning address: ${lightningAddress}`);

    if (!lightningAddress) {
      console.log("❌ No Lightning address configured");
      return NextResponse.json(
        { error: "No Lightning address configured" },
        { status: 400 }
      );
    }

    // Check payment amount (use the signature request's signatureFee)
    const amountSats = Number(signatureRequest.signatureFee);
    const amountMsats = amountSats * 1000; // Convert to millisatoshis
    console.log(`💰 Amount: ${amountSats} sats (${amountMsats} msats)`);

    // Verify payment using LNURL
    console.log(`🔍 Checking payment status for hash: ${paymentHash}`);
    console.log("🔍 Using LNURL verify for payment status check");

    try {
      const verifyResult = await lightningService.checkPaymentStatusWithContext(
        paymentHash,
        lightningAddress,
        amountMsats, // Use millisatoshis for Lightning address verification
        signatureRequest.verifyUrl // Use stored verify URL for LNURL verification
      );

      console.log(`✅ LNURL verify result:`, verifyResult);

      if (verifyResult) {
        console.log(
          "✅ Payment confirmed via LNURL verify, signature fee paid"
        );

        // Update the signature request to mark payment as confirmed
        await prisma.signatureRequest.update({
          where: { id: signatureRequest.id },
          data: { paymentConfirmed: true },
        });

        return NextResponse.json({
          success: true,
          confirmed: true,
          message: "Payment confirmed",
          method: "signature_request",
        });
      } else {
        console.log("💰 Payment status check result: false");
        console.log("⏳ Payment not yet confirmed");
        console.log("ℹ️  LNURL verify indicates payment not settled");

        return NextResponse.json({
          success: true,
          confirmed: false,
          message: "Payment not yet confirmed",
          method: "signature_request",
        });
      }
    } catch (verifyError) {
      console.error("❌ Error verifying payment:", verifyError);
      return NextResponse.json(
        { error: "Failed to verify payment" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Error in confirm-payment API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
