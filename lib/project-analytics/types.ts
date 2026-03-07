import type {
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@/lib/constants/domain";

export type ProjectAnalyticsStatusDatum = {
  status: TaskStatus;
  count: number;
  ratio: number;
};

export type ProjectAnalyticsTypeDatum = {
  type: TaskType;
  count: number;
  ratio: number;
};

export type ProjectAnalyticsPriorityDatum = {
  priority: TaskPriority;
  count: number;
  ratio: number;
};

export type ProjectAnalyticsMonthlyDatum = {
  key: string;
  label: string;
  created: number;
  completed: number;
  active: boolean;
};

export type ProjectAnalyticsAssigneeDatum = {
  assigneeId: string;
  name: string;
  image: string | null;
  role: string;
  total: number;
  completed: number;
  inProgress: number;
  review: number;
  blocked: number;
  overdue: number;
  featureCount: number;
  bugCount: number;
  researchCount: number;
  improvementCount: number;
  supportCount: number;
  completionRate: number;
  activeLoad: number;
};

export type ProjectAnalyticsCreatorDatum = {
  creatorId: string;
  name: string;
  image: string | null;
  total: number;
  share: number;
};

export type ProjectAnalyticsQualityTone =
  | "strong"
  | "stable"
  | "watch"
  | "risk";

export type ProjectAnalyticsQuality = {
  score: number;
  tone: ProjectAnalyticsQualityTone;
  headline: string;
  summary: string;
  bugRatio: number;
  maintenanceRatio: number;
  overdueRate: number;
  blockedRate: number;
  completionRate: number;
};

export type ProjectAnalyticsTimelineItem = {
  id: string;
  href: string;
  title: string;
  dateLabel: string;
  meta: string;
  state: "planned" | "active" | "late" | "completed";
};

export type ProjectAnalytics = {
  summary: {
    total: number;
    completed: number;
    overdue: number;
    todo: number;
    inProgress: number;
    review: number;
    blocked: number;
    open: number;
    unassigned: number;
    completionRate: number;
    maintenanceRatio: number;
  };
  throughputEvents: Array<{
    createdAt: string;
    completedAt: string | null;
  }>;
  monthlyThroughput: ProjectAnalyticsMonthlyDatum[];
  statusBreakdown: ProjectAnalyticsStatusDatum[];
  typeBreakdown: ProjectAnalyticsTypeDatum[];
  priorityBreakdown: ProjectAnalyticsPriorityDatum[];
  assigneeBreakdown: ProjectAnalyticsAssigneeDatum[];
  creatorBreakdown: ProjectAnalyticsCreatorDatum[];
  quality: ProjectAnalyticsQuality;
  timeline: ProjectAnalyticsTimelineItem[];
  teamSummary: {
    members: number;
    developers: number;
    clients: number;
    activeAssignees: number;
  };
};
