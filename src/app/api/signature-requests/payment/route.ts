import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { lightningService } from "@/lib/lightning";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { clientId, serviceId, amount } = await request.json();

    // Validate required fields
    if (!clientId || !serviceId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify client owns the service
    const purchase = await prisma.servicePurchase.findFirst({
      where: {
        clientId,
        serviceId,
        isActive: true,
      },
      include: {
        service: {
          include: {
            provider: true,
          },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "Service not found or not purchased" },
        { status: 404 }
      );
    }

    // Create payment request for signature fee
    const provider = purchase.service.provider;
    const lightningAddress = purchase.service.lightningAddress;

    if (!lightningAddress) {
      return NextResponse.json(
        { error: "Service has no Lightning address configured" },
        { status: 400 }
      );
    }

    // Create payment request
    const paymentRequest = await lightningService.createInvoice({
      amount: amount, // Keep as sats (1 sat)
      description: `Signature request fee: ${provider.username} - ${purchase.service.policyType}`,
      providerLightningAddress: lightningAddress,
    });

    // Store payment info temporarily (we'll create the signature request only after payment + PSBT validation)
    console.log("✅ Payment request created for signature fee");

    console.log("✅ Payment request created for signature fee");

    return NextResponse.json({
      success: true,
      paymentRequest: paymentRequest.paymentRequest,
      paymentHash: paymentRequest.paymentHash,
      amount: amount,
      description: paymentRequest.description,
      expiresAt: paymentRequest.expiresAt,
    });
  } catch (error) {
    console.error("❌ Error creating signature request payment:", error);
    return NextResponse.json(
      { error: "Failed to create payment request" },
      { status: 500 }
    );
  }
}
