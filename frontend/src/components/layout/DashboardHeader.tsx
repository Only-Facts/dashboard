import { LuOrbit } from "react-icons/lu";
import type { User } from "../../types/auth";
import type { DashboardTab } from "../../types/dashboard";

interface DashboardHeaderProps {
  user: User;
  tab: DashboardTab;
  busy: boolean;
  onTabChange: (tab: DashboardTab) => void;
  onSignOut: () => void;
}

export default function DashboardHeader({
  user,
  tab,
  busy,
  onTabChange,
  onSignOut,
}: DashboardHeaderProps) {
  return (
    <header className="workspace-header">
      <a className="orbit-brand" href="/" aria-label="Orbit home">
        <LuOrbit size={30} aria-hidden="true" />
        orbit<span className="brand-divider" />
        <span className="workspace-label">Personal workspace</span>
      </a>

      <nav aria-label="Dashboard sections" className="workspace-nav">
        <button onClick={() => onTabChange("overview")} aria-current={tab === "overview" ? "page" : undefined}>
          Overview
        </button>
        <button onClick={() => onTabChange("services")} aria-current={tab === "services" ? "page" : undefined}>
          Services
        </button>
      </nav>

      <div className="workspace-account">
        <span className="account-avatar" title={user.username}>
          {user.username.slice(0, 2).toUpperCase()}
        </span>
        <button disabled={busy} onClick={onSignOut}>Sign out</button>
      </div>
    </header>
  );
}
