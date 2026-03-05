import { NextResponse, type NextRequest } from "next/server"

import { auth } from "@/lib/auth"

const protectedPrefixes = [
  "/dashboard",
  "/projects",
  "/tasks",
  "/team",
  "/mytask",
  "/settings",
]

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  const isLogin = pathname === "/login"
  const isProtected = isProtectedPath(pathname)
  if (!isLogin && !isProtected) {
    return NextResponse.next()
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  })

  if (!session?.user && isProtected) {
    const callback = encodeURIComponent(`${pathname}${search}`)
    return NextResponse.redirect(new URL(`/login?next=${callback}`, request.url))
  }

  if (session?.user && isLogin) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/projects/:path*",
    "/tasks/:path*",
    "/team/:path*",
    "/mytask/:path*",
    "/settings/:path*",
  ],
}
