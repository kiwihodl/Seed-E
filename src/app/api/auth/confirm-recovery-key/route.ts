import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { recoveryKey, username, userType } = await request.json();

    if (!recoveryKey || !username || !userType) {
      return NextResponse.json(
        { error: "Recovery key, username, and user type are required" },
        { status: 400 }
      );
    }

    try {
      if (userType === "provider") {
        await prisma.provider.update({
          where: { username },
          data: { recoveryKey },
        });
      } else if (userType === "client") {
        await prisma.client.update({
          where: { username },
          data: { recoveryKey },
        });
      } else {
        return NextResponse.json(
          { error: "Invalid user type" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        message: "Recovery key confirmed and saved successfully",
      });
    } catch (dbError) {
      console.error("Failed to save recovery key to database:", dbError);
      return NextResponse.json(
        { error: "Failed to save recovery key" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Recovery key confirmation error:", error);
    return NextResponse.json(
      { error: "Failed to confirm recovery key" },
      { status: 500 }
    );
  }
}
