"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, MoreHorizontalIcon, SearchIcon } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Frame, FrameHeader, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination, useTablePagination } from "@/components/ui/table-pagination";

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
  const [inviteForm, setInviteForm] = useState<InviteFormState>(defaultInviteForm);
  const [invitePending, setInvitePending] = useState(false);
  const [actionPendingById, setActionPendingById] = useState<Record<string, boolean>>({});
  const [memberToBlock, setMemberToBlock] = useState<TeamMember | null>(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<TeamMember["role"] | "__all__">("__all__");
  const [statusFilter, setStatusFilter] = useState<"__all__" | "active" | "blocked">("__all__");

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
      const matchesRole = roleFilter === "__all__" || member.role === roleFilter;
      const matchesStatus =
        statusFilter === "__all__" ||
        (statusFilter === "active" ? member.isActive : !member.isActive);
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [query, roleFilter, sortedTeam, statusFilter]);

  const { currentPage, paginatedItems: visibleTeam, setCurrentPage, totalItems, totalPages } =
    useTablePagination(filteredTeam);

  const blockPending = memberToBlock
    ? Boolean(actionPendingById[memberToBlock.id])
    : false;

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
        submitError instanceof Error ? submitError.message : "Unable to invite developer";
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
        prev.map((member) => (member.id === userId ? { ...member, role } : member)),
      );
      toast.success(
        role === "developer" ? "User promoted to Developer" : "User role set to Client",
      );
    } catch (updateError) {
      const message =
        updateError instanceof Error ? updateError.message : "Unable to update role";
      toast.error(message);
    } finally {
      setActionPendingById((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    }
  }

  async function updateStatus(userId: string, isActive: boolean) {
    setActionPendingById((prev) => ({ ...prev, [userId]: true }));
    try {
      const response = await fetch(`/api/team/${userId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to update user status");
      }

      setTeam((prev) =>
        prev.map((member) => (member.id === userId ? { ...member, isActive } : member)),
      );
      toast.success(isActive ? "User unblocked" : "User blocked");
      return true;
    } catch (statusError) {
      const message =
        statusError instanceof Error ? statusError.message : "Unable to update user status";
      toast.error(message);
      return false;
    } finally {
      setActionPendingById((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    }
  }

  async function confirmBlock() {
    if (!memberToBlock) {
      return;
    }

    const success = await updateStatus(memberToBlock.id, false);
    if (success) {
      setMemberToBlock(null);
    }
  }

  return (
    <div className="space-y-4">
      <Frame>
        <FrameHeader className="gap-3 border-b px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="text-lg font-medium">Team management</div>
            <div className="text-sm text-muted-foreground">
              Add developers, adjust roles, and manage access.
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setTeam((current) => [...current].sort((a, b) => a.name.localeCompare(b.name)))
              }
            >
              <SearchIcon className="size-4" />
              Sort by name
            </Button>
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button>Invite developer</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite developer</DialogTitle>
                  <DialogDescription>
                    Create a new team account with access to project management tools.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={submitInvite} className="space-y-4">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="invite-name">Name</FieldLabel>
                      <Input
                        id="invite-name"
                        value={inviteForm.name}
                        onChange={(event) =>
                          setInviteForm((current) => ({ ...current, name: event.target.value }))
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="invite-email">Email</FieldLabel>
                      <Input
                        id="invite-email"
                        value={inviteForm.email}
                        onChange={(event) =>
                          setInviteForm((current) => ({ ...current, email: event.target.value }))
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="invite-password">Password</FieldLabel>
                      <Input
                        id="invite-password"
                        value={inviteForm.password}
                        onChange={(event) =>
                          setInviteForm((current) => ({ ...current, password: event.target.value }))
                        }
                      />
                    </Field>
                  </FieldGroup>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setInviteOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={invitePending}>
                      {invitePending ? "Inviting..." : "Invite"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </FrameHeader>
      </Frame>

      <Frame>
        <FramePanel className="space-y-4 p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search team" />
            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as TeamMember["role"] | "__all__")}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="developer">Developer</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "__all__" | "active" | "blocked")}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
              {visibleTeam.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{member.role}</Badge>
                  </TableCell>
                  <TableCell>{member.isActive ? "Active" : "Blocked"}</TableCell>
                  <TableCell className="text-right">
                    <Menu>
                      <MenuTrigger
                        disabled={Boolean(actionPendingById[member.id])}
                        className="inline-flex size-8 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <MoreHorizontalIcon className="size-4" />
                      </MenuTrigger>
                      <MenuPopup align="end">
                        <MenuItem onClick={() => void updateRole(member.id, "developer")}>Set developer</MenuItem>
                        <MenuItem onClick={() => void updateRole(member.id, "client")}>Set client</MenuItem>
                        <MenuSeparator />
                        <MenuItem onClick={() => void updateStatus(member.id, !member.isActive)}>
                          {member.isActive ? "Block user" : "Unblock user"}
                        </MenuItem>
                        <MenuItem onClick={() => setMemberToBlock(member)}>
                          Block with confirmation
                        </MenuItem>
                      </MenuPopup>
                    </Menu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
          />
        </FramePanel>
      </Frame>

      <AlertDialog open={Boolean(memberToBlock)} onOpenChange={(open) => !open && setMemberToBlock(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <AlertTriangle className="size-5" />
            </AlertDialogMedia>
            <AlertDialogTitle>Block team member?</AlertDialogTitle>
            <AlertDialogDescription>
              {memberToBlock ? `${memberToBlock.name} will lose access until unblocked.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={blockPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={blockPending} onClick={() => void confirmBlock()}>
              {blockPending ? "Blocking..." : "Block user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
