import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/register"]
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))
  const isAuthApi = pathname.startsWith("/api/auth")

  // Allow public routes and auth API
  if (isPublicRoute || isAuthApi) {
    // Redirect logged-in users away from login/register
    if (isLoggedIn && isPublicRoute) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
    }
    return NextResponse.next()
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
}
