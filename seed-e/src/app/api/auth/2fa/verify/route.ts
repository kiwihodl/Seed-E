import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { username, token } = await request.json();

    if (!username || !token) {
      return NextResponse.json(
        { error: "Username and token are required" },
        { status: 400 }
      );
    }

    // For now, just verify the token format (6 digits)
    const isValidToken = /^\d{6}$/.test(token);

    if (!isValidToken) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 }
      );
    }

    // Mock verification - in a real implementation, you would verify against the stored secret
    const verified = token === "123456"; // Mock verification

    return NextResponse.json({ verified });
  } catch (error) {
    console.error("Failed to verify 2FA token:", error);
    return NextResponse.json(
      { error: "Failed to verify 2FA token" },
      { status: 500 }
    );
  }
}
