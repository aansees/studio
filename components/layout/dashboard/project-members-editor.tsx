"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  FieldGroup,
} from "@/components/ui/field";
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

type AssignableUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "developer" | "client";
  isActive: boolean;
};

function sortUsers(users: AssignableUser[]) {
  return [...users].sort((left, right) => left.name.localeCompare(right.name));
}

function MemberCombobox({
  items,
  placeholder,
  disabled,
  onSelect,
}: {
  items: AssignableUser[];
  placeholder: string;
  disabled?: boolean;
  onSelect: (user: AssignableUser) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedValue, setSelectedValue] = useState<AssignableUser | null>(
    null,
  );

  return (
    <Combobox
      items={items}
      value={selectedValue}
      inputValue={query}
      disabled={disabled}
      itemToStringLabel={(item) => `${item.name} (${item.email})`}
      itemToStringValue={(item) => item.id}
      isItemEqualToValue={(item, value) => item.id === value.id}
      onInputValueChange={(value) => setQuery(value)}
      onValueChange={(value) => {
        setSelectedValue(value);
        if (!value) {
          return;
        }

        onSelect(value);
        setSelectedValue(null);
        setQuery("");
      }}
    >
      <ComboboxInput
        className="w-full max-w-60"
        placeholder={placeholder}
        showClear
      />
      <ComboboxContent>
        <ComboboxEmpty>No matches found.</ComboboxEmpty>
        <ComboboxList>
          {items.map((item) => (
            <ComboboxItem key={item.id} value={item}>
              <div className="flex flex-col">
                <span className="font-medium">{item.name}</span>
                <span className="text-xs text-muted-foreground">
                  {item.email}
                </span>
              </div>
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

export function ProjectMembersEditor({
  projectId,
  users,
  initialMemberIds,
  initialClientIds,
  projectLeadId,
  canManageClients,
}: {
  projectId: string;
  users: AssignableUser[];
  initialMemberIds: string[];
  initialClientIds: string[];
  projectLeadId: string;
  canManageClients: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [memberIds, setMemberIds] = useState<string[]>(initialMemberIds);
  const [clientIds, setClientIds] = useState<string[]>(initialClientIds);

  const userById = useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );

  const developerCandidates = useMemo(
    () =>
      sortUsers(
        users.filter(
          (user) =>
            user.role === "developer" &&
            user.id !== projectLeadId &&
            !memberIds.includes(user.id),
        ),
      ),
    [memberIds, projectLeadId, users],
  );

  const clientCandidates = useMemo(
    () =>
      sortUsers(
        users.filter(
          (user) => user.role === "client" && !clientIds.includes(user.id),
        ),
      ),
    [clientIds, users],
  );

  const selectedDevelopers = useMemo(
    () =>
      sortUsers(
        memberIds
          .map((memberId) => userById.get(memberId))
          .filter((user): user is AssignableUser => Boolean(user)),
      ),
    [memberIds, userById],
  );

  const selectedClients = useMemo(
    () =>
      sortUsers(
        clientIds
          .map((clientId) => userById.get(clientId))
          .filter((user): user is AssignableUser => Boolean(user)),
      ),
    [clientIds, userById],
  );

  const {
    currentPage: clientsPage,
    paginatedItems: visibleClients,
    setCurrentPage: setClientsPage,
    totalItems: totalClients,
    totalPages: clientPages,
  } = useTablePagination(selectedClients);

  const {
    currentPage: developersPage,
    paginatedItems: visibleDevelopers,
    setCurrentPage: setDevelopersPage,
    totalItems: totalDevelopers,
    totalPages: developerPages,
  } = useTablePagination(selectedDevelopers);

  async function saveMembers() {
    setPending(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          memberIds,
          clientIds,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to update project members");
      }

      toast.success("Project members updated");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to update project members";
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <FieldGroup className="flex flex-col gap-6">
        <div className="space-y-3">
          <div className="flex items-center justify-end">

            {canManageClients ? (
              <MemberCombobox
                items={clientCandidates}
                placeholder="Search clients to add"
                disabled={pending || clientCandidates.length === 0}
                onSelect={(user) => {
                  setClientIds((current) =>
                    Array.from(new Set([...current, user.id])),
                  );
                }}
              />
            ) : (
              <div className="rounded-xl border border-dashed px-3 py-3 text-sm text-muted-foreground">
                Only admins can add or remove client access.
              </div>
            )}
          </div>

          <Frame>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[110px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedClients.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-20 text-center text-sm text-muted-foreground"
                    >
                      No clients linked to this project.
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        {client.name}
                      </TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>
                        {client.isActive ? "Active" : "Disabled"}
                      </TableCell>
                      <TableCell className="text-right">
                        {canManageClients ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setClientIds((current) =>
                                current.filter((id) => id !== client.id),
                              )
                            }
                            disabled={pending}
                          >
                            Remove
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Protected
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Frame>
          <TablePagination
            currentPage={clientsPage}
            totalPages={clientPages}
            totalItems={totalClients}
            onPageChange={setClientsPage}
          />
        </div>

        <div className="space-y-3">
          <div className="justify-end flex items-center">
            <MemberCombobox
              items={developerCandidates}
              placeholder="Search developers to add"
              disabled={pending || developerCandidates.length === 0}
              onSelect={(user) => {
                setMemberIds((current) =>
                  Array.from(new Set([...current, user.id])),
                );
              }}
            />
          </div>

          <Frame>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Developer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[110px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedDevelopers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-20 text-center text-sm text-muted-foreground"
                    >
                      No developers assigned beyond the project lead.
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleDevelopers.map((developer) => (
                    <TableRow key={developer.id}>
                      <TableCell className="font-medium">
                        {developer.name}
                      </TableCell>
                      <TableCell>{developer.email}</TableCell>
                      <TableCell>
                        {developer.isActive ? "Active" : "Disabled"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setMemberIds((current) =>
                              current.filter((id) => id !== developer.id),
                            )
                          }
                          disabled={pending}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Frame>
          <TablePagination
            currentPage={developersPage}
            totalPages={developerPages}
            totalItems={totalDevelopers}
            onPageChange={setDevelopersPage}
          />
        </div>
      </FieldGroup>

      <div className="flex justify-end">
        <Button onClick={() => void saveMembers()} disabled={pending}>
          {pending ? "Saving..." : "Save members"}
        </Button>
      </div>
    </div>
  );
}
