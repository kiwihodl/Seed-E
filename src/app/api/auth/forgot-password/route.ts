import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { masterKey } = await request.json();

    if (!masterKey) {
      return NextResponse.json(
        { error: "Master key is required" },
        { status: 400 }
      );
    }

    let user = null;
    let userType = null;
    const provider = await prisma.provider.findFirst({
      where: { recoveryKey: masterKey },
    });

    if (provider) {
      user = provider;
      userType = "provider";
    } else {
      const client = await prisma.client.findFirst({
        where: { recoveryKey: masterKey },
      });

      if (client) {
        user = client;
        userType = "client";
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid master key" },
        { status: 400 }
      );
    }

    if (userType === "provider") {
      await prisma.provider.update({
        where: { id: user.id },
        data: {
          twoFactorSecret: null,
        },
      });
    } else {
      await prisma.client.update({
        where: { id: user.id },
        data: {
          twoFactorSecret: null,
        },
      });
    }

    return NextResponse.json({
      message: "Account recovery initiated",
      username: user.username,
      userType: userType,
    });
  } catch (error) {
    console.error("Failed to initiate account recovery:", error);
    return NextResponse.json(
      { error: "Failed to initiate account recovery" },
      { status: 500 }
    );
  }
}
