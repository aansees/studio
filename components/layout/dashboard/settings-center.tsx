"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Frame, FramePanel } from "@/components/ui/frame";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SettingsUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "admin" | "developer" | "client";
  twoFactorEnabled: boolean;
};

type AuthResult<T = unknown> = {
  data?: T | null;
  error?: {
    message?: string;
  } | null;
};

type SocialProvider = "google" | "github";

type LinkedAccount = {
  id: string;
  providerId: string;
  accountId: string;
  createdAt: string | Date;
};

const socialProviders: Array<{ id: SocialProvider; label: string }> = [
  { id: "google", label: "Google" },
  { id: "github", label: "GitHub" },
];

function resolveError(result: AuthResult | null | undefined, fallback: string) {
  if (result?.error?.message) {
    return result.error.message;
  }
  return fallback;
}

export function SettingsCenter({ initialUser }: { initialUser: SettingsUser }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const passkeyQuery = authClient.useListPasskeys();

  const [name, setName] = useState(initialUser.name);
  const [image, setImage] = useState(initialUser.image ?? "");
  const [profilePending, setProfilePending] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordPending, setPasswordPending] = useState(false);
  const [resetPending, setResetPending] = useState(false);

  const [passkeyName, setPasskeyName] = useState("");
  const [passkeyPending, setPasskeyPending] = useState(false);
  const [passkeyDeletingById, setPasskeyDeletingById] = useState<
    Record<string, boolean>
  >({});
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [linkedAccountsPending, setLinkedAccountsPending] = useState(false);
  const [socialLinkPendingByProvider, setSocialLinkPendingByProvider] =
    useState<Record<SocialProvider, boolean>>({
      google: false,
      github: false,
    });
  const [socialUnlinkPendingByProvider, setSocialUnlinkPendingByProvider] =
    useState<Record<SocialProvider, boolean>>({
      google: false,
      github: false,
    });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    initialUser.twoFactorEnabled,
  );
  const [twoFactorPassword, setTwoFactorPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [totpURI, setTotpURI] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [twoFactorPending, setTwoFactorPending] = useState(false);

  const passkeys = useMemo(() => {
    return Array.isArray(passkeyQuery.data) ? passkeyQuery.data : [];
  }, [passkeyQuery.data]);

  const linkedByProvider = useMemo(() => {
    const map: Partial<Record<SocialProvider, LinkedAccount>> = {};
    for (const account of linkedAccounts) {
      if (account.providerId === "google" || account.providerId === "github") {
        map[account.providerId] = account;
      }
    }
    return map;
  }, [linkedAccounts]);

  const tabParam = searchParams.get("tab");
  const defaultTab =
    tabParam === "profile" || tabParam === "password" ? tabParam : "security";

  useEffect(() => {
    void loadLinkedAccounts();
  }, []);

  async function loadLinkedAccounts(options?: { silent?: boolean }) {
    if (!options?.silent) {
      setLinkedAccountsPending(true);
    }
    try {
      const result = (await authClient.listAccounts()) as AuthResult<
        LinkedAccount[]
      >;
      if (result?.error) {
        throw new Error(resolveError(result, "Unable to load linked accounts"));
      }
      setLinkedAccounts(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      if (!options?.silent) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to load linked accounts",
        );
      }
    } finally {
      if (!options?.silent) {
        setLinkedAccountsPending(false);
      }
    }
  }

  async function linkSocialProvider(provider: SocialProvider) {
    setSocialLinkPendingByProvider((prev) => ({ ...prev, [provider]: true }));
    try {
      const result = (await authClient.linkSocial({
        provider,
        callbackURL: "/settings?tab=security",
      })) as AuthResult<{ url: string; redirect: boolean }>;

      if (result?.error) {
        throw new Error(
          resolveError(result, `Unable to connect ${provider} account`),
        );
      }

      if (result?.data?.url) {
        window.location.href = result.data.url;
      } else {
        throw new Error(`Unable to connect ${provider} account`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Unable to connect ${provider} account`,
      );
    } finally {
      setSocialLinkPendingByProvider((prev) => ({
        ...prev,
        [provider]: false,
      }));
    }
  }

  async function unlinkSocialProvider(provider: SocialProvider) {
    const linkedAccount = linkedByProvider[provider];
    if (!linkedAccount) {
      toast.error("No linked account found for this provider");
      return;
    }

    setSocialUnlinkPendingByProvider((prev) => ({ ...prev, [provider]: true }));
    try {
      const result = (await authClient.unlinkAccount({
        providerId: linkedAccount.providerId,
        accountId: linkedAccount.accountId,
      })) as AuthResult<{ status: boolean }>;

      if (result?.error) {
        throw new Error(
          resolveError(result, `Unable to disconnect ${provider} account`),
        );
      }

      toast.success(
        `${provider === "google" ? "Google" : "GitHub"} account disconnected`,
      );
      await loadLinkedAccounts({ silent: true });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Unable to disconnect ${provider} account`,
      );
    } finally {
      setSocialUnlinkPendingByProvider((prev) => ({
        ...prev,
        [provider]: false,
      }));
    }
  }

  async function submitProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfilePending(true);
    try {
      const result = (await authClient.$fetch("/update-user", {
        method: "POST",
        body: {
          name: name.trim(),
          image: image.trim() ? image.trim() : null,
        },
        throw: false,
      })) as AuthResult;

      if (result?.error) {
        throw new Error(resolveError(result, "Unable to update profile"));
      }

      toast.success("Profile updated");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update profile",
      );
    } finally {
      setProfilePending(false);
    }
  }

  async function submitChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordPending(true);
    try {
      const result = (await authClient.$fetch("/change-password", {
        method: "POST",
        body: {
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        },
        throw: false,
      })) as AuthResult;

      if (result?.error) {
        throw new Error(resolveError(result, "Unable to change password"));
      }

      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to change password",
      );
    } finally {
      setPasswordPending(false);
    }
  }

  async function requestPasswordReset() {
    setResetPending(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const result = (await authClient.$fetch("/request-password-reset", {
        method: "POST",
        body: {
          email: initialUser.email,
          redirectTo,
        },
        throw: false,
      })) as AuthResult;

      if (result?.error) {
        throw new Error(resolveError(result, "Unable to request reset email"));
      }

      toast.success("Password reset email requested. Check your inbox.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to request reset email",
      );
    } finally {
      setResetPending(false);
    }
  }

  async function addPasskey() {
    setPasskeyPending(true);
    try {
      const result = await authClient.passkey.addPasskey({
        name: passkeyName.trim() || undefined,
      });

      if (result.error) {
        throw new Error(result.error.message || "Unable to register passkey");
      }

      setPasskeyName("");
      toast.success("Passkey added");
      await passkeyQuery.refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to register passkey",
      );
    } finally {
      setPasskeyPending(false);
    }
  }

  async function deletePasskey(passkeyId: string) {
    setPasskeyDeletingById((prev) => ({ ...prev, [passkeyId]: true }));
    try {
      const result = (await authClient.$fetch("/passkey/delete-passkey", {
        method: "POST",
        body: { id: passkeyId },
        throw: false,
      })) as AuthResult;

      if (result?.error) {
        throw new Error(resolveError(result, "Unable to remove passkey"));
      }

      toast.success("Passkey removed");
      await passkeyQuery.refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to remove passkey",
      );
    } finally {
      setPasskeyDeletingById((prev) => {
        const next = { ...prev };
        delete next[passkeyId];
        return next;
      });
    }
  }

  async function enableTwoFactor() {
    if (!twoFactorPassword.trim()) {
      toast.error("Password is required.");
      return;
    }
    setTwoFactorPending(true);
    try {
      const result = (await authClient.$fetch("/two-factor/enable", {
        method: "POST",
        body: {
          password: twoFactorPassword,
        },
        throw: false,
      })) as AuthResult<{ totpURI: string; backupCodes: string[] }>;

      if (result?.error || !result?.data) {
        throw new Error(resolveError(result, "Unable to start 2FA setup"));
      }

      setTotpURI(result.data.totpURI);
      setBackupCodes(result.data.backupCodes ?? []);
      toast.success("2FA setup started. Verify the TOTP code to finish.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to start 2FA setup",
      );
    } finally {
      setTwoFactorPending(false);
    }
  }

  async function verifyTwoFactorCode() {
    if (!twoFactorCode.trim()) {
      toast.error("Verification code is required.");
      return;
    }
    setTwoFactorPending(true);
    try {
      const result = (await authClient.$fetch("/two-factor/verify-totp", {
        method: "POST",
        body: {
          code: twoFactorCode,
          trustDevice: false,
        },
        throw: false,
      })) as AuthResult;

      if (result?.error) {
        throw new Error(resolveError(result, "Unable to verify 2FA code"));
      }

      setTwoFactorEnabled(true);
      setTwoFactorCode("");
      toast.success("2FA enabled");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to verify 2FA code",
      );
    } finally {
      setTwoFactorPending(false);
    }
  }

  async function regenerateBackupCodes() {
    if (!twoFactorPassword.trim()) {
      toast.error("Password is required.");
      return;
    }
    setTwoFactorPending(true);
    try {
      const result = (await authClient.$fetch(
        "/two-factor/generate-backup-codes",
        {
          method: "POST",
          body: { password: twoFactorPassword },
          throw: false,
        },
      )) as AuthResult<{ backupCodes: string[] }>;

      if (result?.error || !result?.data) {
        throw new Error(
          resolveError(result, "Unable to generate backup codes"),
        );
      }

      setBackupCodes(result.data.backupCodes ?? []);
      toast.success("Backup codes regenerated");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to generate backup codes",
      );
    } finally {
      setTwoFactorPending(false);
    }
  }

  async function disableTwoFactor() {
    if (!twoFactorPassword.trim()) {
      toast.error("Password is required.");
      return;
    }
    setTwoFactorPending(true);
    try {
      const result = (await authClient.$fetch("/two-factor/disable", {
        method: "POST",
        body: { password: twoFactorPassword },
        throw: false,
      })) as AuthResult;

      if (result?.error) {
        throw new Error(resolveError(result, "Unable to disable 2FA"));
      }

      setTwoFactorEnabled(false);
      setTotpURI("");
      setBackupCodes([]);
      setTwoFactorCode("");
      toast.success("2FA disabled");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to disable 2FA",
      );
    } finally {
      setTwoFactorPending(false);
    }
  }

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="no-scrollbar w-full justify-start overflow-x-auto">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>
      <TabsContent value="profile" className="mt-4">
        {/* <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold">Profile</h2>
          <Badge variant="outline" className="uppercase">
            {initialUser.role}
          </Badge>
        </div> */}
        <Frame className="text-sm">
          <FramePanel className="space-y-3">
            <form onSubmit={submitProfile} className="space-y-3">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="settings-name">Name</FieldLabel>
                  <Input
                    id="settings-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    minLength={2}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="settings-email">Email</FieldLabel>
                  <Input
                    id="settings-email"
                    value={initialUser.email}
                    readOnly
                    disabled
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="settings-image">
                    Profile Image URL
                  </FieldLabel>
                  <Input
                    id="settings-image"
                    type="url"
                    placeholder="https://example.com/avatar.png"
                    value={image}
                    onChange={(event) => setImage(event.target.value)}
                  />
                </Field>
              </FieldGroup>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="submit" disabled={profilePending}>
                  {profilePending ? "Saving..." : "Update Profile"}
                </Button>
              </div>
            </form>
          </FramePanel>
        </Frame>
      </TabsContent>

      <TabsContent value="password" className="mt-4">
        <Frame className="text-sm">
          <FramePanel className="space-y-3">
            <form onSubmit={submitChangePassword} className="space-y-3">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="settings-current-password">
                    Current Password
                  </FieldLabel>
                  <Input
                    id="settings-current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="settings-new-password">
                    New Password
                  </FieldLabel>
                  <Input
                    id="settings-new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    minLength={8}
                    required
                  />
                </Field>
              </FieldGroup>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="submit" disabled={passwordPending}>
                  {passwordPending ? "Updating..." : "Change Password"}
                </Button>
              </div>
            </form>
            <Separator />
            <div className="space-y-2">
              <FieldDescription>
                Send a reset-password email to your account for recovery.
              </FieldDescription>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => void requestPasswordReset()}
                  disabled={resetPending}
                >
                  {resetPending ? "Requesting..." : "Request Reset Email"}
                </Button>
              </div>
            </div>
          </FramePanel>
        </Frame>
      </TabsContent>

      <TabsContent value="security" className="mt-4">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Passkeys</h2>
            <div className="flex items-center gap-2">
              <Input
                value={passkeyName}
                onChange={(event) => setPasskeyName(event.target.value)}
                placeholder="Passkey name (optional)"
                className="md:max-w-sm"
              />
              <Button
                onClick={() => void addPasskey()}
                disabled={passkeyPending}
              >
                {passkeyPending ? "Registering..." : "Add Passkey"}
              </Button>
            </div>
          </div>

          <Frame className="text-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Device Type</TableHead>
                  <TableHead>Backed Up</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {passkeyQuery.isPending ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Loading passkeys...
                    </TableCell>
                  </TableRow>
                ) : passkeys.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No passkeys registered.
                    </TableCell>
                  </TableRow>
                ) : (
                  passkeys.map((passkey) => (
                    <TableRow key={passkey.id}>
                      <TableCell>{passkey.name || "Unnamed passkey"}</TableCell>
                      <TableCell>{passkey.deviceType}</TableCell>
                      <TableCell>{passkey.backedUp ? "Yes" : "No"}</TableCell>
                      <TableCell>
                        {new Date(passkey.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => void deletePasskey(passkey.id)}
                          disabled={Boolean(passkeyDeletingById[passkey.id])}
                        >
                          {passkeyDeletingById[passkey.id]
                            ? "Removing..."
                            : "Remove"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Frame>

          <div>
            <h2 className="text-base font-semibold">Social Login</h2>
            <FieldDescription>
              Link Google or GitHub to this account so you can sign in directly
              with social login.
            </FieldDescription>
          </div>
          <Frame className="text-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Connected At</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linkedAccountsPending ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Loading linked accounts...
                    </TableCell>
                  </TableRow>
                ) : (
                  socialProviders.map((provider) => {
                    const linkedAccount = linkedByProvider[provider.id];
                    const isLinked = Boolean(linkedAccount);
                    const linking = socialLinkPendingByProvider[provider.id];
                    const unlinking =
                      socialUnlinkPendingByProvider[provider.id];

                    return (
                      <TableRow key={provider.id}>
                        <TableCell>{provider.label}</TableCell>
                        <TableCell>
                          <Badge variant={isLinked ? "default" : "outline"}>
                            {isLinked ? "Linked" : "Not Linked"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {linkedAccount
                            ? new Date(linkedAccount.createdAt).toLocaleString()
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {isLinked ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                void unlinkSocialProvider(provider.id)
                              }
                              disabled={unlinking}
                            >
                              {unlinking ? "Disconnecting..." : "Disconnect"}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() =>
                                void linkSocialProvider(provider.id)
                              }
                              disabled={linking}
                            >
                              {linking
                                ? "Connecting..."
                                : `Connect ${provider.label}`}
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

          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold">
              Two-Factor Authentication
            </h2>
            <Badge variant={twoFactorEnabled ? "default" : "outline"}>
              {twoFactorEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <Frame className="text-sm">
            <FramePanel className="space-y-3">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="settings-2fa-password">
                    Account Password
                  </FieldLabel>
                  <Input
                    id="settings-2fa-password"
                    type="password"
                    value={twoFactorPassword}
                    onChange={(event) =>
                      setTwoFactorPassword(event.target.value)
                    }
                    placeholder="Required for 2FA actions"
                  />
                </Field>
              </FieldGroup>

              {!twoFactorEnabled ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={() => void enableTwoFactor()}
                    disabled={twoFactorPending}
                  >
                    {twoFactorPending ? "Starting..." : "Start 2FA Setup"}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => void regenerateBackupCodes()}
                    disabled={twoFactorPending}
                  >
                    {twoFactorPending
                      ? "Working..."
                      : "Regenerate Backup Codes"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => void disableTwoFactor()}
                    disabled={twoFactorPending}
                  >
                    {twoFactorPending ? "Working..." : "Disable 2FA"}
                  </Button>
                </div>
              )}

              {totpURI ? (
                <div className="space-y-2 rounded-lg border p-3">
                  <p className="font-medium">Authenticator setup URI</p>
                  <p className="break-all text-xs text-muted-foreground">
                    {totpURI}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={twoFactorCode}
                      onChange={(event) => setTwoFactorCode(event.target.value)}
                      placeholder="Enter 6-digit code"
                      className="w-44"
                    />
                    <Button
                      onClick={() => void verifyTwoFactorCode()}
                      disabled={twoFactorPending}
                    >
                      {twoFactorPending ? "Verifying..." : "Verify Code"}
                    </Button>
                  </div>
                </div>
              ) : null}

              {backupCodes.length > 0 ? (
                <div className="space-y-2 rounded-lg border p-3">
                  <p className="font-medium">Backup Codes</p>
                  <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                    {backupCodes.map((code) => (
                      <div
                        key={code}
                        className="rounded border bg-muted/40 px-2 py-1 font-mono"
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </FramePanel>
          </Frame>
        </div>
      </TabsContent>
    </Tabs>
  );
}
