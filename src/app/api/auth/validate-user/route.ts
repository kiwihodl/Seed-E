import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { username, expectedUserType } = await request.json();

    if (!username || !expectedUserType) {
      return NextResponse.json(
        { error: "Username and expectedUserType are required" },
        { status: 400 }
      );
    }

    let isValid = false;

    if (expectedUserType === "client") {
      const client = await prisma.client.findUnique({
        where: { username },
      });
      isValid = !!client;
    } else if (expectedUserType === "provider") {
      const provider = await prisma.provider.findUnique({
        where: { username },
      });
      isValid = !!provider;
    }

    return NextResponse.json({ isValid });
  } catch (error) {
    console.error("Error validating user type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
