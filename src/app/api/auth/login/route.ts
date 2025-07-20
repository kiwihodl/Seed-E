import { NextResponse } from "next/server";
import { PrismaClient, Provider, Client } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as speakeasy from "speakeasy";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, userType = "provider", totpToken } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    let user: Provider | Client | null = null;

    if (userType === "provider") {
      user = await prisma.provider.findUnique({
        where: { username },
      });
    } else if (userType === "client") {
      user = await prisma.client.findUnique({
        where: { username },
      });
    } else {
      return NextResponse.json({ error: "Invalid user type" }, { status: 400 });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if user has 2FA enabled
    if (user.twoFactorSecret) {
      if (!totpToken) {
        return NextResponse.json(
          {
            error: "2FA token required",
            requires2FA: true,
            message: "Please enter your 2FA code",
          },
          { status: 401 }
        );
      }

      // Verify TOTP token
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: totpToken,
        window: 1, // Allow 1 time step in either direction for clock skew
      });

      if (!verified) {
        return NextResponse.json(
          { error: "Invalid 2FA token" },
          { status: 401 }
        );
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;
    return NextResponse.json({
      message: "Login successful",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
