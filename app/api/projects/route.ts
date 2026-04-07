import { NextResponse } from "next/server"
import { z } from "zod"

import { PROJECT_PRIORITIES, PROJECT_STATUSES } from "@/lib/constants/domain"
import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"
import {
  createProjectAsAdmin,
  createProjectProposalAsClient,
  listProjectsForApi,
} from "@/lib/services/projects"

const createProjectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  priority: z.enum(PROJECT_PRIORITIES).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  projectLeadId: z.string().optional(),
  clientId: z.string().optional(),
  teamMemberIds: z.array(z.string()).optional(),
  notes: z.string().optional(),
  devLinks: z.string().optional(),
  credentials: z.string().optional(),
})

const createProposalSchema = z.object({
  name: z.string().min(2),
  notes: z.string().optional(),
  bookingId: z.string().min(1),
})

export async function GET() {
  try {
    const { user } = await requireApiSession()
    const projects = await listProjectsForApi(user)
    return NextResponse.json({ data: projects })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireApiSession(["admin", "client"])
    const rawBody = await request.json()
    const projectId =
      user.role === "admin"
        ? await createProjectAsAdmin(user, createProjectSchema.parse(rawBody))
        : await createProjectProposalAsClient(
            user,
            createProposalSchema.parse(rawBody),
          )

    return NextResponse.json({ projectId }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
