import { ChartAreaInteractive } from "@/components/layout/dashboard/chart-area-interactive";
import { DataTable } from "@/components/layout/dashboard/data-table";
import { SectionCards } from "@/components/layout/dashboard/section-cards";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/session";
import { getDashboardOverview } from "@/lib/services/dashboard";
import { Frame, FramePanel } from "@/components/ui/frame";

export default async function Page() {
  const { user } = await requireSession();
  const overview = await getDashboardOverview(user);

  return (
    <div className="@container/main font-at-aero-regular flex flex-1 flex-col gap-4 p-4 md:p-6">
      <SectionCards cards={overview.cards} />

      <Frame className="grid gap-1 xl:grid-cols-3">
        <FramePanel block="xl:col-span-2">
          <ChartAreaInteractive data={overview.statusChart} />
        </FramePanel>

        <FramePanel>
          <CardTitle>Recent Projects</CardTitle>
          <CardContent className="p-1 space-y-3">
            {overview.recentProjects.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">{item.name}</div>
                  <Badge variant="outline">{item.status}</Badge>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${item.progressPercent}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="uppercase">{item.priority}</span>
                  <span>
                    {item.endDate
                      ? new Date(item.endDate).toLocaleDateString()
                      : "No deadline"}
                  </span>
                </div>
              </div>
            ))}
            {overview.recentProjects.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No projects found.
              </div>
            ) : null}
          </CardContent>
        </FramePanel>
      </Frame>

      <DataTable
        data={overview.recentTasks}
        canManageTasks={user.role !== "client"}
        canBulkDelete={user.role === "admin"}
      />
    </div>
  );
}
