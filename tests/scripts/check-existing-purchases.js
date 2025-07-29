#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const { config } = require("dotenv");

config();

const prisma = new PrismaClient();

async function checkExistingPurchases() {
  console.log("🔍 Checking existing purchases...");

  try {
    const serviceId = "cmdc0kpux00028znrcdc4b7q4";
    const clientId = "cmdbuoxqq00008zqtlrrl2xzj";

    // Check for existing purchase
    const existingPurchase = await prisma.servicePurchase.findUnique({
      where: {
        clientId_serviceId: {
          clientId: clientId,
          serviceId: serviceId,
        },
      },
    });

    if (existingPurchase) {
      console.log("❌ Existing purchase found:", existingPurchase);
    } else {
      console.log("✅ No existing purchase found");
    }

    // Check for pending purchases
    const pendingPurchases = await prisma.servicePurchase.findMany({
      where: {
        serviceId: serviceId,
        isActive: false, // Only pending purchases
      },
    });

    console.log(
      `📊 Found ${pendingPurchases.length} pending purchases for this service`
    );
    pendingPurchases.forEach((purchase, index) => {
      console.log(
        `  ${index + 1}. ID: ${purchase.id}, Client: ${
          purchase.clientId
        }, Active: ${purchase.isActive}`
      );
    });
  } catch (error) {
    console.error("❌ Error checking purchases:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingPurchases();
