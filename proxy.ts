import { NextResponse, type NextRequest } from "next/server"

import { auth } from "@/lib/auth"
import { BUILDER_ROLES, isUserRole, type UserRole } from "@/lib/constants/rbac"

const protectedPrefixes = [
  "/dashboard",
  "/projects",
  "/tasks",
  "/team",
  "/mytask",
  "/settings",
]

const roleProtectedPrefixes: Array<{
  prefix: string
  allowedRoles: UserRole[]
}> = [
  {
    prefix: "/projects/new",
    allowedRoles: ["client"],
  },
  {
    prefix: "/team",
    allowedRoles: ["admin"],
  },
  {
    prefix: "/mytask",
    allowedRoles: BUILDER_ROLES,
  },
]

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

function getRouteRule(pathname: string) {
  return roleProtectedPrefixes.find(
    (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`),
  )
}

function getClientProjectRedirect(pathname: string) {
  const restrictedMatch = pathname.match(
    /^\/projects\/([^/]+)\/(tasks|analytics|calendar|settings|details|plan)(?:\/.*)?$/,
  )

  if (!restrictedMatch) {
    return null
  }

  return `/projects/${restrictedMatch[1]}`
}

function getUserRole(value: unknown): UserRole {
  return typeof value === "string" && isUserRole(value) ? value : "client"
}

function getRoleHome(role: UserRole) {
  if (role === "admin") {
    return "/dashboard"
  }

  if (role === "developer") {
    return "/dashboard"
  }

  return "/dashboard"
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

  if (session?.user) {
    const userRole = getUserRole(session.user.role)
    const routeRule = getRouteRule(pathname)

    if (routeRule && !routeRule.allowedRoles.includes(userRole)) {
      return NextResponse.redirect(new URL(getRoleHome(userRole), request.url))
    }

    if (userRole === "client") {
      const redirectPath = getClientProjectRedirect(pathname)
      if (redirectPath) {
        return NextResponse.redirect(new URL(redirectPath, request.url))
      }
    }
  }

  if (session?.user && isLogin) {
    const userRole = getUserRole(session.user.role)
    return NextResponse.redirect(new URL(getRoleHome(userRole), request.url))
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
