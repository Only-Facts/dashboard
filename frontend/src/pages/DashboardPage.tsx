import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import DashboardFeedback from "../components/dashboard/DashboardFeedback";
import DashboardFooter from "../components/dashboard/DashboardFooter";
import DashboardHeading from "../components/dashboard/DashboardHeading";
import DashboardOverview from "../components/dashboard/DashboardOverview";
import ServiceList from "../components/dashboard/ServiceList";
import DashboardHeader from "../components/layout/DashboardHeader";
import WidgetEditor from "../components/WidgetEditor";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { useDashboardResources } from "../hooks/useDashboardResources";
import { useServiceOperations } from "../hooks/useServiceOperations";
import { useWidgetOperations } from "../hooks/useWidgetOperations";
import type { DashboardTab, Widget } from "../types/dashboard";
import { readGithubNotice } from "../utils/dashboard";

const MAX_WIDGETS = 30;

export default function DashboardPage() {
  const { user, signOut, refreshUser } = useAuth();
  const navigate = useNavigate();
  const resources = useDashboardResources();
  const action = useAsyncAction(refreshUser);
  const [tab, setTab] = useState<DashboardTab>("overview");
  const [notice, setNotice] = useState(readGithubNotice);
  const [editor, setEditor] = useState<Widget | "new" | null>(null);

  const run = async (task: () => Promise<void>) => {
    if (notice === "Layout saved.") setNotice("");
    return action.run(task);
  };

  const widgetOperations = useWidgetOperations({
    widgets: resources.widgets,
    setWidgets: resources.setWidgets,
    run,
    onLayoutSaved: () => setNotice("Layout saved."),
  });
  const serviceOperations = useServiceOperations({ reload: resources.load, run });

  useEffect(() => {
    if (window.location.search) {
      window.history.replaceState(window.history.state, "", "/");
    }
  }, []);

  if (!user) return null;

  const connectedCount = resources.services.filter((service) => service.connected).length;
  const canAddWidget = connectedCount > 0 && resources.widgets.length < MAX_WIDGETS;
  const error = action.error || resources.loadError;

  return (
    <div className="dashboard-shell">
      <a href="#main-content" className="fixed left-3 top-[-100px] z-50 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-950 focus:top-3">
        Skip to content
      </a>

      <DashboardHeader
        user={user}
        tab={tab}
        busy={action.busy}
        onTabChange={setTab}
        onSignOut={() => void run(async () => {
          await signOut();
          navigate("/login", { replace: true });
        })}
      />

      <main id="main-content" className="workspace-main">
        <div className="workspace-container">
          <DashboardHeading tab={tab} loading={resources.loading} busy={action.busy} canAddWidget={canAddWidget} onAdd={() => setEditor("new")} />
          <DashboardFeedback
            error={error}
            notice={notice}
            busy={action.busy}
            onRetry={() => void run(resources.load)}
            onRefreshSession={() => void refreshUser()}
            onDismissNotice={() => setNotice("")}
          />

          {resources.loading ? (
            <p role="status" className="mt-8 text-sm text-slate-400">Loading your workspace…</p>
          ) : tab === "overview" ? (
            <DashboardOverview
              widgets={resources.widgets}
              services={resources.services}
              busy={action.busy}
              canAddWidget={canAddWidget && !action.busy}
              onAdd={() => setEditor("new")}
              onOpenServices={() => setTab("services")}
              onEdit={setEditor}
              onMove={(index, direction) => void widgetOperations.move(index, direction)}
              onDelete={(widget) => void widgetOperations.remove(widget)}
            />
          ) : (
            <ServiceList services={resources.services} busy={action.busy} onToggle={(service) => void serviceOperations.toggle(service)} />
          )}

          <DashboardFooter />
        </div>
      </main>

      {editor && (
        <WidgetEditor
          services={resources.services}
          widget={editor === "new" ? undefined : editor}
          onClose={() => setEditor(null)}
          onSave={(input) => widgetOperations.save(input, editor)}
        />
      )}
    </div>
  );
}
