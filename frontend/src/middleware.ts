import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role || "none"
    const path = req.nextUrl.pathname
    
    if (path.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/login?error=AccessDenied", req.url))
    }
    
    if (path.startsWith("/dashboard") && !["policymaker", "admin"].includes(role as string)) {
      return NextResponse.redirect(new URL("/login?error=AccessDenied", req.url))
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
