"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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
import { SearchIcon } from "lucide-react";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "developer" | "client";
  isActive: boolean;
};

type InviteFormState = {
  name: string;
  email: string;
  password: string;
};

const defaultInviteForm: InviteFormState = {
  name: "",
  email: "",
  password: "",
};

export function TeamManagement({ initialTeam }: { initialTeam: TeamMember[] }) {
  const [team, setTeam] = useState(initialTeam);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] =
    useState<InviteFormState>(defaultInviteForm);
  const [invitePending, setInvitePending] = useState(false);
  const [actionPendingById, setActionPendingById] = useState<
    Record<string, boolean>
  >({});
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<TeamMember["role"] | "__all__">(
    "__all__",
  );
  const [statusFilter, setStatusFilter] = useState<
    "__all__" | "active" | "disabled"
  >("__all__");

  const sortedTeam = useMemo(() => {
    const priority: Record<TeamMember["role"], number> = {
      admin: 0,
      developer: 1,
      client: 2,
    };
    return [...team].sort((a, b) => {
      if (priority[a.role] !== priority[b.role]) {
        return priority[a.role] - priority[b.role];
      }
      return a.name.localeCompare(b.name);
    });
  }, [team]);

  const filteredTeam = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return sortedTeam.filter((member) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        member.name.toLowerCase().includes(normalizedQuery) ||
        member.email.toLowerCase().includes(normalizedQuery);
      const matchesRole =
        roleFilter === "__all__" || member.role === roleFilter;
      const matchesStatus =
        statusFilter === "__all__" ||
        (statusFilter === "active" ? member.isActive : !member.isActive);
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [query, roleFilter, sortedTeam, statusFilter]);

  const {
    currentPage,
    paginatedItems: visibleTeam,
    setCurrentPage,
    totalItems,
    totalPages,
  } = useTablePagination(filteredTeam);

  async function refreshTeam() {
    const response = await fetch("/api/team", { cache: "no-store" });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error ?? "Failed to refresh team members");
    }
    setTeam(payload?.data ?? []);
  }

  async function submitInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInvitePending(true);
    try {
      const response = await fetch("/api/team", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(inviteForm),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to invite developer");
      }

      await refreshTeam();
      setInviteForm(defaultInviteForm);
      setInviteOpen(false);
      toast.success("Developer account created");
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to invite developer";
      toast.error(message);
    } finally {
      setInvitePending(false);
    }
  }

  async function updateRole(userId: string, role: "developer" | "client") {
    setActionPendingById((prev) => ({ ...prev, [userId]: true }));
    try {
      const response = await fetch(`/api/team/${userId}/role`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to update role");
      }

      setTeam((prev) =>
        prev.map((member) =>
          member.id === userId ? { ...member, role } : member,
        ),
      );
      toast.success(
        role === "developer"
          ? "User promoted to Developer"
          : "User role set to Client",
      );
    } catch (updateError) {
      const message =
        updateError instanceof Error
          ? updateError.message
          : "Unable to update role";
      toast.error(message);
    } finally {
      setActionPendingById((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between">
        <div className="relative">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="peer ps-9 pe-9"
            placeholder="Search members"
            type="search"
          />
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
            <SearchIcon size={16} />
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            value={roleFilter}
            onValueChange={(value) =>
              setRoleFilter(value as TeamMember["role"] | "__all__")
            }
          >
            <SelectTrigger className="md:w-44">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="__all__">All Roles</SelectItem>
              <SelectItem value="admin">admin</SelectItem>
              <SelectItem value="developer">developer</SelectItem>
              <SelectItem value="client">client</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as "__all__" | "active" | "disabled")
            }
          >
            <SelectTrigger className="md:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="__all__">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>Invite Developer</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Developer</DialogTitle>
                <DialogDescription>
                  Create a new account and assign the Developer role.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={submitInvite}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="developer-name">Name</FieldLabel>
                    <Input
                      id="developer-name"
                      value={inviteForm.name}
                      onChange={(event) =>
                        setInviteForm((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      required
                      minLength={2}
                      placeholder="Developer name"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="developer-email">Email</FieldLabel>
                    <Input
                      id="developer-email"
                      type="email"
                      value={inviteForm.email}
                      onChange={(event) =>
                        setInviteForm((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
                      }
                      required
                      placeholder="developer@agency.com"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="developer-password">
                      Temporary Password
                    </FieldLabel>
                    <Input
                      id="developer-password"
                      type="password"
                      value={inviteForm.password}
                      onChange={(event) =>
                        setInviteForm((prev) => ({
                          ...prev,
                          password: event.target.value,
                        }))
                      }
                      required
                      minLength={8}
                      placeholder="At least 8 characters"
                    />
                  </Field>
                </FieldGroup>
                <DialogFooter showCloseButton className="mt-4">
                  <Button type="submit" disabled={invitePending}>
                    {invitePending ? "Creating..." : "Create Developer"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Frame className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeam.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No team members found.
                </TableCell>
              </TableRow>
            ) : (
              visibleTeam.map((member) => {
                const pending = Boolean(actionPendingById[member.id]);
                return (
                  <TableRow key={member.id}>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {member.isActive ? "Active" : "Disabled"}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.role === "admin" ? (
                        <span className="text-xs text-muted-foreground">
                          Protected
                        </span>
                      ) : member.role === "client" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void updateRole(member.id, "developer")
                          }
                          disabled={pending}
                        >
                          {pending ? "Updating..." : "Convert to Developer"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void updateRole(member.id, "client")}
                          disabled={pending}
                        >
                          {pending ? "Updating..." : "Set as Client"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
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
