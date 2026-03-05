import { eq } from "drizzle-orm";

import { SettingsCenter } from "@/components/layout/dashboard/settings-center";
import { isUserRole } from "@/lib/constants/rbac";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema";
import { requireSession } from "@/lib/session";

export default async function SettingsPage() {
  const { user } = await requireSession();
  const [account] = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      image: userTable.image,
      role: userTable.role,
      twoFactorEnabled: userTable.twoFactorEnabled,
    })
    .from(userTable)
    .where(eq(userTable.id, user.id))
    .limit(1);

  const initialUser = account ?? {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ?? null,
    role: user.role,
    twoFactorEnabled: false,
  };
  const normalizedInitialUser = {
    ...initialUser,
    role: isUserRole(initialUser.role) ? initialUser.role : "client",
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <SettingsCenter initialUser={normalizedInitialUser} />
    </div>
  );
}
