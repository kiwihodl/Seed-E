import { NextRequest, NextResponse } from "next/server";
import { lightningService } from "@/lib/lightning";

export async function POST(request: NextRequest) {
  try {
    const { lightningAddress } = await request.json();

    if (!lightningAddress) {
      return NextResponse.json(
        { error: "Lightning address is required" },
        { status: 400 }
      );
    }

    console.log("🔍 Validating Lightning address:", lightningAddress);

    // Validate the Lightning address and check LNURL verify support
    const validationResult = await lightningService.validateLightningAddress(
      lightningAddress
    );

    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          error: validationResult.error,
          supportsLnurlVerify: false,
        },
        { status: 400 }
      );
    }

    // Check if the Lightning address supports LNURL verify
    const supportsLnurlVerify = validationResult.supportsLnurlVerify || false;

    console.log("✅ Lightning address validation result:", {
      address: lightningAddress,
      isValid: validationResult.isValid,
      supportsLnurlVerify,
    });

    return NextResponse.json({
      isValid: validationResult.isValid,
      supportsLnurlVerify,
      message: supportsLnurlVerify
        ? "Lightning address is valid and supports LNURL verify"
        : "Lightning address is valid but doesn't support LNURL verify",
    });
  } catch (error) {
    console.error("❌ Lightning address validation error:", error);
    return NextResponse.json(
      {
        error: "Failed to validate Lightning address",
        supportsLnurlVerify: false,
      },
      { status: 500 }
    );
  }
}
