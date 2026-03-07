"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  ProjectRichTextEditor,
  ProjectRichTextViewer,
} from "@/components/layout/dashboard/project-rich-text";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function ReadOnlyNotice({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed bg-muted/30 px-4 py-5">
      <div className="space-y-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
    </div>
  );
}

export function ProjectDocsWorkspace({
  projectId,
  canEdit,
  canViewInternalDocs,
  initialNotes,
  initialDevLinks,
  initialCredentials,
}: {
  projectId: string;
  canEdit: boolean;
  canViewInternalDocs: boolean;
  initialNotes: string;
  initialDevLinks: string;
  initialCredentials: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [notes, setNotes] = useState(initialNotes);
  const [devLinks, setDevLinks] = useState(initialDevLinks);
  const [credentials, setCredentials] = useState(initialCredentials);

  const hasChanges = useMemo(
    () =>
      notes !== initialNotes ||
      devLinks !== initialDevLinks ||
      credentials !== initialCredentials,
    [
      credentials,
      devLinks,
      initialCredentials,
      initialDevLinks,
      initialNotes,
      notes,
    ],
  );

  async function saveWorkspace() {
    setPending(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          notes: notes || undefined,
          devLinks: devLinks || undefined,
          credentials: credentials || undefined,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to update project workspace");
      }

      toast.success("Project workspace updated");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to update project workspace";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Tabs
      defaultValue="plan"
      className="flex h-full min-h-0 flex-1 flex-col gap-4 overflow-hidden"
    >
      <div className="shrink-0">

        <div className="flex items-center justify-between pt-4">
          <TabsList>
            <TabsTrigger value="plan">Plan</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
          </TabsList>

          {canEdit ? (
            <Button
              onClick={() => void saveWorkspace()}
              disabled={pending || !hasChanges}
            >
              {pending ? "Saving..." : hasChanges ? "Save workspace" : "Saved"}
            </Button>
          ) : null}
        </div>
      </div>

      <TabsContent value="plan" className="min-h-0 flex-1 overflow-hidden">
        {canEdit ? (
          <ProjectRichTextEditor
            value={notes}
            onChange={setNotes}
            variant="workspace"
            className="flex h-full min-h-0 w-full flex-1"
          />
        ) : (
          <ProjectRichTextViewer
            value={notes}
            emptyMessage="No project plan added yet."
            variant="workspace"
            className="flex h-full min-h-0 w-full flex-1"
          />
        )}
      </TabsContent>

      <TabsContent value="resources" className="min-h-0 flex-1 overflow-hidden">
        {canViewInternalDocs ? (
          canEdit ? (
            <ProjectRichTextEditor
              value={devLinks}
              onChange={setDevLinks}
              variant="workspace"
              className="flex h-full min-h-0 w-full flex-1"
            />
          ) : (
            <ProjectRichTextViewer
              value={devLinks}
              emptyMessage="No resources or dev links added yet."
              variant="workspace"
              className="flex h-full min-h-0 w-full flex-1"
            />
          )
        ) : (
          <ReadOnlyNotice
            title="Internal resources are hidden"
            description="Client access does not include internal engineering links or delivery references."
          />
        )}
      </TabsContent>

      <TabsContent
        value="credentials"
        className="min-h-0 flex-1 overflow-hidden"
      >
        {canViewInternalDocs ? (
          canEdit ? (
            <ProjectRichTextEditor
              value={credentials}
              onChange={setCredentials}
              variant="workspace"
              className="flex h-full min-h-0 w-full flex-1"
            />
          ) : (
            <ProjectRichTextViewer
              value={credentials}
              emptyMessage="No credential notes added yet."
              variant="workspace"
              className="flex h-full min-h-0 w-full flex-1"
            />
          )
        ) : (
          <ReadOnlyNotice
            title="Credentials stay internal"
            description="Client accounts can review project plan context, but credential notes remain restricted to the internal team."
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
