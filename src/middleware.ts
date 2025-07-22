import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/client-dashboard") ||
    pathname.startsWith("/provider-dashboard")
  ) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/client-dashboard/:path*", "/provider-dashboard/:path*"],
};
