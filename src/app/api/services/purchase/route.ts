import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { lightningService } from "@/lib/lightning";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { serviceId, clientId } = await request.json();

    if (!serviceId || !clientId) {
      return NextResponse.json(
        { error: "Service ID and Client ID are required" },
        { status: 400 }
      );
    }

    // Get the service details with provider information
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
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Check if service is already purchased
    if (service.isPurchased) {
      return NextResponse.json(
        { error: "Service has already been purchased" },
        { status: 409 }
      );
    }

    // Get the client details
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

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

    // Calculate the total fee (initial backup fee)
    const totalFee = Number(service.initialBackupFee);

    // Generate Lightning Network invoice
    const invoice = await lightningService.createInvoice({
      amount: totalFee,
      description: `Service purchase: ${service.provider.username} - ${service.policyType}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    });

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Double-check that service is still available
      const currentService = await tx.service.findUnique({
        where: { id: serviceId },
      });

      if (!currentService || currentService.isPurchased) {
        throw new Error("Service has already been purchased");
      }

      // Create purchase record as PENDING (not active yet)
      const purchase = await tx.servicePurchase.create({
        data: {
          serviceId: serviceId,
          clientId: clientId,
          paymentHash: invoice.paymentHash,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          isActive: false, // Mark as pending until payment is confirmed
        },
      });

      return purchase;
    });

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
    console.error("Purchase error:", error);
    return NextResponse.json(
      { error: "Failed to purchase service" },
      { status: 500 }
    );
  }
}
