import { SettingsCenter } from "@/components/layout/dashboard/settings-center";
import { isUserRole } from "@/lib/constants/rbac";
import { requireSession } from "@/lib/session";
import {
  getBookingProfileForSettings,
  listBookingAppConnectionsForAdmin,
} from "@/lib/services/bookings";

export default async function SettingsPage() {
  const { user } = await requireSession();
  const [account, bookingApps] = await Promise.all([
    getBookingProfileForSettings(user),
    user.role === "admin"
      ? listBookingAppConnectionsForAdmin(user)
      : Promise.resolve([]),
  ]);

  const initialUser = account ?? {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ?? null,
    username: null,
    bio: null,
    phone: null,
    timezone: "UTC",
    bookingPageTitle: null,
    bookingPageDescription: null,
    bookingEnabled: true,
    role: user.role,
    twoFactorEnabled: false,
  };
  const normalizedInitialUser = {
    ...initialUser,
    role: isUserRole(initialUser.role) ? initialUser.role : "client",
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <SettingsCenter
        initialUser={normalizedInitialUser}
        initialBookingApps={bookingApps}
      />
    </div>
  );
}
