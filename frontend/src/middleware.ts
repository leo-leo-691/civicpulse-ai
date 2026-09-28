import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next-server/next" // next-server isn't a package usually, it's next/server
import { NextRequest } from "next/server"

// Correct imports
import { NextResponse as NextResp } from "next/server"

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role || "none"
    const path = req.nextUrl.pathname
    
    if (path.startsWith("/admin") && role !== "admin") {
      return NextResp.redirect(new URL("/api/auth/signin?error=AccessDenied", req.url))
    }
    
    if (path.startsWith("/dashboard") && !["policymaker", "admin"].includes(role as string)) {
      return NextResp.redirect(new URL("/api/auth/signin?error=AccessDenied", req.url))
    }
    
    return NextResp.next()
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
