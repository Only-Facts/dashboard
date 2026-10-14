import { useEffect, useRef, useState } from "react";
import { LuTrash2 } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/Auth";
import { dashboardApi, type DashboardTab } from "../api/dashboardApi";
import { DashboardHeader, ServiceList, useDashboard } from "../dashboard/Dashboard";
import { useThemeColor } from "../dashboard/ThemePicker";
import WidgetGallery from "../widgets/WidgetGallery";
import WidgetGrid from "../widgets/WidgetGrid";

export default function DashboardPage() {
  const { user, signOut, refreshUser } = useAuth();
  const navigate = useNavigate();
  const dashboard = useDashboard();
  const { theme, choose } = useThemeColor();
  const { widgets, services, loading, busy, error, notice, run } = dashboard;
  const [tab, setTab] = useState<DashboardTab>("overview");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const topbar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = topbar.current;
    if (!element) return;
    const measure = () => {
      const height = getComputedStyle(element).position === "sticky" ? element.getBoundingClientRect().height : 0;
      document.documentElement.style.setProperty("--workspace-topbar-height", `${height}px`);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      document.documentElement.style.removeProperty("--workspace-topbar-height");
    };
  }, []);

  const canAddWidget = services.length > 0 && widgets.length < 30;
  const overview = tab === "overview";

  return (
    <div className="dashboard-shell" data-theme={theme}>
      <a href="#main-content" className="fixed left-3 top-[-100px] z-50 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-950 focus:top-3">
        Skip to content
      </a>
      <div className="workspace-topbar" role="banner" ref={topbar}>
      <DashboardHeader theme={theme} onThemeChange={choose} user={user} tab={tab} busy={busy} onTabChange={setTab} onSignOut={() => void run(async () => {
        await signOut();
        navigate("/login", { replace: true });
      })} />

      <div className="workspace-topbar__heading">
        <div className="workspace-container">
          <div className="workspace-heading">
            <h1>{overview ? "Dashboard" : "Connect your services"}</h1>
            {overview && <div className="workspace-heading__actions">
              <button type="button" disabled={loading || busy || !canAddWidget} onClick={() => setGalleryOpen(true)} className="primary-button">+ Add widget</button>
              {widgets.length > 0 && <div data-trash-zone className="widget-trash-zone" aria-label="Drag a widget here to delete it">
                <LuTrash2 aria-hidden="true" />
                <span>Drop to delete</span>
              </div>}
            </div>}
          </div>
        </div>
      </div>
      </div>

      <main id="main-content" tabIndex={-1} className="workspace-main">
        <div className="workspace-container">


          {error && (
            <div role="alert" className="dashboard-message dashboard-message--error">
              <span className="mr-auto">{error}</span>
              <button type="button" disabled={busy} onClick={() => void run(() => dashboard.load())} className="font-medium underline">Retry</button>
              <button type="button" onClick={() => void refreshUser()} className="font-medium underline">Check session</button>
            </div>
          )}
          {notice && (
            <div role="status" className={notice === "Layout saved." ? "layout-toast" : "dashboard-message"}>
              <span className="mr-auto">{notice}</span>
              <button type="button" onClick={() => dashboard.setNotice("")} aria-label="Dismiss notification" className="rounded px-2 py-1 hover:bg-emerald-900">✕</button>
            </div>
          )}

          {loading ? (
            <p role="status" className="mt-8 text-sm text-slate-400">Loading your workspace…</p>
          ) : overview ? (
            <>
              {widgets.length === 0 ? (
                <section className="dashboard-empty">
                  <h2 className="text-xl font-semibold text-white">Your dashboard is empty</h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
                    Add your first widget to personalize your dashboard.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <button type="button" disabled={!canAddWidget || busy} onClick={() => setGalleryOpen(true)}
                      className="primary-button">Add first widget</button>
                    {user && <button type="button" onClick={() => setTab("services")}
                      className="secondary-button">View services</button>}
                  </div>
                </section>
              ) : (
                <WidgetGrid onUpdate={(widget, input) => dashboard.save(input, widget)} widgets={widgets} busy={busy}
                  onMove={(index, direction) => void dashboard.move(index, direction)}
                  onDelete={(widget) => dashboard.remove(widget)} />
              )}
            </>
          ) : (
            <ServiceList services={services} busy={busy} onToggle={(service) => void dashboard.toggle(service)} />
          )}

        </div>
      </main>
      {galleryOpen && <WidgetGallery
        services={services}
        onConnect={async (service) => {
          const result = await dashboardApi.connect(service.name);
          if (result.url) window.location.assign(result.url);
          else await dashboard.load();
        }}
        onClose={() => setGalleryOpen(false)}
        onSelect={(service, widget) => dashboard.save({
          service: service.name,
          type: widget.name,
          title: service.label,
          config: Object.fromEntries(widget.params.map((param) => [param.name, param.defaultValue])),
          refreshSeconds: 300,
        }, "new")}
      />}
    </div>
  );
}
