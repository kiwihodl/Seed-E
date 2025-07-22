import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { lightningService } from "@/lib/lightning";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Purchase API called");
    const { serviceId, clientId } = await request.json();
    console.log("📝 Request data:", { serviceId, clientId });

    if (!serviceId || !clientId) {
      console.log("❌ Missing serviceId or clientId");
      return NextResponse.json(
        { error: "Service ID and Client ID are required" },
        { status: 400 }
      );
    }

    // Get the service details with provider information
    console.log("🔍 Looking up service...");
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        provider: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!service) {
      console.log("❌ Service not found");
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    console.log("✅ Service found:", service.id, service.policyType);

    // Check if service is already purchased
    if (service.isPurchased) {
      console.log("❌ Service already purchased");
      return NextResponse.json(
        { error: "Service has already been purchased" },
        { status: 409 }
      );
    }

    // Get the client details
    console.log("🔍 Looking up client...");
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      console.log("❌ Client not found");
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    console.log("✅ Client found:", client.username);

    // Check if client already purchased this service
    const existingPurchase = await prisma.servicePurchase.findUnique({
      where: {
        clientId_serviceId: {
          clientId: clientId,
          serviceId: serviceId,
        },
      },
    });

    if (existingPurchase) {
      return NextResponse.json(
        { error: "Service already purchased by this client" },
        { status: 409 }
      );
    }

    // Check for any pending purchases for this service and clean them up
    const pendingPurchases = await prisma.servicePurchase.findMany({
      where: {
        serviceId: serviceId,
        isActive: false, // Only pending purchases
      },
    });

    if (pendingPurchases.length > 0) {
      console.log(
        `🧹 Cleaning up ${pendingPurchases.length} pending purchase(s) for service ${serviceId}`
      );

      // Delete all pending purchases for this service
      await prisma.servicePurchase.deleteMany({
        where: {
          serviceId: serviceId,
          isActive: false,
        },
      });
    }

    // Calculate the total fee (initial backup fee)
    const totalFee = Number(service.initialBackupFee);

    // For Lightning addresses, we need to use millisatoshis
    const amountMsats = totalFee * 1000; // Convert to millisatoshis

    // Validate that the provider's Lightning address supports LNURL verify
    const lightningAddress =
      service.lightningAddress || "highlyregarded@getalby.com";

    console.log(`🔍 Validating Lightning address: ${lightningAddress}`);
    console.log(`💰 Amount: ${totalFee} sats (${amountMsats} msats)`);

    // Re-enable Lightning validation
    const supportsLNURLVerify =
      await lightningService.validateLNURLVerifySupport(lightningAddress);

    if (!supportsLNURLVerify) {
      console.log(
        `❌ Provider Lightning address ${lightningAddress} does not support LNURL verify`
      );
      return NextResponse.json(
        {
          error:
            "Provider Lightning address must support LNURL verify for payment detection. Please use a Lightning address from a provider that supports verification (e.g., user@getalby.com).",
        },
        { status: 400 }
      );
    }

    console.log(
      `✅ Provider Lightning address ${lightningAddress} supports LNURL verify`
    );

    // Generate Lightning Network invoice with provider's Lightning address
    console.log("🔌 Creating Lightning invoice...");
    const invoice = await lightningService.createInvoice({
      amount: totalFee, // Keep in sats for the service
      description: `Service purchase: ${service.provider.username} - ${service.policyType}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      providerLightningAddress: lightningAddress, // Pass provider's Lightning address
    });

    console.log("✅ Lightning invoice created successfully");

    // Simplified purchase creation for testing
    const result = await prisma.servicePurchase.create({
      data: {
        serviceId: serviceId,
        clientId: clientId,
        paymentHash: invoice.paymentHash,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        isActive: false, // Mark as pending until payment is confirmed
        // Store the verify URL for LNURL verification
        verifyUrl: invoice.verifyUrl || null,
      },
    });

    console.log("✅ Purchase record created:", result.id);

    return NextResponse.json({
      message: "Service purchased successfully",
      purchase: {
        id: result.id,
        invoice: {
          paymentRequest: invoice.paymentRequest,
          paymentHash: invoice.paymentHash,
          amount: invoice.amount,
          description: invoice.description,
          expiresAt: invoice.expiresAt.toISOString(),
        },
        service: {
          id: service.id,
          providerName: service.provider.username,
          policyType: service.policyType,
          initialBackupFee: totalFee,
          perSignatureFee: Number(service.perSignatureFee),
          minTimeDelay: service.minTimeDelay,
        },
      },
    });
  } catch (error) {
    console.error("❌ Purchase error:", error);

    // Provide more detailed error messages
    let errorMessage = "Failed to purchase service";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
