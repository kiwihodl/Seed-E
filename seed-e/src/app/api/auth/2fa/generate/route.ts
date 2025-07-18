import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import * as speakeasy from "speakeasy";
import * as qrcode from "qrcode";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, userType = "provider" } = body;

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    let user:
      | Awaited<ReturnType<typeof prisma.provider.findUnique>>
      | Awaited<ReturnType<typeof prisma.client.findUnique>>
      | null = null;
    if (userType === "provider") {
      user = await prisma.provider.findUnique({ where: { username } });
    } else if (userType === "client") {
      user = await prisma.client.findUnique({ where: { username } });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const secret = speakeasy.generateSecret({
      name: `Seed-E (${user.username})`,
    });

    // TODO - encrypt this secret before storing it.
    // For simplicity, we are storing it as plaintext for now.
    if (userType === "provider") {
      await prisma.provider.update({
        where: { id: user.id },
        data: { twoFactorSecret: secret.base32 },
      });
    } else {
      await prisma.client.update({
        where: { id: user.id },
        data: { twoFactorSecret: secret.base32 },
      });
    }

    const qrCodeDataURL = await qrcode.toDataURL(secret.otpauth_url!);

    return NextResponse.json({ qrCodeDataURL });
  } catch (error) {
    console.error("2FA setup generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate 2FA setup" },
      { status: 500 }
    );
  }
}
