import { db } from "@/lib/db"
import { notification } from "@/lib/db/schema"
import { sendAppMail } from "@/lib/email/mailer"
import type { NotificationEvent } from "@/lib/constants/domain"

type CreateNotificationArgs = {
  userId: string
  event: NotificationEvent
  title: string
  body?: string
  metadata?: Record<string, unknown>
  email?: {
    to: string
    subject: string
    preview: string
    intro: string
    lines?: string[]
    ctaLabel?: string
    ctaUrl?: string
  }
}

export async function createNotification({
  userId,
  event,
  title,
  body,
  metadata,
  email,
}: CreateNotificationArgs) {
  await db.insert(notification).values({
    userId,
    event,
    title,
    body,
    metadata: metadata ?? null,
  })

  if (email) {
    await sendAppMail({
      to: email.to,
      subject: email.subject,
      preview: email.preview,
      title,
      intro: email.intro,
      lines: email.lines,
      ctaLabel: email.ctaLabel,
      ctaUrl: email.ctaUrl,
    })
  }
}
