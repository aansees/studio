import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { z } from "zod"

import { db } from "@/lib/db"
import { user as userTable } from "@/lib/db/schema"
import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(191),
  image: z.string().trim().url().nullish(),
  username: z.string().trim().max(191).nullish(),
  bio: z.string().trim().nullish(),
  phone: z.string().trim().max(32).nullish(),
  timezone: z.string().trim().min(1).max(64),
  bookingPageTitle: z.string().trim().max(191).nullish(),
  bookingPageDescription: z.string().trim().nullish(),
})

export async function GET() {
  try {
    const { user } = await requireApiSession()
    return NextResponse.json({ user })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const { user } = await requireApiSession()
    const body = updateProfileSchema.parse(await request.json())

    await db
      .update(userTable)
      .set({
        name: body.name,
        image: body.image || null,
        username: body.username || null,
        bio: body.bio || null,
        phone: body.phone || null,
        timezone: body.timezone,
        bookingPageTitle:
          user.role === "admin" ? body.bookingPageTitle || null : undefined,
        bookingPageDescription:
          user.role === "admin"
            ? body.bookingPageDescription || null
            : undefined,
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, user.id))

    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
