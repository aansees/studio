"use client";

import { PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { MantineProvider } from "@mantine/core";
import { useTheme } from "next-themes";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

const EMPTY_DOCUMENT: PartialBlock[] = [
  { type: "paragraph" as const, content: "" },
];

function inlineContentHasText(content: unknown): boolean {
  if (typeof content === "string") {
    return content.trim().length > 0;
  }

  if (!Array.isArray(content)) {
    return false;
  }

  return content.some((item) => {
    if (typeof item === "string") {
      return item.trim().length > 0;
    }

    if (!item || typeof item !== "object") {
      return false;
    }

    if ("text" in item && typeof item.text === "string") {
      return item.text.trim().length > 0;
    }

    if ("content" in item) {
      return inlineContentHasText(item.content);
    }

    return false;
  });
}

function blockHasContent(block: PartialBlock | undefined): boolean {
  if (!block) {
    return false;
  }

  if (inlineContentHasText(block.content)) {
    return true;
  }

  if (
    block.content &&
    typeof block.content === "object" &&
    "rows" in block.content
  ) {
    return (
      Array.isArray(block.content.rows) &&
      block.content.rows.some(
        (row) =>
          Array.isArray(row.cells) &&
          row.cells.some((cell) => inlineContentHasText(cell)),
      )
    );
  }

  return (
    Array.isArray(block.children) &&
    block.children.some((child) => blockHasContent(child))
  );
}

function documentHasContent(blocks: PartialBlock[]) {
  return blocks.some((block) => blockHasContent(block));
}

function parseStoredDocument(value: string | null | undefined): PartialBlock[] {
  if (!value?.trim()) {
    return EMPTY_DOCUMENT;
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed as PartialBlock[];
    }
  } catch {
    // Fall back to a paragraph-based document for legacy plain text content.
  }

  const paragraphs = value
    .split(/\n{2,}/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map(
      (segment) => ({ type: "paragraph" as const, content: segment }) as PartialBlock,
    );

  return paragraphs.length > 0 ? paragraphs : EMPTY_DOCUMENT;
}

function getEditorTheme(resolvedTheme: string | undefined) {
  return resolvedTheme === "dark" ? "dark" : "light";
}

export type ProjectRichTextProps = {
  value: string | null | undefined;
  className?: string;
  variant?: "default" | "workspace";
};

export function ProjectRichTextEditorBrowser({
  value,
  onChange,
  className,
  variant = "default",
}: ProjectRichTextProps & {
  onChange: (value: string) => void;
}) {
  const { resolvedTheme } = useTheme();
  const [initialContent] = useState(() => parseStoredDocument(value));
  const editor = useCreateBlockNote(
    {
      initialContent,
    },
    [],
  );
  const theme = getEditorTheme(resolvedTheme);

  return (
    <div
      className={cn(
        "project-rich-text",
        variant === "workspace" && "flex h-full min-h-0 flex-col overflow-hidden",
        className,
      )}
      data-layout={variant}
    >
      <MantineProvider forceColorScheme={theme} withCssVariables={false}>
        <BlockNoteView
          editor={editor}
          theme={theme}
          onChange={(currentEditor) => {
            const nextValue = documentHasContent(currentEditor.document)
              ? JSON.stringify(currentEditor.document)
              : "";
            onChange(nextValue);
          }}
        />
      </MantineProvider>
    </div>
  );
}

export function ProjectRichTextViewerBrowser({
  value,
  emptyMessage = "No content added yet.",
  className,
  variant = "default",
}: ProjectRichTextProps & {
  emptyMessage?: string;
}) {
  const { resolvedTheme } = useTheme();
  const initialContent = useMemo(() => parseStoredDocument(value), [value]);
  const editor = useCreateBlockNote(
    {
      initialContent,
    },
    [initialContent],
  );
  const theme = getEditorTheme(resolvedTheme);

  if (!documentHasContent(initialContent)) {
    return <div className="text-sm text-muted-foreground">{emptyMessage}</div>;
  }

  return (
    <div
      className={cn(
        "project-rich-text",
        variant === "workspace" && "flex h-full min-h-0 flex-col overflow-hidden",
        className,
      )}
      data-readonly="true"
      data-layout={variant}
    >
      <MantineProvider forceColorScheme={theme} withCssVariables={false}>
        <BlockNoteView
          editor={editor}
          theme={theme}
          editable={false}
          formattingToolbar={false}
          linkToolbar={false}
          slashMenu={false}
          sideMenu={false}
          emojiPicker={false}
          filePanel={false}
          tableHandles={false}
          comments={false}
        />
      </MantineProvider>
    </div>
  );
}
