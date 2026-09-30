interface DashboardEmptyStateProps {
  canAddWidget: boolean;
  onAdd: () => void;
  onOpenServices: () => void;
}

export default function DashboardEmptyState({ canAddWidget, onAdd, onOpenServices }: DashboardEmptyStateProps) {
  return (
    <section className="mt-7 rounded-xl border border-dashed border-slate-700 bg-slate-900 p-8 text-center sm:p-12">
      <h2 className="text-xl font-semibold text-white">Your dashboard is empty</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
        Add a configurable widget for weather, GitHub, exchange rates, Hacker News,
        air quality, or Steam. You can create multiple instances with different settings.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button type="button" disabled={!canAddWidget} onClick={onAdd}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40">
          Add first widget
        </button>
        <button type="button" onClick={onOpenServices}
          className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium hover:bg-slate-800">
          View services
        </button>
      </div>
    </section>
  );
}
