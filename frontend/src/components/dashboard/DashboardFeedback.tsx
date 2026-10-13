interface DashboardFeedbackProps {
  error: string;
  notice: string;
  busy: boolean;
  onRetry: () => void;
  onRefreshSession: () => void;
  onDismissNotice: () => void;
}

export default function DashboardFeedback(props: DashboardFeedbackProps) {
  return (
    <>
      {props.error && <ErrorBanner {...props} />}
      {props.notice && (
        <NoticeBanner notice={props.notice} onDismiss={props.onDismissNotice} />
      )}
    </>
  );
}

function ErrorBanner({ error, busy, onRetry, onRefreshSession }: DashboardFeedbackProps) {
  return (
    <div role="alert" className="mt-5 flex flex-wrap items-center gap-3 rounded-lg border border-red-900 bg-red-950 p-4 text-sm text-red-200">
      <span className="mr-auto">{error}</span>
      <button type="button" disabled={busy} onClick={onRetry} className="font-medium underline">Retry</button>
      <button type="button" onClick={onRefreshSession} className="font-medium underline">Check session</button>
    </div>
  );
}

function NoticeBanner({ notice, onDismiss }: { notice: string; onDismiss: () => void }) {
  const className = notice === "Layout saved."
    ? "layout-toast"
    : "mt-5 flex items-center gap-3 rounded-lg border border-emerald-900 bg-emerald-950 p-4 text-sm text-emerald-100";

  return (
    <div role="status" className={className}>
      <span className="mr-auto">{notice}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss notification" className="rounded px-2 py-1 hover:bg-emerald-900">✕</button>
    </div>
  );
}
