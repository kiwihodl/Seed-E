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

    // For now, we'll use a mock secret since we don't have session management
    // In a real implementation, you would retrieve the secret from the database based on the username
    const mockSecret = "KVEEUQ26MI7H2KCYFJNVALBVLB3WONK6KFBCSLSAFY3GKQTGHZRA"; // This should come from the database

    // Verify the TOTP token
    const verified = speakeasy.totp.verify({
      secret: mockSecret,
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
