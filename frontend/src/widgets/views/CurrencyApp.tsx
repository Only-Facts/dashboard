import { useState, type FormEvent } from "react";
import { LuArrowDownUp, LuRefreshCw } from "react-icons/lu";
import type { Widget, WidgetData, WidgetInput } from "../../api/dashboardApi";
import { number } from "../WidgetUtils";

const currencies = ["EUR", "USD", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY", "INR", "SEK", "NOK", "DKK", "PLN", "BRL", "NZD", "ZAR", "KRW", "MXN"];
interface Props {
  widget: Widget;
  data: WidgetData | null;
  loading: boolean;
  error: string;
  busy: boolean;
  refresh: () => void;
  onUpdate: (input: WidgetInput) => Promise<void>;
}

export function CurrencyApp(props: Props) {
  return <CurrencyAppContent key={JSON.stringify([props.widget.config, props.widget.title, props.widget.refreshSeconds])} {...props} />;
}

function CurrencyAppContent({ widget, data, loading, error, busy, refresh, onUpdate }: Props) {
  const savedBase = widget.config.base ?? "EUR";
  const savedTarget = widget.config.target ?? "USD";
  const savedAmount = widget.type === "convert" ? Number(widget.config.amount) : 1;
  const [base, setBase] = useState(savedBase);
  const [target, setTarget] = useState(savedTarget);
  const [amount, setAmount] = useState(String(savedAmount));
  const [title, setTitle] = useState(widget.title);
  const [interval, setInterval] = useState(widget.refreshSeconds);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const disabled = busy || saving;
  const quantity = Number(amount);
  const valid = amount !== "" && Number.isInteger(quantity) && quantity >= 1 && quantity <= 1_000_000;
  const samePair = base === savedBase && target === savedTarget;
  const savedValue = number(data?.items[0]?.value);
  const rate = savedValue !== null && savedAmount > 0 ? savedValue / savedAmount : null;
  const result = valid && samePair && rate !== null ? quantity * rate : null;
  const date = data?.items.find(item => item.label === "Rate date")?.value.split(" · ")[0];
  const codes = Array.from(new Set([...currencies, savedBase, savedTarget]));

  async function save(input: WidgetInput) {
    if (disabled) return;
    setSaving(true);
    setSaveError("");
    try { await onUpdate(input); }
    catch (err) { setSaveError(err instanceof Error ? err.message : "Unable to save conversion."); }
    finally { setSaving(false); }
  }

  function convert(event: FormEvent) {
    event.preventDefault();
    if (!valid) return;
    void save({ service: "currency", type: quantity === 1 ? "rate" : "convert", title: widget.title,
      config: { base, target, ...(quantity === 1 ? {} : { amount: String(quantity) }) }, refreshSeconds: widget.refreshSeconds });
  }

  return <div className="currency-app">
    <form className="currency-converter" onSubmit={convert}>
      <div className="currency-entry">
        <label className="currency-amount">From<input aria-label="Amount to convert" type="number" inputMode="numeric" min={1} max={1_000_000} step={1} required value={amount} disabled={disabled} onChange={event => setAmount(event.target.value)} /></label>
        <select aria-label="From currency" value={base} disabled={disabled} onChange={event => setBase(event.target.value)}>{codes.map(code => <option key={code}>{code}</option>)}</select>
      </div>
      <div className="currency-actions">
        <button className="currency-swap" type="button" aria-label="Swap currencies" title="Swap currencies" disabled={disabled || base === target} onClick={() => { setBase(target); setTarget(base); }}><LuArrowDownUp aria-hidden="true" /></button>
        <button className="currency-refresh" type="button" aria-label="Refresh exchange rate" title="Refresh exchange rate" onClick={refresh} disabled={loading || saving}><LuRefreshCw aria-hidden="true" /></button>
      </div>
      <div className="currency-entry">
        <div className="currency-amount"><span>To</span><output aria-label="Converted amount" aria-live="polite">{loading && !data ? "…" : result === null ? "—" : result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</output></div>
        <select aria-label="To currency" value={target} disabled={disabled} onChange={event => setTarget(event.target.value)}>{codes.map(code => <option key={code}>{code}</option>)}</select>
      </div>
      <button className="currency-submit" type="submit" disabled={disabled || !valid}>{saving ? "Saving…" : "Convert"}</button>
    </form>
    {date && samePair && <p className="currency-rate-date">Reference rate · {date}</p>}
    {error && <p role="alert" className="widget-error">{error}</p>}
    {saveError && <p role="alert" className="widget-error">{saveError}</p>}
    {!loading && !data && !error && <p role="status">No rate available. Try refreshing.</p>}
    <details className="currency-preferences">
      <summary>Customize</summary>
      <form onSubmit={event => { event.preventDefault(); void save({ service: widget.service, type: widget.type, config: widget.config, title: title.trim(), refreshSeconds: interval }); }}>
        <label>Widget name<input required maxLength={80} value={title} disabled={disabled} onChange={event => setTitle(event.target.value)} /></label>
        <label>Refresh every (seconds)<input type="number" required min={60} max={86400} step={1} value={interval} disabled={disabled} onChange={event => setInterval(Number(event.target.value))} /></label>
        <button className="currency-submit" type="submit" disabled={disabled || !title.trim()}>Save preferences</button>
      </form>
    </details>
  </div>;
}
