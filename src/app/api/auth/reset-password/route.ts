import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { newPassword, username, userType } = await request.json();

    // Validate required fields
    if (!newPassword || !username || !userType) {
      return NextResponse.json(
        { error: "New password, username, and user type are required" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    if (userType === "provider") {
      await prisma.provider.update({
        where: { username },
        data: { passwordHash: hashedPassword },
      });
    } else if (userType === "client") {
      await prisma.client.update({
        where: { username },
        data: { passwordHash: hashedPassword },
      });
    } else {
      return NextResponse.json({ error: "Invalid user type" }, { status: 400 });
    }

    let userInfo;
    if (userType === "provider") {
      userInfo = await prisma.provider.findUnique({
        where: { username },
        select: { id: true, username: true },
      });
    } else {
      userInfo = await prisma.client.findUnique({
        where: { username },
        select: { id: true, username: true },
      });
    }

    return NextResponse.json({
      message: "Password updated successfully",
      user: {
        id: userInfo?.id,
        username: userInfo?.username,
        userType,
      },
    });
  } catch (error) {
    console.error("Failed to reset password:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
