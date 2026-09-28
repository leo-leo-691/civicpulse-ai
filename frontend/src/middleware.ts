import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role || "none"
    const path = req.nextUrl.pathname
    
    if (path.startsWith("/admin") && role !== "admin") {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("error", "AccessDenied");
      loginUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(loginUrl);
    }
    
    if (path.startsWith("/dashboard") && !["policymaker", "admin"].includes(role as string)) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("error", "AccessDenied");
      loginUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(loginUrl);
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"]
}
