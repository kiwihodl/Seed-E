import { NextRequest, NextResponse } from "next/server";
import { authenticator } from "otplib";

export async function POST(request: NextRequest) {
  try {
    const { secret, code } = await request.json();

    if (!secret || !code) {
      return NextResponse.json(
        { error: "Secret and code are required" },
        { status: 400 }
      );
    }

    // Verify the TOTP code
    const isValid = authenticator.verify({
      token: code,
      secret: secret,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // TODO: Save the 2FA secret to the user's account in the database
    // For now, we'll just return success

    return NextResponse.json({
      message: "2FA setup completed successfully",
    });
  } catch (error) {
    console.error("2FA verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify 2FA code" },
      { status: 500 }
    );
  }
}
