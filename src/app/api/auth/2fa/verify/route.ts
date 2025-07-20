import { NextRequest, NextResponse } from "next/server";
import * as speakeasy from "speakeasy";

export async function POST(request: NextRequest) {
  try {
    const { username, token, secret } = await request.json();

    if (!username || !token) {
      return NextResponse.json(
        { error: "Username and token are required" },
        { status: 400 }
      );
    }

    // Verify the token format (6 digits)
    const isValidToken = /^\d{6}$/.test(token);

    if (!isValidToken) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 }
      );
    }

    // Use the actual secret passed from the frontend
    if (!secret) {
      return NextResponse.json(
        { error: "Secret is required for verification" },
        { status: 400 }
      );
    }

    // Verify the TOTP token using the actual secret
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 1, // Allow 1 time step in either direction for clock skew
    });

    return NextResponse.json({ verified });
  } catch (error) {
    console.error("Failed to verify 2FA token:", error);
    return NextResponse.json(
      { error: "Failed to verify 2FA token" },
      { status: 500 }
    );
  }
}
