"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type AuthMode = "signin" | "signup"

export function LoginForm({
  nextPath,
  className,
  ...props
}: React.ComponentProps<"div"> & { nextPath?: string }) {
  const router = useRouter()
  const nextUrl = nextPath && nextPath.startsWith("/") ? nextPath : "/dashboard"

  const [mode, setMode] = useState<AuthMode>("signin")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function handleEmailAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)

    try {
      if (mode === "signin") {
        const result = await authClient.signIn.email({
          email,
          password,
          callbackURL: nextUrl,
        })
        if (result.error) {
          setError(result.error.message || "Unable to sign in")
          return
        }
      } else {
        const result = await authClient.signUp.email({
          name,
          email,
          password,
          callbackURL: nextUrl,
        })
        if (result.error) {
          setError(result.error.message || "Unable to create account")
          return
        }
      }
      router.push(nextUrl)
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication failed")
    } finally {
      setPending(false)
    }
  }

  async function handleSocial(provider: "google" | "github") {
    setPending(true)
    setError(null)
    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: nextUrl,
      })
      if (result?.error) {
        setError(result.error.message || "Social sign-in failed")
      }
    } catch (socialError) {
      setError(socialError instanceof Error ? socialError.message : "Social sign-in failed")
    } finally {
      setPending(false)
    }
  }

  async function handlePasskeySignIn() {
    setPending(true)
    setError(null)
    try {
      const result = await authClient.signIn.passkey({
        autoFill: true,
      })
      if (result.error) {
        setError(result.error.message || "Passkey sign-in failed")
        return
      }
      router.push(nextUrl)
      router.refresh()
    } catch (passkeyError) {
      setError(passkeyError instanceof Error ? passkeyError.message : "Passkey sign-in failed")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </CardTitle>
          <CardDescription>
            One login page for Admin, Developer, and Client access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailAuth}>
            <FieldGroup>
              <Field>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => handleSocial("google")}
                  disabled={pending}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Continue with Google
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => handleSocial("github")}
                  disabled={pending}
                >
                  Continue with GitHub
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={handlePasskeySignIn}
                  disabled={pending}
                >
                  Sign in with Passkey
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>
              {mode === "signup" ? (
                <Field>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    required
                  />
                </Field>
              ) : null}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="m@example.com"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </Field>
              {error ? (
                <FieldDescription className="text-destructive">{error}</FieldDescription>
              ) : null}
              <Field>
                <Button type="submit" disabled={pending}>
                  {pending
                    ? "Please wait..."
                    : mode === "signin"
                      ? "Login"
                      : "Create account"}
                </Button>
                <FieldDescription className="text-center">
                  {mode === "signin" ? (
                    <>
                      Don&apos;t have an account?{" "}
                      <button
                        type="button"
                        className="underline-offset-4 hover:underline"
                        onClick={() => setMode("signup")}
                      >
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        className="underline-offset-4 hover:underline"
                        onClick={() => setMode("signin")}
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By continuing, you agree to our Terms and Privacy Policy.
      </FieldDescription>
    </div>
  )
}
