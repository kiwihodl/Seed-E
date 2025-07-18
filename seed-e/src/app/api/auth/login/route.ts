import { NextResponse } from "next/server";
import { PrismaClient, Provider, Client } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, userType = "provider" } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    let user: Provider | Client | null = null;

    if (userType === "provider") {
      user = await prisma.provider.findUnique({
        where: { username },
      });
    } else if (userType === "client") {
      user = await prisma.client.findUnique({
        where: { username },
      });
    } else {
      return NextResponse.json({ error: "Invalid user type" }, { status: 400 });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // TODO: Implement session management
    // TODO: Add 2FA check

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;
    return NextResponse.json({
      message: "Login successful",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
