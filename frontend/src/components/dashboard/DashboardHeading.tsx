import type { DashboardTab } from "../../types/dashboard";

interface DashboardHeadingProps {
  tab: DashboardTab;
  loading: boolean;
  busy: boolean;
  canAddWidget: boolean;
  onAdd: () => void;
}

export default function DashboardHeading({ tab, loading, busy, canAddWidget, onAdd }: DashboardHeadingProps) {
  const overview = tab === "overview";

  return (
    <header className="workspace-heading">
      <div>
        <p className="eyebrow">{overview ? "YOUR DAILY PERSPECTIVE" : "MAKE IT YOURS"}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
          {overview ? "Your space. Your way." : "Connect your services"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          {overview
            ? "Everything you follow, in one place. Arrange it to feel like you."
            : "Bring your favorite sources together. Connect a service to start adding widgets."}
        </p>
      </div>

      {overview && (
        <button type="button" disabled={loading || busy || !canAddWidget} onClick={onAdd} className="primary-button">
          + Add widget
        </button>
      )}
    </header>
  );
}
