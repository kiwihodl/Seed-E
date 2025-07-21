import { NextRequest, NextResponse } from "next/server";
import * as speakeasy from "speakeasy";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { username, token, secret, userType } = await request.json();

    if (!username || !token) {
      return NextResponse.json(
        { error: "Username and token are required" },
        { status: 400 }
      );
    }

    const isValidToken = /^\d{6}$/.test(token);

    if (!isValidToken) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 }
      );
    }

    if (!secret) {
      return NextResponse.json(
        { error: "Secret is required for verification" },
        { status: 400 }
      );
    }

    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 1, 
    });

    if (!verified) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    try {
      if (userType === "provider") {
        const provider = await prisma.provider.findUnique({
          where: { username },
        });

        if (!provider) {
          console.error(`Provider not found for username: ${username}`);
          return NextResponse.json(
            { error: "Provider not found" },
            { status: 404 }
          );
        }

        await prisma.provider.update({
          where: { username },
          data: { twoFactorSecret: secret },
        });
      } else if (userType === "client") {
        const client = await prisma.client.findUnique({
          where: { username },
        });

        if (!client) {
          console.error(`Client not found for username: ${username}`);
          return NextResponse.json(
            { error: "Client not found" },
            { status: 404 }
          );
        }

        await prisma.client.update({
          where: { username },
          data: { twoFactorSecret: secret },
        });
      } else {
        // Try both provider and client
        const provider = await prisma.provider.findUnique({
          where: { username },
        });

        if (provider) {
          await prisma.provider.update({
            where: { username },
            data: { twoFactorSecret: secret },
          });
        } else {
          const client = await prisma.client.findUnique({
            where: { username },
          });

          if (client) {
            await prisma.client.update({
              where: { username },
              data: { twoFactorSecret: secret },
            });
          } else {
            console.error(`No user found for username: ${username}`);
            return NextResponse.json(
              { error: "User not found" },
              { status: 404 }
            );
          }
        }
      }

      return NextResponse.json({ verified: true });
    } catch (dbError) {
      console.error("Failed to save 2FA secret to database:", dbError);
      return NextResponse.json(
        { error: "Failed to save 2FA setup" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Failed to verify 2FA token:", error);
    return NextResponse.json(
      { error: "Failed to verify 2FA token" },
      { status: 500 }
    );
  }
}
