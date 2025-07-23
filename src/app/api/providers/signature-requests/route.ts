import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Return empty array for now - no pending requests
    const mockRequests: Array<{
      id: string;
      createdAt: string;
      psbtData: string;
      unlocksAt: string;
      clientUsername: string;
      servicePolicyType: string;
      perSignatureFee: string;
    }> = [];

    return NextResponse.json({ pendingRequests: mockRequests });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch signature requests" },
      { status: 500 }
    );
  }
}
