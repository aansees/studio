import { NextResponse } from "next/server"
import { ZodError } from "zod"

import { AppError } from "@/lib/errors"
import { isProduction } from "@/lib/env"

export function errorResponse(error: unknown, fallbackMessage = "Request failed") {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Invalid request payload",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 422 },
    )
  }

  const status = inferStatus(error)
  const message = inferMessage(error, status, fallbackMessage)

  if (!isProduction && error instanceof Error && status >= 500) {
    console.error(error)
  }

  return NextResponse.json({ error: message }, { status })
}

function inferStatus(error: unknown): number {
  if (error instanceof AppError) {
    return error.status
  }

  if (typeof error === "object" && error !== null) {
    const statusValue = Reflect.get(error, "status")
    if (typeof statusValue === "number" && statusValue >= 400 && statusValue <= 599) {
      return statusValue
    }

    const statusCodeValue = Reflect.get(error, "statusCode")
    if (
      typeof statusCodeValue === "number" &&
      statusCodeValue >= 400 &&
      statusCodeValue <= 599
    ) {
      return statusCodeValue
    }

    const codeValue = Reflect.get(error, "code")
    if (typeof codeValue === "string") {
      const mapped = statusFromCode(codeValue)
      if (mapped) return mapped
    }

    if (typeof statusValue === "string") {
      const mapped = statusFromCode(statusValue)
      if (mapped) return mapped
    }
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    if (message.includes("unauthorized")) return 401
    if (message.includes("forbidden")) return 403
    if (message.includes("not found")) return 404
    if (message.includes("already exists")) return 409
    if (message.includes("insufficient role")) return 403
    if (message.includes("only admins")) return 403
  }

  return 400
}

function inferMessage(error: unknown, status: number, fallbackMessage: string) {
  if (error instanceof AppError) {
    return error.publicMessage
  }

  if (status >= 500) {
    return fallbackMessage
  }

  if (error instanceof Error) {
    if (isProduction && status === 400) {
      return fallbackMessage
    }
    return error.message
  }

  return fallbackMessage
}

function statusFromCode(code: string) {
  switch (code.toUpperCase()) {
    case "UNAUTHORIZED":
      return 401
    case "FORBIDDEN":
      return 403
    case "NOT_FOUND":
      return 404
    case "CONFLICT":
      return 409
    case "TOO_MANY_REQUESTS":
      return 429
    default:
      return null
  }
}
