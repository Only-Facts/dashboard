/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from "react";
import { LuOrbit } from "react-icons/lu";
import { dashboardApi, type DashboardTab, type Service, type Widget, type WidgetInput } from "../api/dashboardApi";
import { ApiError } from "../api/http";
import type { User } from "../api/authApi";
import { useAuth } from "../auth/Auth";
import ThemePicker from "./ThemePicker";
import WidgetHelp from "./WidgetHelp";
import ServiceIcon from "../widgets/ServiceIcon";


interface DashboardHeaderProps {
  user: User | null;
  theme: string;
  onThemeChange: (theme: string) => void;
  tab: DashboardTab;
  busy: boolean;
  onTabChange: (tab: DashboardTab) => void;
  onSignOut: () => void;
}

export function DashboardHeader({
  user,
  theme,
  onThemeChange,
  tab,
  busy,
  onTabChange,
  onSignOut,
}: DashboardHeaderProps) {
  return (
    <div className="workspace-header">
      <a className="orbit-brand" href="/" aria-label="Orbit home">
        <LuOrbit size={30} aria-hidden="true" />
        orbit
      </a>

      <nav aria-label="Dashboard sections" className="workspace-nav">
        <button onClick={() => onTabChange("overview")} aria-current={tab === "overview" ? "page" : undefined}>
          Overview
        </button>
        {user && (
          <button onClick={() => onTabChange("services")} aria-current={tab === "services" ? "page" : undefined}>
            Services
          </button>
        )}
      </nav>

      <div className="workspace-account">
        <ThemePicker theme={theme} onChange={onThemeChange} />
        <WidgetHelp />
        {user ? (
          <>
            <span className="account-avatar" title={user.username}>
              {user.username.slice(0, 2).toUpperCase()}
            </span>
            <button disabled={busy} onClick={onSignOut}>Sign out</button>
          </>
        ) : (
          <a href="/login">Sign in</a>
        )}
      </div>
    </div>
  );
}


interface ServiceListProps {
  services: Service[];
  busy: boolean;
  onToggle: (service: Service) => void;
}

export function ServiceList({ services, busy, onToggle }: ServiceListProps) {
  return (
    <section aria-label="Available services" className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {services.map((service) => (
        <ServiceCard key={service.name} service={service} busy={busy} onToggle={() => onToggle(service)} />
      ))}
    </section>
  );
}

interface ServiceCardProps {
  service: Service;
  busy: boolean;
  onToggle: () => void;
}

function ServiceCard({
  service,
  busy,
  onToggle,
}: ServiceCardProps) {
  return (
    <article className="service-card">
      <div className="flex items-start justify-between gap-3">
        <ServiceIcon service={service.name} />
        <span
          className={`text-xs font-medium ${
            service.connected ? "text-emerald-400" : "text-slate-500"
          }`}
        >
          {service.connected ? "Connected" : "Not connected"}
        </span>
      </div>

      <h2 className="mt-4 text-lg font-semibold text-white">
        {service.label}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        {service.widgets.map((widget) => widget.description).join(" · ")}
      </p>

      {service.name === "spotify" && window.location.hostname === "localhost" && !service.connected && (
        <p className="service-unavailable">For Spotify, <a href="http://127.0.0.1:8080" className="underline">open Orbit at 127.0.0.1</a> and sign in before connecting.</p>
      )}
      {!service.available && (
        <p className="service-unavailable">
          {service.oauth
            ? `${service.label} connection setup is required by the server administrator.`
            : "Connection unavailable."}
        </p>
      )}

      <button
        type="button"
        disabled={busy || !service.available}
        onClick={onToggle}
        className={service.connected ? "secondary-button service-action" : "primary-button service-action"}
      >
        {service.connected
          ? "Disconnect"
          : service.oauth
            ? `Connect with ${service.label} ↗`
            : "Connect service"}
      </button>
    </article>
  );
}


