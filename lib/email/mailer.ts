import nodemailer from "nodemailer"
import { render } from "@react-email/render"

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

const hasSmtpConfig =
  Boolean(env.SMTP_HOST) &&
  Boolean(env.SMTP_PORT) &&
  Boolean(env.SMTP_USER) &&
  Boolean(env.SMTP_PASS) &&
  Boolean(env.SMTP_FROM)

const transporter =
  hasSmtpConfig && env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      })
    : null

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
  if (!transporter || !env.SMTP_FROM) {
    console.info("SMTP is not configured; email skipped", { to, subject, preview })
    return
  }

  const html = await render(
    AppEmailTemplate({
      preview,
      title,
      intro,
      lines,
      ctaLabel,
      ctaUrl,
    }),
  )

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html,
  })
}
