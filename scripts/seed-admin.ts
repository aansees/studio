import { eq } from "drizzle-orm"

import { auth } from "../lib/auth"
import { db } from "../lib/db"
import { user } from "../lib/db/schema"
import { env } from "../lib/env"

async function seedAdmin() {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required")
  }

  const name = env.ADMIN_NAME ?? "Ancs Admin"

  const [existing] = await db
    .select({ id: user.id, role: user.role })
    .from(user)
    .where(eq(user.email, env.ADMIN_EMAIL))
    .limit(1)

  if (!existing) {
    await auth.api.signUpEmail({
      body: {
        name,
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD,
      },
    })
  }

  await db
    .update(user)
    .set({
      role: "admin",
      isActive: true,
      updatedAt: new Date(),
    })
    .where(eq(user.email, env.ADMIN_EMAIL))

  console.info(`Admin user is ready: ${env.ADMIN_EMAIL}`)
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
