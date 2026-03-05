import { NextResponse } from "next/server"

import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"
import { canAccessProject } from "@/lib/services/access-control"
import { getProjectAnalytics } from "@/lib/services/projects"
import { projectTaskSummary } from "@/lib/services/tasks"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params
    const { user } = await requireApiSession()
    const allowed = await canAccessProject(user, projectId)
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const [analytics, summary] = await Promise.all([
      getProjectAnalytics(projectId),
      projectTaskSummary(projectId),
    ])

    return NextResponse.json({
      data: {
        ...analytics,
        summary,
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
