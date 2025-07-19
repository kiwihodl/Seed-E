import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    // Mock data for now
    const mockRequests: Array<{
      id: string;
      createdAt: string;
      unsignedPsbt: string;
      unlocksAt: string;
      clientUsername: string;
      servicePolicyType: string;
      perSignatureFee: string;
    }> = [
      {
        id: "1",
        createdAt: new Date().toISOString(),
        unsignedPsbt:
          "cHNidP8BAF4CAAAAAYGoktqXyJZiSqE9C+vnA7kFZHyprLm1iIhM5Y1aXzKNAAAAAAAA",
        unlocksAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        clientUsername: "testuser",
        servicePolicyType: "P2TR",
        perSignatureFee: "1000",
      },
    ];

    return NextResponse.json({ pendingRequests: mockRequests });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch signature requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { signatureRequestId, signedPsbt } = body;

    if (!signatureRequestId || !signedPsbt) {
      return NextResponse.json(
        { error: "Signature request ID and signed PSBT are required" },
        { status: 400 }
      );
    }

    // For now, just return success
    // In a real implementation, you would update the signature request in the database

    return NextResponse.json({
      message: "PSBT signed successfully",
      signatureRequestId,
    });
  } catch (error) {
    console.error("Failed to submit signed PSBT:", error);
    return NextResponse.json(
      { error: "Failed to submit signed PSBT" },
      { status: 500 }
    );
  }
}
