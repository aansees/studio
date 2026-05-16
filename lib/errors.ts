export class AppError extends Error {
  readonly status: number
  readonly code: string
  readonly publicMessage: string

  constructor(status: number, code: string, publicMessage: string) {
    super(publicMessage)
    this.name = "AppError"
    this.status = status
    this.code = code
    this.publicMessage = publicMessage
  }
}

export function badRequest(message: string, code = "bad_request") {
  return new AppError(400, code, message)
}

export function unauthorized(message = "Unauthorized", code = "unauthorized") {
  return new AppError(401, code, message)
}

export function forbidden(message = "Forbidden", code = "forbidden") {
  return new AppError(403, code, message)
}

export function notFound(message: string, code = "not_found") {
  return new AppError(404, code, message)
}

export function conflict(message: string, code = "conflict") {
  return new AppError(409, code, message)
}

export function tooManyRequests(
  message = "Too many requests. Please wait and try again.",
  code = "rate_limited",
) {
  return new AppError(429, code, message)
}
