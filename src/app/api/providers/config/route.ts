import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get("providerId");
    if (!providerId)
      return NextResponse.json(
        { error: "providerId is required" },
        { status: 400 }
      );
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
    });
    if (!provider)
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    return NextResponse.json({
      keybaseHandle: provider.keybaseHandle || null,
      shippingPolicyDefault: provider.shippingPolicyDefault || null,
      materialsCatalog: provider.materialsCatalog || null,
    });
  } catch (err) {
    console.error("Get provider config error", err);
    return NextResponse.json(
      { error: "Failed to fetch provider config" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      providerId,
      username,
      keybaseHandle,
      shippingPolicyDefault,
      materialsCatalog,
    } = body || {};
    if (!providerId) {
      return NextResponse.json(
        { error: "providerId is required" },
        { status: 400 }
      );
    }
    const updated = await prisma.provider.update({
      where: { id: providerId },
      data: {
        ...(username ? { username } : {}),
        ...(keybaseHandle !== undefined ? { keybaseHandle } : {}),
        shippingPolicyDefault: shippingPolicyDefault ?? undefined,
        materialsCatalog: materialsCatalog ?? undefined,
      },
    });
    return NextResponse.json({ success: true, providerId: updated.id });
  } catch (err) {
    console.error("Update provider config error", err);
    return NextResponse.json(
      { error: "Failed to update provider config" },
      { status: 500 }
    );
  }
}
