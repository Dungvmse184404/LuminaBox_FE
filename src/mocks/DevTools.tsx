import { useAuth } from "@/features/auth/AuthContext";
import type { CurrentUser, UserRole } from "@/features/auth/types";
import { cn } from "@/lib/cn";

const USERS: Record<UserRole, CurrentUser> = {
  User: { id: "00000000-0000-7000-8000-000000000001", fullName: "Demo User", email: "user@demo.test", role: "User" },
  Organization: { id: "00000000-0000-7000-8000-000000000002", fullName: "Demo Organizer", email: "organizer@demo.test", role: "Organization" },
  Manager: { id: "00000000-0000-7000-8000-000000000003", fullName: "Demo Manager", email: "manager@demo.test", role: "Manager" },
};

export default function DevTools() {
  const { user, setUser } = useAuth();

  return (
    <div data-guide-ignore className="fixed bottom-4 left-4 z-[70] max-w-[calc(100vw-2rem)] overflow-x-auto flex items-center gap-1 rounded-full border border-dashed border-gold bg-card/95 px-1.5 py-1 text-[11px] shadow-pop">
      <span className="px-1 font-semibold text-ink-soft">Mock</span>
      {(Object.keys(USERS) as UserRole[]).map((role) => (
        <button
          key={role}
          type="button"
          data-mock-role={role}
          onClick={() => setUser(USERS[role])}
          className={cn("rounded-full px-2 py-0.5 font-medium transition", user?.role === role ? "bg-primary text-white" : "text-ink-soft hover:bg-cream-dark")}
        >
          {role}
        </button>
      ))}
      <button
        type="button"
        data-mock-role="Guest"
        onClick={() => setUser(null)}
        className={cn("rounded-full px-2 py-0.5 font-medium transition", !user ? "bg-ink text-white" : "text-ink-soft hover:bg-cream-dark")}
      >
        Guest
      </button>
    </div>
  );
}
