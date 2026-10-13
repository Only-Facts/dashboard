import ServiceIcon from "./ServiceIcon";
import type { Service } from "../types/dashboard";

interface ServiceCardProps {
  service: Service;
  busy: boolean;
  onToggle: () => void;
}

export default function ServiceCard({
  service,
  busy,
  onToggle,
}: ServiceCardProps) {
  return (
    <article className="flex flex-col rounded-xl border border-slate-800 bg-slate-900 p-5">
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
      <p className="mt-3 text-xs text-slate-500">
        {service.oauth
          ? "OAuth 2.0 connection. Credentials are never stored in plaintext."
          : "No external account required."}
      </p>

      {!service.available && (
        <p className="mt-3 rounded-lg border border-amber-900 bg-amber-950 p-3 text-xs leading-5 text-amber-200">
          GitHub OAuth is not configured on the server. Add the variables from
          .env.example to enable it.
        </p>
      )}

      <button
        type="button"
        disabled={busy || !service.available}
        onClick={onToggle}
        className={`mt-5 rounded-lg px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
          service.connected
            ? "border border-slate-700 text-slate-300 hover:bg-slate-800"
            : "bg-blue-600 text-white hover:bg-blue-500"
        }`}
      >
        {service.connected
          ? "Disconnect"
          : service.oauth
            ? "Connect with GitHub ↗"
            : "Connect service"}
      </button>
    </article>
  );
}
