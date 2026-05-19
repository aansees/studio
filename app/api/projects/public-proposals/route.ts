import { NextResponse } from "next/server"
import { z } from "zod"

import { publicBookingCreateSchema } from "@/lib/bookings/schemas"
import { errorResponse } from "@/lib/http"
import {
  getRequestIp,
  requireApiRateLimit,
} from "@/lib/security/api-rate-limit"
import { createPublicProjectProposal } from "@/lib/services/projects"

const createPublicProposalSchema = z.object({
  name: z.string().trim().min(2).max(191),
  notes: z.string().optional(),
  bookingRequest: publicBookingCreateSchema,
})

export async function POST(request: Request) {
  try {
    const body = createPublicProposalSchema.parse(await request.json())
    await requireApiRateLimit({
      key: `projects:public-proposal:${getRequestIp(request)}:${body.bookingRequest.attendeeEmail.toLowerCase()}`,
      limit: 3,
      windowSeconds: 15 * 60,
    })
    const projectId = await createPublicProjectProposal(body)
    return NextResponse.json({ projectId }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
