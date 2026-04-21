"use client";

import Link from "next/link";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Frame } from "@/components/ui/frame";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TablePagination,
  useTablePagination,
} from "@/components/ui/table-pagination";
import { TASK_STATUSES, type TaskStatus } from "@/lib/constants/domain";
import type { ProjectTaskRow } from "./project-tasks-workspace";
import { cn } from "@/lib/utils";

const STATUS_META: Record<
  TaskStatus,
  { label: string; accent: string; badgeClassName: string }
> = {
  todo: {
    label: "To Do",
    accent: "bg-sky-500",
    badgeClassName:
      "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  },
  in_progress: {
    label: "On Progress",
    accent: "bg-amber-500",
    badgeClassName:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  review: {
    label: "In Review",
    accent: "bg-violet-500",
    badgeClassName:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  },
  blocked: {
    label: "Blocked",
    accent: "bg-rose-500",
    badgeClassName:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  },
  done: {
    label: "Done",
    accent: "bg-emerald-500",
    badgeClassName:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
};

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function priorityTone(priority: string) {
  if (priority === "urgent" || priority === "high") {
    return "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300";
  }
  if (priority === "low") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
  }
  return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
}

function ProjectTaskStatusSection({
  isOpen,
  onToggle,
  statusRows,
  meta,
  className,
}: {
  isOpen: boolean;
  onToggle: () => void;
  statusRows: ProjectTaskRow[];
  meta: { label: string; accent: string; badgeClassName: string };
  className?: string;
}) {
  const {
    currentPage,
    paginatedItems: visibleRows,
    setCurrentPage,
    totalItems,
    totalPages,
  } = useTablePagination(statusRows);

  return (
    <>
      <Frame className={className}>
        <div
          className={cn(
            "flex items-center justify-between rounded-tl-2xl rounded-tr-2xl bg-muted/35 p-1",
            !isOpen && "rounded-b-2xl",
          )}
        >
          <button
            className="flex items-center gap-2"
            onClick={onToggle}
            type="button"
          >
            <Badge className={cn(meta.badgeClassName, "h-6 rounded-sm px-1")}>
              <span className={`h-4 w-1 rounded-full ${meta.accent}`} />
              {meta.label} ({statusRows.length})
            </Badge>
          </button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={onToggle}
          >
            {isOpen ? (
              <ChevronUpIcon className="size-4" />
            ) : (
              <ChevronDownIcon className="size-4" />
            )}
          </Button>
        </div>

        {isOpen ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>People</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/projects/${row.projectId}/tasks/${row.id}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {row.title}
                      </Link>
                    </TableCell>
                    <TableCell>{row.type}</TableCell>
                    <TableCell className="max-w-[360px] truncate text-muted-foreground">
                      {row.description || "-"}
                    </TableCell>
                    <TableCell>
                      {row.dueDate
                        ? new Date(row.dueDate).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {row.people.length === 0 ? (
                        <span className="text-muted-foreground">
                          Unassigned
                        </span>
                      ) : (
                        <AvatarGroup>
                          {row.people.slice(0, 3).map((person) => (
                            <Avatar key={person.id} size="sm">
                              {person.image ? (
                                <AvatarImage
                                  src={person.image}
                                  alt={person.name}
                                />
                              ) : null}
                              <AvatarFallback>
                                {getInitials(person.name)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {row.people.length > 3 ? (
                            <AvatarGroupCount>
                              +{row.people.length - 3}
                            </AvatarGroupCount>
                          ) : null}
                        </AvatarGroup>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={priorityTone(row.priority)}>
                        {row.priority}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        ) : null}
      </Frame>
      <div className="pb-4">
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
        />
      </div>
    </>
  );
}

export function ProjectTasksTable({ rows }: { rows: ProjectTaskRow[] }) {
  const [openState, setOpenState] = useState<Record<TaskStatus, boolean>>({
    todo: true,
    in_progress: true,
    review: true,
    blocked: true,
    done: true,
  });
  const sections = TASK_STATUSES.map((status) => ({
    status,
    rows: rows.filter((row) => row.status === status),
    meta: STATUS_META[status],
  }));
  const visibleSections =
    rows.length === 0
      ? []
      : sections.filter((section) => section.rows.length > 0);

  return (
    <div>
      {rows.length === 0 ? (
        <div className="flex h-40 items-center justify-center px-4 text-sm text-muted-foreground">
          No tasks found for the current filters.
        </div>
      ) : null}
      {visibleSections.map((section, index) => {
        const { status, rows: statusRows, meta } = section;
        const isOpen = openState[status];

        return (
          <ProjectTaskStatusSection
            key={status}
            statusRows={statusRows}
            meta={meta}
            isOpen={isOpen}
            className={index > 0 ? "mt-5" : undefined}
            onToggle={() =>
              setOpenState((current) => ({
                ...current,
                [status]: !current[status],
              }))
            }
          />
        );
      })}
    </div>
  );
}
