import { useEffect, useRef, useState } from "react";
import type { Service, WidgetType } from "../api/dashboardApi";
import { defaultWidget, widgetRegistry } from "./registry";
import ServiceIcon from "./ServiceIcon";

interface WidgetGalleryProps {
  services: Service[];
  onSelect: (service: Service, widget: WidgetType) => Promise<void>;
  onClose: () => void;
  onConnect: (service: Service) => Promise<void>;
}

const serviceDefaults: Record<string, string> = {
  weather: "temperature", currency: "rate", news: "latest",
  air_quality: "aqi", steam: "players", twitch: "followed_live", spotify: "recently_played",
};

export default function WidgetGallery({
  services,
  onSelect,
  onClose,
  onConnect,
}: Readonly<WidgetGalleryProps>) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    element?.showModal();
    element?.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
    return () => {
      element?.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const query = search.trim().toLowerCase();

  const availableWidgets = services.flatMap((service) => {
    if (service.name === "github") return [];
    const widget = service.widgets.find(type => type.name === serviceDefaults[service.name]) ?? service.widgets[0];
    if (!widget) return [];
    const searchable = [service.label, ...service.widgets.flatMap(type => [type.name, type.description])].join(" ").toLowerCase();
    return !query || searchable.includes(query) ? [{ service, widget }] : [];
  });

  async function selectWidget(service: Service, widget: WidgetType) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (!service.connected) {
        await onConnect(service);
        return;
      }
      await onSelect(service, widget);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add widget.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <dialog
      ref={dialog}
      onKeyDown={event => {
        if (event.key === "Escape") {
          event.preventDefault();
          if (!busy) onClose();
          return;
        }
        if (event.key !== "Tab") return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href], select:not(:disabled), textarea:not(:disabled)'));
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}
      onClick={event => {
        if (event.target !== event.currentTarget || busy) return;
        const box = event.currentTarget.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
      }}
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}
      aria-modal="true"
      aria-labelledby="widget-gallery-title"
      className="auth-card widget-gallery-card"
      >
      <header className="auth-card__header">
        <div>
          <h2 id="widget-gallery-title" className="text-xl font-semibold">Add a widget</h2>
          <p className="mt-1 text-sm text-slate-400">Choose a widget to add it to your dashboard.</p>
        </div>
        <button type="button" onClick={onClose} disabled={busy} aria-label="Close widget gallery"
          className="auth-card__close">×</button>
      </header>

      <div className="auth-card__content">
        <label htmlFor="widget-search" className="mb-2 block text-sm font-medium text-slate-200">
          Find a widget
        </label>
        <input id="widget-search" type="search" value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search weather, Twitch, Spotify, currency..."
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30" />

        {error && <p role="alert" className="mt-4 rounded-lg border border-red-900 bg-red-950 p-3 text-sm text-red-200">{error}</p>}

        <div className="widget-gallery-grid">
      {availableWidgets.map(({ service, widget }) => {
          const definition =
            widgetRegistry[`${service.name}:${widget.name}`] ??
            defaultWidget;

          const Icon = definition.icon;

          return (
            <article
              key={`${service.name}:${widget.name}`}
              className="widget-gallery-item"
            >
              <div className="flex items-start justify-between">
                <span
                  className="
                    flex h-11 w-11 items-center justify-center
                    rounded-lg bg-slate-800 text-xl text-slate-100
                  "
                >
                  <Icon aria-hidden={true} />
                </span>

                <ServiceIcon service={service.name} />
              </div>
              <h3 className="mt-4 block text-sm font-semibold text-slate-100">{service.label}</h3>
              <span className="mt-1 block text-xs text-slate-500">{service.widgets.map(type => type.description).join(" · ")}</span>
              <span className="mt-3 block text-xs text-slate-400">
                {widget.params.length}{" "}
                {widget.params.length === 1 ? "option" : "options"}
              </span>
              {service.name === "spotify" && window.location.hostname === "localhost" && (
                <p className="mt-3 text-xs text-slate-400">For Spotify, <a className="underline" href="http://127.0.0.1:8080">open Orbit at 127.0.0.1</a> and sign in before connecting.</p>
              )}
              {!service.connected && (
                <p className="mt-3 text-xs text-slate-400">
                  {service.available
                    ? `Connect your ${service.label} account to add this widget.`
                    : `${service.label} setup is required before connecting. Configure the server credentials first.`}
                </p>
              )}
              <button type="button" aria-label={service.connected ? `Add ${service.label} widget` : service.available ? `Connect ${service.label}` : `${service.label} setup required`} onClick={() => void selectWidget(service, widget)} disabled={busy || (!service.connected && !service.available)}
                className="widget-gallery-add primary-button mt-4 w-full">
                {busy ? "Working…" : service.connected ? "Add widget" : service.available ? `Connect ${service.label}` : "Setup required"}
              </button>
            </article>
          );
        })}
          </div>

          {availableWidgets.length === 0 && (
            <div className="rounded-xl border border-slate-800 p-6 text-center">
              <p role="status" className="text-sm text-slate-400">No widgets match "{search}".</p>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
