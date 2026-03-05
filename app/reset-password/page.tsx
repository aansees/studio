"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { toast } from "sonner"

import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type AuthResult = {
  error?: {
    message?: string
  } | null
}

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [newPassword, setNewPassword] = useState("")
  const [pending, setPending] = useState(false)

  async function submitReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    try {
      if (!token) {
        throw new Error("Reset token is missing in the URL.")
      }

      const result = (await authClient.$fetch("/reset-password", {
        method: "POST",
        body: {
          token,
          newPassword,
        },
        throw: false,
      })) as AuthResult

      if (result?.error) {
        throw new Error(result.error.message || "Unable to reset password")
      }

      setNewPassword("")
      toast.success("Password reset successful")
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Unable to reset password"
      toast.error(message)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Set a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitReset}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="reset-new-password">New Password</FieldLabel>
                <Input
                  id="reset-new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </Field>
              <Button type="submit" disabled={pending}>
                {pending ? "Resetting..." : "Reset Password"}
              </Button>
              <FieldDescription>
                <Link href="/login" className="underline-offset-4 hover:underline">
                  Back to login
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-svh items-center justify-center bg-muted p-6" />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
