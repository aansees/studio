import { notFound } from "next/navigation";

import { ProjectChatPanel } from "@/components/chat/project-chat-panel";
import { Frame, FramePanel } from "@/components/ui/frame";
import { requireSession } from "@/lib/session";
import {
  PROJECT_CHAT_PAGE_SIZE,
  buildProjectRoomId,
  canAccessProjectChat,
  getProjectChatMessages,
} from "@/lib/services/project-chat";
import { getProjectByIdForUser } from "@/lib/services/projects";

export default async function ProjectChatPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const { user } = await requireSession();
  const [project, allowed] = await Promise.all([
    getProjectByIdForUser(projectId, user),
    canAccessProjectChat(user, projectId),
  ]);

  if (!project || !allowed) {
    notFound();
  }

  const initialPage = await getProjectChatMessages(projectId, {
    limit: PROJECT_CHAT_PAGE_SIZE,
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <ProjectChatPanel
        projectId={projectId}
        roomId={buildProjectRoomId(projectId)}
        currentUserId={user.id}
        initialPage={initialPage}
        canPost={allowed}
      />
    </div>
  );
}
