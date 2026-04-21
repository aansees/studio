"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { PROJECT_PRIORITIES, PROJECT_STATUSES } from "@/lib/constants/domain";
import { Badge } from "@/components/ui/badge";
import { Frame } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { CreateProjectDialog } from "@/components/layout/dashboard/create-project-dialog";
import type { TeamUser } from "@/components/layout/dashboard/create-project-dialog";
import { SearchIcon } from "lucide-react";

type ProjectsTableRow = {
  id: string;
  name: string;
  status: string;
  priority: string;
  progressPercent: number;
  endDate: string | null;
};

type FilterStatus = (typeof PROJECT_STATUSES)[number] | "__all__";
type FilterPriority = (typeof PROJECT_PRIORITIES)[number] | "__all__";

export function ProjectsTable({
  initialProjects,
  user,
  normalizedTeam,
}: {
  initialProjects: ProjectsTableRow[];
  user: { id: string; role: string };
  normalizedTeam: TeamUser[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("__all__");
  const [priorityFilter, setPriorityFilter] =
    useState<FilterPriority>("__all__");
  const showPriority = user.role !== "client";

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return initialProjects.filter((project) => {
      const matchesPriorityQuery = showPriority
        ? project.priority.toLowerCase().includes(normalizedQuery)
        : false;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        project.name.toLowerCase().includes(normalizedQuery) ||
        project.status.toLowerCase().includes(normalizedQuery) ||
        matchesPriorityQuery;
      const matchesStatus =
        statusFilter === "__all__" || project.status === statusFilter;
      const matchesPriority =
        !showPriority ||
        priorityFilter === "__all__" ||
        project.priority === priorityFilter;
      return matchesQuery && matchesStatus && matchesPriority;
    });
  }, [initialProjects, priorityFilter, query, showPriority, statusFilter]);

  const {
    currentPage,
    paginatedItems: visibleProjects,
    setCurrentPage,
    totalItems,
    totalPages,
  } = useTablePagination(filteredProjects);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
        <div className="relative">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="peer ps-9 pe-9"
            placeholder="Search projects"
            type="search"
          />
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
            <SearchIcon size={16} />
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as FilterStatus)}
          >
            <SelectTrigger className="md:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Statuses</SelectItem>
              {PROJECT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showPriority ? (
            <Select
              value={priorityFilter}
              onValueChange={(value) =>
                setPriorityFilter(value as FilterPriority)
              }
            >
              <SelectTrigger className="md:w-44">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Priorities</SelectItem>
                {PROJECT_PRIORITIES.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          {user.role === "admin" ? (
            <CreateProjectDialog
              users={normalizedTeam}
              currentUserId={user.id}
            />
          ) : null}
        </div>
      </div>

      <Frame className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              {showPriority ? <TableHead>Priority</TableHead> : null}
              <TableHead>Progress</TableHead>
              <TableHead>Deadline</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showPriority ? 5 : 4}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No projects found.
                </TableCell>
              </TableRow>
            ) : (
              visibleProjects.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/projects/${item.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {item.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.status}</Badge>
                  </TableCell>
                  {showPriority ? <TableCell>{item.priority}</TableCell> : null}
                  <TableCell>{item.progressPercent}%</TableCell>
                  <TableCell>
                    {item.endDate
                      ? new Date(item.endDate).toLocaleDateString()
                      : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Frame>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
