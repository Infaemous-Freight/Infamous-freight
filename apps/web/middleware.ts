import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // Temporarily allow all /dashboard requests through without checking for a
  // session cookie. A proper server-side session should be wired up before
  // re-enabling auth gating here.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
