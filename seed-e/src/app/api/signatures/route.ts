import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { unsignedPsbt, clientUsername, serviceId } = body;

    if (!unsignedPsbt || !clientUsername || !serviceId) {
      return NextResponse.json(
        {
          error: "Unsigned PSBT, client username, and service ID are required",
        },
        { status: 400 }
      );
    }

    // For now, just return success
    // In a real implementation, you would create a signature request in the database

    return NextResponse.json({
      message: "Signature request created successfully",
      signatureRequestId: Date.now().toString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create signature request" },
      { status: 500 }
    );
  }
}