export function useDashboard() {
  const { user, refreshUser } = useAuth();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const service = params.get("service") ?? (params.has("github") ? "github" : params.has("twitch") ? "twitch" : "");
    const result = params.get(service) ?? params.get("status");
    const label = service === "spotify" ? "Spotify" : service === "twitch" ? "Twitch" : service === "github" ? "GitHub" : service;
    if (result === "connected") return `${label} is connected. You can now add ${label} widgets.`;
    if (result === "failed") return `${label} could not be connected. Try again from the Services page.`;
    return "";
  });

  async function load() {
    const [nextWidgets, nextServices] = await fetchResources(Boolean(user));
    setWidgets(nextWidgets);
    setServices(nextServices);
    setError("");
  }

  useEffect(() => {
    let active = true;
    void fetchResources(Boolean(user))
      .then(([nextWidgets, nextServices]) => {
        if (!active) return;
        setWidgets(nextWidgets);
        setServices(nextServices);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load the dashboard.");
      })
      .finally(() => { if (active) setLoading(false); });
    if (window.location.search) window.history.replaceState(window.history.state, "", "/");
    return () => { active = false; };
  }, [user]);

  async function run(task: () => Promise<void>) {
    if (busy) return false;
    if (notice === "Layout saved.") setNotice("");
    setBusy(true);
    setError("");
    try {
      await task();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      if (err instanceof ApiError && err.status === 401) await refreshUser();
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function move(index: number, direction: number) {
    const destination = index + direction;
    if (busy || destination < 0 || destination >= widgets.length) return;
    const reordered = [...widgets];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(destination, 0, moved);
    setWidgets(reordered);
    const saved = await run(async () => {
      if (user) await dashboardApi.order(reordered.map((widget) => widget.id));
      else persistGuestWidgets(reordered);
    });
    if (saved) setNotice("Layout saved.");
    else setWidgets(widgets);
  }

  async function remove(widget: Widget) {
    if (!window.confirm(`Delete “${widget.title}”?`)) return false;
    return run(async () => {
      if (user) await dashboardApi.remove(widget.id);
      const remaining = widgets.filter((item) => item.id !== widget.id);
      if (!user) persistGuestWidgets(remaining);
      setWidgets(remaining);
    });
  }

  async function save(input: WidgetInput, editing: Widget | "new") {
    if (!user && !services.some(service => service.name === input.service && !service.oauth && service.connected)) {
      throw new Error("This widget requires signing in and connecting an account.");
    }
    if (editing === "new" && widgets.length >= 30) throw new Error("A dashboard supports up to 30 widgets.");
    const saved = user
      ? await dashboardApi.save(input, editing === "new" ? undefined : editing.id)
      : { ...input, id: editing === "new" ? Math.min(0, ...widgets.map(widget => widget.id)) - 1 : editing.id,
          position: editing === "new" ? widgets.length : editing.position };
    const next = editing === "new" ? [...widgets, saved] : widgets.map(widget => widget.id === saved.id ? saved : widget);
    if (!user) persistGuestWidgets(next);
    setWidgets(next);
  }

  async function toggle(service: Service) {
    if (service.connected && !window.confirm(`Disconnect ${service.label}? Its widgets will also be removed.`)) return;
    await run(async () => {
      if (service.connected) {
        await dashboardApi.disconnect(service.name);
      } else {
        const result = await dashboardApi.connect(service.name);
        if (result.url) {
          window.location.assign(result.url);
          return;
        }
      }
      await load();
    });
  }

  return { widgets, services, loading, busy, error, notice, setNotice, load, run, move, remove, save, toggle };
}

function fetchResources(authenticated: boolean) {
  return authenticated
    ? Promise.all([dashboardApi.widgets(), dashboardApi.services()])
    : fetchGuestResources();
}


const GUEST_WIDGETS_KEY = "orbit-guest-widgets-v1";

function persistGuestWidgets(widgets: Widget[]) {
  localStorage.setItem(GUEST_WIDGETS_KEY, JSON.stringify(widgets.map((widget, position) => ({ ...widget, position }))));
}

async function fetchGuestResources(): Promise<[Widget[], Service[]]> {
  const services = (await dashboardApi.publicServices()).filter(service => !service.oauth && service.connected && service.available);
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(GUEST_WIDGETS_KEY) ?? "null");
    if (Array.isArray(stored) && stored.length <= 30 && stored.every(widget =>
      widget && Number.isSafeInteger(widget.id) && widget.id < 0 && typeof widget.title === "string" &&
      Number.isInteger(widget.refreshSeconds) && widget.refreshSeconds >= 60 && widget.refreshSeconds <= 86400 &&
      widget.config && typeof widget.config === "object" && Object.values(widget.config).every(value => typeof value === "string") &&
      services.some(service => service.name === widget.service && service.widgets.some(type => type.name === widget.type))
    ) && new Set(stored.map(widget => widget.id)).size === stored.length) {
      return [stored as Widget[], services];
    }
  } catch { /* Fall back to the starter dashboard if storage is unavailable or invalid. */ }
  return [await dashboardApi.publicWidgets(), services];
}
