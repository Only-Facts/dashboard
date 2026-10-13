import type { WidgetParam } from "../../types/dashboard";
import { CURRENCY_CODES, numberBounds, widgetFieldClass } from "../../utils/widgetEditor";

interface ParameterFieldProps {
  param: WidgetParam;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

export default function ParameterField({ param, value, disabled, onChange }: ParameterFieldProps) {
  if (param.name === "base" || param.name === "target") {
    return (
      <label className="block text-sm font-medium">
        {param.label}
        <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className={widgetFieldClass}>
          {CURRENCY_CODES.map((code) => <option key={code} value={code}>{code}</option>)}
        </select>
      </label>
    );
  }

  const bounds = numberBounds(param.name);
  return (
    <label className="block text-sm font-medium">
      {param.label}
      <input
        required
        disabled={disabled}
        type={param.type === "integer" ? "number" : "text"}
        min={param.type === "integer" ? bounds.min : undefined}
        max={param.type === "integer" ? bounds.max : undefined}
        maxLength={param.type === "string" ? 120 : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={widgetFieldClass}
      />
    </label>
  );
}
