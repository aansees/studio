"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { endOfMonth, format } from "date-fns";
import {
  ArrowUpRightIcon,
  Clock3Icon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Frame, FramePanel } from "@/components/ui/frame";
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
import type { TaskType } from "@/lib/constants/domain";
import type { ProjectAnalytics } from "@/lib/project-analytics/types";
import { cn } from "@/lib/utils";

type ProjectAnalyticsDashboardProps = {
  project: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    priority: string;
    progressPercent: number;
    endDate: string | null;
  };
  analytics: ProjectAnalytics;
  members: Array<{
    userId: string;
    name: string;
    image: string | null;
    role: string;
  }>;
};

const qualityChartConfig = {
  build: {
    label: "Build work",
    color: "var(--chart-2)",
  },
  maintenance: {
    label: "Maintenance work",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatEnumLabel(value: string) {
  return value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatRatio(ratio: number) {
  return `${Math.round(ratio * 100)}%`;
}

function formatPercent(value: number) {
  return `${value}%`;
}

function formatDate(value: string | null) {
  if (!value) return "No deadline";
  return new Date(value).toLocaleDateString();
}

function buildYearlyThroughputSeries(
  events: ProjectAnalytics["throughputEvents"],
) {
  const now = new Date();
  return Array.from({ length: 12 }, (_, index) => {
    const monthStart = new Date(now.getFullYear(), index, 1);
    const monthEnd = endOfMonth(monthStart);
    return {
      key: monthStart.toISOString(),
      label: format(monthStart, "MMM"),
      created: events.filter((event) => {
        const createdAt = new Date(event.createdAt);
        return createdAt >= monthStart && createdAt <= monthEnd;
      }).length,
      completed: events.filter((event) => {
        if (!event.completedAt) return false;
        const completedAt = new Date(event.completedAt);
        return completedAt >= monthStart && completedAt <= monthEnd;
      }).length,
      active: monthStart.getMonth() === now.getMonth(),
    };
  });
}

function qualityToneBadgeClass(tone: ProjectAnalytics["quality"]["tone"]) {
  if (tone === "strong") {
    return "border-emerald-500/30 text-emerald-700 dark:text-emerald-300";
  }

  if (tone === "stable") {
    return "border-sky-500/30 text-sky-700 dark:text-sky-300";
  }

  if (tone === "watch") {
    return "border-amber-500/30 text-amber-700 dark:text-amber-300";
  }

  return "border-rose-500/30 text-rose-700 dark:text-rose-300";
}

function qualityToneIcon(tone: ProjectAnalytics["quality"]["tone"]) {
  if (tone === "strong" || tone === "stable") {
    return <TrendingUpIcon className="size-3.5" />;
  }

  if (tone === "watch") {
    return <Clock3Icon className="size-3.5" />;
  }

  return <TrendingDownIcon className="size-3.5" />;
}

function typeToneClass(type: TaskType) {
  if (type === "feature") return "bg-sky-500";
  if (type === "bug") return "bg-rose-500";
  if (type === "improvement") return "bg-emerald-500";
  if (type === "research") return "bg-amber-500";
  return "bg-violet-500";
}

function timelineToneClass(
  state: ProjectAnalytics["timeline"][number]["state"],
) {
  if (state === "completed") return "bg-emerald-500";
  if (state === "active") return "bg-sky-500";
  if (state === "late") return "bg-rose-500";
  return "bg-muted-foreground";
}

function ThroughputTooltip({
  label,
  created,
  completed,
  leftPercent,
}: {
  label: string;
  created: number;
  completed: number;
  leftPercent: number;
}) {
  return (
    <div
      className="absolute top-6 z-20 min-w-[172px] -translate-x-1/2 rounded-2xl bg-neutral-950 px-4 py-3 text-white shadow-2xl"
      style={{ left: `${leftPercent}%` }}
    >
      <div className="mb-3 text-sm text-neutral-300">{label}</div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-orange-500" />
            <span>Created</span>
          </div>
          <span className="font-semibold">{created}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-orange-200" />
            <span>Closed</span>
          </div>
          <span className="font-semibold">{completed}</span>
        </div>
      </div>
    </div>
  );
}

function ProjectThroughputChart({
  data,
}: {
  data: Array<{
    key: string;
    label: string;
    created: number;
    completed: number;
    active: boolean;
  }>;
}) {
  const chartData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        total: item.created + item.completed,
      })),
    [data],
  );
  const latestDataIndex = chartData.reduce((current, item, index) => {
    if (item.total > 0) {
      return index;
    }
    return current;
  }, -1);
  const defaultIndex =
    latestDataIndex >= 0
      ? latestDataIndex
      : Math.max(
          chartData.findIndex((item) => item.active),
          0,
        );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const activeIndex = hoveredIndex ?? defaultIndex;
  const activeItem = chartData[activeIndex];
  const maxValue = Math.max(1, ...chartData.map((item) => item.total));

  return (
    <div className="relative flex h-full flex-col">
      {hoveredIndex !== null && activeItem ? (
        <ThroughputTooltip
          label={activeItem.label}
          created={activeItem.created}
          completed={activeItem.completed}
          leftPercent={((activeIndex + 0.5) / chartData.length) * 100}
        />
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 top-4 bottom-11 flex flex-col justify-between">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="border-t border-dashed border-border/70"
          />
        ))}
      </div>

      <div className="relative min-h-0 flex-1">
        <div className="grid h-full grid-cols-12 gap-4">
          {chartData.map((item, index) => {
            const height =
              item.total > 0 ? `${(item.total / maxValue) * 78}%` : "0%";
            const isActive = index === activeIndex;

            return (
              <button
                key={item.key}
                type="button"
                className="relative flex min-w-0 items-end justify-center"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex(null)}
              >
                <div className="relative flex h-[78%] w-full items-end justify-center">
                  {item.total > 0 ? (
                    <div
                      className={cn(
                        "w-8 rounded-[18px] border transition-colors",
                        isActive
                          ? "border-orange-500 bg-orange-500"
                          : "border-slate-200/90 bg-[repeating-linear-gradient(135deg,rgba(203,213,225,0.28)_0px,rgba(203,213,225,0.28)_4px,transparent_4px,transparent_12px)]",
                      )}
                      style={{ height }}
                    />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5 pt-4 text-sm text-muted-foreground">
        {chartData.map((item, index) => (
          <div
            key={`label-${item.key}`}
            className={cn(
              "text-center",
              index === activeIndex && "font-medium text-foreground",
            )}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function QualityMixChart({
  buildCount,
  maintenanceCount,
  qualityScore,
}: {
  buildCount: number;
  maintenanceCount: number;
  qualityScore: number;
}) {
  const chartData = [
    {
      month: "current",
      build: buildCount,
      maintenance: maintenanceCount,
    },
  ];

  return (
    <ChartContainer
      config={qualityChartConfig}
      className="mx-auto aspect-square h-[230px] w-full max-w-[260px]"
    >
      <RadialBarChart
        data={chartData}
        endAngle={180}
        innerRadius={78}
        outerRadius={124}
      >
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) - 10}
                      className="fill-foreground text-3xl font-semibold"
                    >
                      {qualityScore}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 12}
                      className="fill-muted-foreground text-xs"
                    >
                      Quality score
                    </tspan>
                  </text>
                );
              }
              return null;
            }}
          />
        </PolarRadiusAxis>
        <RadialBar
          dataKey="build"
          stackId="mix"
          cornerRadius={6}
          fill="var(--color-build)"
          className="stroke-transparent stroke-2"
        />
        <RadialBar
          dataKey="maintenance"
          stackId="mix"
          cornerRadius={6}
          fill="var(--color-maintenance)"
          className="stroke-transparent stroke-2"
        />
      </RadialBarChart>
    </ChartContainer>
  );
}

export function ProjectAnalyticsDashboard({
  project,
  analytics,
  members,
}: ProjectAnalyticsDashboardProps) {
  const {
    currentPage,
    paginatedItems: visibleAssignees,
    setCurrentPage,
    totalItems,
    totalPages,
  } = useTablePagination(analytics.assigneeBreakdown);
  const visibleThroughput = useMemo(
    () => buildYearlyThroughputSeries(analytics.throughputEvents),
    [analytics.throughputEvents],
  );

  const engineeringMembers = members.filter(
    (member) => member.role !== "client",
  );
  const visibleMembers = engineeringMembers.slice(0, 3);
  const extraMembers = Math.max(
    engineeringMembers.length - visibleMembers.length,
    0,
  );

  const featureCount =
    analytics.typeBreakdown.find((item) => item.type === "feature")?.count ?? 0;
  const improvementCount =
    analytics.typeBreakdown.find((item) => item.type === "improvement")
      ?.count ?? 0;
  const researchCount =
    analytics.typeBreakdown.find((item) => item.type === "research")?.count ??
    0;
  const bugCount =
    analytics.typeBreakdown.find((item) => item.type === "bug")?.count ?? 0;
  const supportCount =
    analytics.typeBreakdown.find((item) => item.type === "support")?.count ?? 0;
  const buildCount = featureCount + improvementCount + researchCount;
  const maintenanceCount = bugCount + supportCount;

  const metrics = [
    {
      label: "Total Tasks",
      value: analytics.summary.total.toLocaleString(),
      helper: `${analytics.summary.open.toLocaleString()} still open`,
    },
    {
      label: "Completed",
      value: analytics.summary.completed.toLocaleString(),
      helper: `${formatPercent(analytics.summary.completionRate)} close rate`,
    },
    {
      label: "In Progress",
      value: analytics.summary.inProgress.toLocaleString(),
      helper: `${analytics.summary.review.toLocaleString()} in review`,
    },
    {
      label: "Overdue",
      value: analytics.summary.overdue.toLocaleString(),
      helper: `${analytics.summary.unassigned.toLocaleString()} unassigned`,
    },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <Frame className="grid gap-1 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <FramePanel key={metric.label} className="space-y-1.5 p-4 m-0!">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {metric.label}
            </div>
            <div className="text-2xl font-semibold">{metric.value}</div>
            <div className="text-sm text-muted-foreground">{metric.helper}</div>
          </FramePanel>
        ))}
      </Frame>

      <Frame className="grid gap-1 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <FramePanel className="grid gap-6 p-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="text-sm font-medium">Task Mix</div>
              <p className="text-sm text-muted-foreground">
                This shows whether the project is shipping new work or absorbing
                maintenance pressure.
              </p>
            </div>
            <QualityMixChart
              buildCount={buildCount}
              maintenanceCount={maintenanceCount}
              qualityScore={analytics.quality.score}
            />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border p-3">
                <div className="text-muted-foreground">Build work</div>
                <div className="mt-1 text-lg font-semibold">
                  {buildCount.toLocaleString()}
                </div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-muted-foreground">Maintenance</div>
                <div className="mt-1 text-lg font-semibold">
                  {maintenanceCount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <div className="text-sm font-medium">Task Type Distribution</div>
              <p className="text-sm text-muted-foreground">
                Feature, bug, research, improvement, and support load across the
                current project.
              </p>
            </div>
            <div className="space-y-4">
              {analytics.typeBreakdown.map((item) => (
                <div key={item.type} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-2.5 rounded-full",
                          typeToneClass(item.type),
                        )}
                      />
                      <span>{formatEnumLabel(item.type)}</span>
                    </div>
                    <div className="font-medium">
                      {item.count} · {formatRatio(item.ratio)}
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        typeToneClass(item.type),
                      )}
                      style={{
                        width: `${Math.max(item.ratio * 100, item.count > 0 ? 6 : 0)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {analytics.priorityBreakdown
                .filter((item) => item.count > 0)
                .map((item) => (
                  <Badge key={item.priority} variant="outline">
                    {formatEnumLabel(item.priority)} · {item.count}
                  </Badge>
                ))}
            </div>
          </div>
        </FramePanel>
        <FramePanel className="space-y-6 p-5 m-0!">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium">Quality Signal</div>
              <Badge
                variant="outline"
                className={cn(qualityToneBadgeClass(analytics.quality.tone))}
              >
                {qualityToneIcon(analytics.quality.tone)}
                {formatEnumLabel(analytics.quality.tone)}
              </Badge>
            </div>
            <div className="text-2xl font-semibold tracking-tight">
              {analytics.quality.headline}
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {analytics.quality.summary}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Bug Ratio
              </div>
              <div className="mt-1 text-xl font-semibold">
                {formatRatio(analytics.quality.bugRatio)}
              </div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Maintenance Load
              </div>
              <div className="mt-1 text-xl font-semibold">
                {formatRatio(analytics.quality.maintenanceRatio)}
              </div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Overdue Rate
              </div>
              <div className="mt-1 text-xl font-semibold">
                {formatRatio(analytics.quality.overdueRate)}
              </div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Blocked Rate
              </div>
              <div className="mt-1 text-xl font-semibold">
                {formatRatio(analytics.quality.blockedRate)}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium">Task Allocation Owners</div>
            <div className="space-y-3">
              {analytics.creatorBreakdown.length === 0 ? (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  No task creators recorded yet.
                </div>
              ) : (
                analytics.creatorBreakdown.slice(0, 4).map((creator) => (
                  <div
                    key={creator.creatorId}
                    className="flex items-center justify-between gap-3 rounded-xl border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        {creator.image ? (
                          <AvatarImage src={creator.image} alt={creator.name} />
                        ) : null}
                        <AvatarFallback>
                          {getInitials(creator.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{creator.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {creator.share}% of created tasks
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-semibold">{creator.total}</div>
                      <div className="text-muted-foreground">tasks</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </FramePanel>
      </Frame>

      <div className="flex flex-col gap-2 pt-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-medium">Developer Performance</div>
          <p className="text-sm text-muted-foreground">
            Real assignment load, in-progress work, completions, and bug
            pressure by assignee.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            Active assignees · {analytics.teamSummary.activeAssignees}
          </Badge>
          <Badge variant="outline">
            Developers · {analytics.teamSummary.developers}
          </Badge>
          <Badge variant="outline">
            Clients · {analytics.teamSummary.clients}
          </Badge>
        </div>
      </div>
      <Frame>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Developer</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead>Done</TableHead>
              <TableHead>In Progress</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Overdue</TableHead>
              <TableHead>Bug Load</TableHead>
              <TableHead>Completion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analytics.assigneeBreakdown.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No assignee analytics available yet.
                </TableCell>
              </TableRow>
            ) : (
              visibleAssignees.map((assignee) => (
                <TableRow key={assignee.assigneeId}>
                  <TableCell className="min-w-[220px]">
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        {assignee.image ? (
                          <AvatarImage
                            src={assignee.image}
                            alt={assignee.name}
                          />
                        ) : null}
                        <AvatarFallback>
                          {getInitials(assignee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="font-medium">{assignee.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatEnumLabel(assignee.role)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{assignee.total}</TableCell>
                  <TableCell>{assignee.completed}</TableCell>
                  <TableCell>{assignee.inProgress}</TableCell>
                  <TableCell>{assignee.review}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        assignee.overdue > 0 &&
                          "text-rose-600 dark:text-rose-400",
                      )}
                    >
                      {assignee.overdue}
                    </span>
                  </TableCell>
                  <TableCell>{assignee.bugCount}</TableCell>
                  <TableCell className="min-w-[180px]">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{assignee.completionRate}%</span>
                        <span className="text-muted-foreground">
                          {assignee.activeLoad} active
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            assignee.completionRate >= 70
                              ? "bg-emerald-500"
                              : assignee.completionRate >= 45
                                ? "bg-amber-500"
                                : "bg-rose-500",
                          )}
                          style={{
                            width: `${Math.max(assignee.completionRate, 4)}%`,
                          }}
                        />
                      </div>
                    </div>
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
