import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Generate a random recovery key
    const recoveryKey =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    return NextResponse.json({ recoveryKey });
  } catch (error) {
    console.error("Failed to generate recovery key:", error);
    return NextResponse.json(
      { error: "Failed to generate recovery key" },
      { status: 500 }
    );
  }
}
