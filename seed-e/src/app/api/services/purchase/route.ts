import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

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

    // TODO: Generate Lightning Network invoice
    // For now, return a mock invoice
    const mockInvoice = {
      paymentRequest: "lnbc" + Math.random().toString(36).substring(2, 15),
      amount: totalFee,
      description: `Service purchase: ${service.provider.username} - ${service.policyType}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
    };

    // Create a purchase record and mark service as purchased
    const [purchase] = await prisma.$transaction([
      prisma.servicePurchase.create({
        data: {
          serviceId: serviceId,
          clientId: clientId,
          paymentHash: mockInvoice.paymentRequest, // Using paymentRequest as paymentHash for now
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          isActive: false, // Will be activated after payment confirmation
        },
      }),
      prisma.service.update({
        where: { id: serviceId },
        data: { isPurchased: true },
      }),
    ]);

    return NextResponse.json({
      message: "Purchase initiated",
      purchase: {
        id: purchase.id,
        invoice: mockInvoice,
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
      { error: "Failed to initiate purchase" },
      { status: 500 }
    );
  }
}
