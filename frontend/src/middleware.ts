import { NextRequest, NextResponse } from "next/server";

export default function middleware(req: NextRequest) {
  if (
    !req.cookies.get("access_token") &&
    req.nextUrl.pathname !== "/" &&
    !req.nextUrl.pathname.startsWith("/certificate")
  ) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin).toString());
  } else if (req.cookies.get("access_token") && req.nextUrl.pathname === "/") {
    return NextResponse.redirect(
      new URL("/questions", req.nextUrl.origin).toString(),
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|icon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
