import { NextRequest, NextResponse } from "next/server";

// In-memory storage for policies (in a real app, this would be in a database)
const policiesStorage: Array<{
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
}> = [];

export async function GET() {
  try {
    // Return the stored policies
    return NextResponse.json({ policies: policiesStorage });
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

    // Create the new policy
    const newPolicy = {
      id: Date.now().toString(),
      policyType,
      xpub: xpub.trim(),
      controlSignature: controlSignature.trim(),
      initialBackupFee: parseInt(initialBackupFee),
      perSignatureFee: parseInt(perSignatureFee),
      monthlyFee: monthlyFee ? parseInt(monthlyFee) : undefined,
      minTimeDelay: timeDelayDays * 24, // Convert days to hours for storage
      bolt12Offer: bolt12Offer.trim(),
      createdAt: new Date().toISOString(),
    };

    // Add to storage
    policiesStorage.push(newPolicy);

    return NextResponse.json(
      {
        message: "Service created successfully",
        service: newPolicy,
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
