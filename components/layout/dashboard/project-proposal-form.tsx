"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileTextIcon, Sparkle } from "lucide-react";
import { toast } from "sonner";

import { ProjectRichTextEditor } from "@/components/layout/dashboard/project-rich-text";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function ProjectProposalForm() {
  const router = useRouter();
  const editorHostRef = useRef<HTMLDivElement | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);

  const canSubmit = useMemo(() => title.trim().length >= 2, [title]);

  const focusEditor = useCallback(() => {
    const editable = editorHostRef.current?.querySelector<HTMLElement>(
      '[contenteditable="true"], .ProseMirror',
    );

    if (!editable) {
      return;
    }

    requestAnimationFrame(() => {
      editable.focus();

      const selection = window.getSelection();
      if (!selection) {
        return;
      }

      const range = document.createRange();
      range.selectNodeContents(editable);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    });
  }, []);

  async function submitProposal() {
    if (!canSubmit || pending) {
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: title.trim(),
          notes: notes.trim() || undefined,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to submit proposal");
      }

      toast.success("Proposal submitted");
      router.push(`/projects/${payload.projectId}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to submit proposal",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-6">
      <Button
        onClick={() => void submitProposal()}
        disabled={!canSubmit || pending}
        className="absolute top-2 right-2"
      >
        <Sparkle className="h-4 w-4 rounded-full bg-white fill-primary text-white" />
        {pending ? "Submitting..." : "Submit proposal"}
      </Button>

      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileTextIcon className="h-4 w-4" />
          Proposal document
        </div>

        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") {
              return;
            }

            event.preventDefault();
            focusEditor();
          }}
          placeholder="Title"
          minLength={2}
          className="mt-2 h-auto appearance-none border-0 bg-transparent px-0 text-4xl font-semibold tracking-tight shadow-none outline-none ring-0 focus:border-transparent focus:outline-none focus:ring-0 focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0 md:text-5xl"
        />

        <Separator className="my-3" />

        <div ref={editorHostRef}>
          <ProjectRichTextEditor
            value={notes}
            onChange={setNotes}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
