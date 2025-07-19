import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    // For now, return empty array since authentication is not fully implemented
    // In a real implementation, you would get the provider from the session/token
    // and return their actual policies

    const mockPolicies: Array<{
      id: string;
      policyType: string;
      xpub: string;
      controlSignature: string;
      initialBackupFee: number;
      perSignatureFee: number;
      monthlyFee?: number;
      minTimeDelay: number;
      bolt12Offer: string;
      createdAt: string;
    }> = [
      // Empty array - no mock data for new users
    ];

    return NextResponse.json({ policies: mockPolicies });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch policies" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      policyType,
      xpub,
      controlSignature,
      initialBackupFee,
      perSignatureFee,
      monthlyFee,
      minTimeDelayDays,
      bolt12Offer,
    } = await request.json();

    // Validate required fields
    if (
      !policyType ||
      !xpub ||
      !controlSignature ||
      !initialBackupFee ||
      !perSignatureFee ||
      !minTimeDelayDays ||
      !bolt12Offer
    ) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Validate xpub format
    if (!xpub.startsWith("xpub") && !xpub.startsWith("zpub")) {
      return NextResponse.json(
        { error: "Extended public key must start with 'xpub' or 'zpub'" },
        { status: 400 }
      );
    }

    // Validate time delay (7-365 days)
    const timeDelayDays = parseInt(minTimeDelayDays);
    if (timeDelayDays < 7 || timeDelayDays > 365) {
      return NextResponse.json(
        { error: "Time delay must be between 7 and 365 days" },
        { status: 400 }
      );
    }

    // Validate fees
    if (parseInt(initialBackupFee) <= 0 || parseInt(perSignatureFee) <= 0) {
      return NextResponse.json(
        { error: "Fees must be greater than 0" },
        { status: 400 }
      );
    }

    // For now, just return success
    // In a real implementation, you would create the service in the database

    return NextResponse.json(
      {
        message: "Service created successfully",
        service: {
          id: Date.now().toString(),
          policyType,
          xpub: xpub.trim(),
          controlSignature: controlSignature.trim(),
          initialBackupFee: parseInt(initialBackupFee),
          perSignatureFee: parseInt(perSignatureFee),
          monthlyFee: monthlyFee ? parseInt(monthlyFee) : null,
          minTimeDelay: timeDelayDays * 24, // Convert days to hours for storage
          bolt12Offer: bolt12Offer.trim(),
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
