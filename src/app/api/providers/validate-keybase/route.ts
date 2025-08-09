import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function parseKeybase(input: string): { username: string } | null {
  try {
    const trimmed = input.trim();
    const urlMatch = trimmed.match(/^https?:\/\/keybase\.io\/(.+)$/i);
    const username = urlMatch ? urlMatch[1] : trimmed;
    const clean = username.replace(/^\//, "");
    if (!/^[A-Za-z0-9_]+$/.test(clean)) return null;
    if (clean.length === 0 || clean.length > 21) return null;
    return { username: clean };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { keybase } = (await req.json()) as { keybase: string };
    const parsed = parseKeybase(keybase || "");
    if (!parsed) {
      return NextResponse.json(
        {
          isValid: false,
          error:
            "Invalid Keybase username or URL (max 21 chars, letters/numbers/underscore).",
        },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const resp = await fetch(`https://keybase.io/${parsed.username}`, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!resp.ok) {
        return NextResponse.json(
          { isValid: false, error: "Keybase profile not found" },
          { status: 404 }
        );
      }
      const text = await resp.text();
      const appears = text
        .toLowerCase()
        .includes(parsed.username.toLowerCase());
      return NextResponse.json({ isValid: appears, username: parsed.username });
    } catch (e) {
      return NextResponse.json(
        { isValid: false, error: "Keybase validation failed (network)" },
        { status: 502 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { isValid: false, error: "Bad request" },
      { status: 400 }
    );
  }
}
