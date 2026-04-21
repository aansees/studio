import { Resend } from "resend"

import { env } from "@/lib/env"
import { AppEmailTemplate } from "@/lib/email/template"

type SendAppMailArgs = {
  to: string
  subject: string
  preview: string
  title: string
  intro: string
  lines?: string[]
  ctaLabel?: string
  ctaUrl?: string
}

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

export async function sendAppMail({
  to,
  subject,
  preview,
  title,
  intro,
  lines,
  ctaLabel,
  ctaUrl,
}: SendAppMailArgs) {
  if (!resend || !env.RESEND_FROM) {
    console.info("Resend is not configured; email skipped", { to, subject, preview })
    return
  }

  const { error } = await resend.emails.send({
    from: env.RESEND_FROM,
    to,
    subject,
    react: AppEmailTemplate({
      preview,
      title,
      intro,
      lines,
      ctaLabel,
      ctaUrl,
    }),
  })

  if (error) {
    throw new Error(`Failed to send email via Resend: ${error.message}`)
  }
}
