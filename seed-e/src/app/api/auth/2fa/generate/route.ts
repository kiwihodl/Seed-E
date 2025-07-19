import { NextResponse } from "next/server";
import * as speakeasy from "speakeasy";
import * as qrcode from "qrcode";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Generate a secret for 2FA
    const secret = speakeasy.generateSecret({
      name: `Seed-E (${username})`,
    });

    // Generate QR code
    const qrCodeDataURL = await qrcode.toDataURL(secret.otpauth_url!);

    return NextResponse.json({
      secret: secret.base32,
      qrCodeDataURL,
    });
  } catch (error) {
    console.error("Failed to generate 2FA setup:", error);
    return NextResponse.json(
      { error: "Failed to generate 2FA setup" },
      { status: 500 }
    );
  }
}
