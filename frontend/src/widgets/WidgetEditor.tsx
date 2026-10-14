import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Service, Widget, WidgetInput, WidgetParam, WidgetType } from "../api/dashboardApi";

interface WidgetEditorProps {
  services: Service[];
  widget?: Widget;
  onSave: (input: WidgetInput) => Promise<void>;
  onClose: () => void;
}

const fieldClass = "mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50";
const currencies = ["EUR", "USD", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY", "INR", "SEK", "NOK", "DKK", "PLN", "BRL", "NZD", "ZAR", "KRW", "MXN"];
const maximums: Record<string, number> = { limit: 10, days: 7, amount: 1_000_000 };

export default function WidgetEditor({ services, widget, onSave, onClose }: WidgetEditorProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const connected = services.filter((service) => service.connected);
  const [service, setService] = useState(widget?.service ?? connected[0]?.name ?? "");
  const [type, setType] = useState(widget?.type ?? connected[0]?.widgets[0]?.name ?? "");
  const activeService = connected.find((item) => item.name === service);
  const selected = activeService?.widgets.find((item) => item.name === type);
  const [config, setConfig] = useState(widget?.config ?? defaults(selected));
  const [title, setTitle] = useState(widget?.title ?? selected?.description ?? "");
  const [refreshSeconds, setRefreshSeconds] = useState(widget?.refreshSeconds ?? 300);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);

  function choose(serviceName: string, typeName: string) {
    const definition = connected.find((item) => item.name === serviceName)?.widgets.find((item) => item.name === typeName);
    if (!definition) return;
    setService(serviceName);
    setType(typeName);
    setTitle(definition.description);
    setConfig(defaults(definition));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !selected) return;
    setBusy(true);
    setError("");
    try {
      await onSave({ service, type, title, config, refreshSeconds });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save widget.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog ref={dialog} aria-labelledby="widget-editor-title" onCancel={(event) => {
      event.preventDefault();
      if (!busy) onClose();
    }} className="m-auto max-h-[90vh] w-[min(94vw,34rem)] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-0 text-slate-100 shadow-2xl backdrop:bg-black/70">
      <form onSubmit={submit} className="p-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 id="widget-editor-title" className="text-xl font-semibold">{widget ? "Edit widget" : "Add widget"}</h2>
            <p className="mt-1 text-sm text-slate-400">Configure the data and refresh interval for this instance.</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close widget editor"
            className="rounded-md border border-slate-700 px-2.5 py-1.5 text-sm hover:bg-slate-800 disabled:opacity-40">✕</button>
        </header>

        {connected.length === 0 ? (
          <p className="mt-6 text-sm text-slate-300">Connect at least one service before adding a widget.</p>
        ) : (
          <div className="mt-6 space-y-4">
            <label className="block text-sm font-medium">
              Service
              <select value={service} disabled={busy} className={fieldClass} onChange={(event) => {
                const next = connected.find((item) => item.name === event.target.value);
                if (next?.widgets[0]) choose(next.name, next.widgets[0].name);
              }}>
                {connected.map((item) => <option key={item.name} value={item.name}>{item.label}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Widget type
              <select value={type} disabled={busy} onChange={(event) => choose(service, event.target.value)} className={fieldClass}>
                {activeService?.widgets.map((item) => <option key={item.name} value={item.name}>{item.description}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Title
              <input required maxLength={80} value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} />
            </label>
            {selected?.params.map((param) => (
              <ParameterField key={param.name} param={param} value={config[param.name] ?? ""} disabled={busy}
                onChange={(value) => setConfig((current) => ({ ...current, [param.name]: value }))} />
            ))}
            <label className="block text-sm font-medium">
              Refresh interval in seconds
              <input required type="number" min={60} max={86400} step={1} value={refreshSeconds}
                onChange={(event) => setRefreshSeconds(Number(event.target.value))} className={fieldClass} />
              <span className="mt-1 block text-xs font-normal text-slate-500">Minimum 60 seconds, maximum 24 hours.</span>
            </label>
            {error && <p role="alert" className="rounded-lg border border-red-900 bg-red-950 p-3 text-sm text-red-200">{error}</p>}
            <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
              <button type="button" onClick={onClose} disabled={busy}
                className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-40">Cancel</button>
              <button type="submit" disabled={busy || !selected}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40">
                {busy ? "Saving…" : "Save widget"}
              </button>
            </div>
          </div>
        )}
      </form>
    </dialog>
  );
}

function defaults(definition?: WidgetType) {
  return Object.fromEntries((definition?.params ?? []).map((param) => [param.name, param.defaultValue]));
}

function ParameterField({ param, value, disabled, onChange }: {
  param: WidgetParam;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium">
      {param.label}
      {param.name === "base" || param.name === "target" ? (
        <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={fieldClass}>
          {currencies.map((code) => <option key={code} value={code}>{code}</option>)}
        </select>
      ) : (
        <input required disabled={disabled} type={param.type === "integer" ? "number" : "text"}
          min={param.type === "integer" ? 1 : undefined} max={param.type === "integer" ? maximums[param.name] : undefined}
          maxLength={param.type === "string" ? 120 : undefined}
          placeholder={param.name === "game" ? "Search a Steam game…" : undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)} className={fieldClass} />
      )}
    </label>
  );
}
