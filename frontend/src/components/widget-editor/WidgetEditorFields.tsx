import type { Service, WidgetType } from "../../types/dashboard";
import { widgetFieldClass } from "../../utils/widgetEditor";
import ParameterField from "./ParameterField";

interface WidgetEditorFieldsProps {
  services: Service[];
  selected?: WidgetType;
  service: string;
  type: string;
  title: string;
  config: Record<string, string>;
  refreshSeconds: number;
  busy: boolean;
  onChoose: (service: string, type: string) => void;
  onTitleChange: (value: string) => void;
  onConfigChange: (name: string, value: string) => void;
  onRefreshChange: (value: number) => void;
}

export default function WidgetEditorFields(props: WidgetEditorFieldsProps) {
  const activeService = props.services.find((service) => service.name === props.service);

  return (
    <>
      <label className="block text-sm font-medium">
        Service
        <select
          value={props.service}
          disabled={props.busy}
          onChange={(event) => {
            const next = props.services.find((service) => service.name === event.target.value);
            const nextType = next?.widgets[0]?.name;
            if (nextType) props.onChoose(event.target.value, nextType);
          }}
          className={widgetFieldClass}
        >
          {props.services.map((service) => <option key={service.name} value={service.name}>{service.label}</option>)}
        </select>
      </label>

      <label className="block text-sm font-medium">
        Widget type
        <select value={props.type} disabled={props.busy} onChange={(event) => props.onChoose(props.service, event.target.value)} className={widgetFieldClass}>
          {activeService?.widgets.map((widget) => <option key={widget.name} value={widget.name}>{widget.description}</option>)}
        </select>
      </label>

      <label className="block text-sm font-medium">
        Title
        <input required maxLength={80} value={props.title} onChange={(event) => props.onTitleChange(event.target.value)} className={widgetFieldClass} />
      </label>

      {props.selected?.params.map((param) => (
        <ParameterField
          key={param.name}
          param={param}
          value={props.config[param.name] ?? ""}
          disabled={props.busy}
          onChange={(value) => props.onConfigChange(param.name, value)}
        />
      ))}

      <label className="block text-sm font-medium">
        Refresh interval in seconds
        <input required type="number" min={60} max={86400} step={1} value={props.refreshSeconds}
          onChange={(event) => props.onRefreshChange(Number(event.target.value))} className={widgetFieldClass} />
        <span className="mt-1 block text-xs font-normal text-slate-500">Minimum 60 seconds, maximum 24 hours.</span>
      </label>
    </>
  );
}
