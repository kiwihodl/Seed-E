import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import * as speakeasy from "speakeasy";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, userType = "provider", token } = body;

    if (!username || !token) {
      return NextResponse.json(
        { error: "Username and token are required" },
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

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: "User not found or 2FA not initiated" },
        { status: 404 }
      );
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: token,
    });

    if (verified) {
      // Should I have `twoFactorEnabled` flag to set to true here?
      // For now, successfully verifying means it's enabled.
      return NextResponse.json({ verified: true });
    } else {
      return NextResponse.json({ verified: false }, { status: 401 });
    }
  } catch (error) {
    console.error("2FA verification failed:", error);
    return NextResponse.json(
      { error: "Failed to verify 2FA" },
      { status: 500 }
    );
  }
}
