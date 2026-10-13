import { useMemo, useState, type FormEvent } from "react";
import type { Service, Widget, WidgetInput } from "../types/dashboard";
import { findWidget, widgetDefaults } from "../utils/widgetEditor";

interface UseWidgetEditorOptions {
  services: Service[];
  widget?: Widget;
  onSave: (input: WidgetInput) => Promise<void>;
  onClose: () => void;
}

export function useWidgetEditor({ services, widget, onSave, onClose }: UseWidgetEditorOptions) {
  const connectedServices = useMemo(
    () => services.filter((service) => service.connected),
    [services]
  );
  const firstService = connectedServices[0];
  const initialService = widget?.service ?? firstService?.name ?? "";
  const initialType = widget?.type ?? firstService?.widgets[0]?.name ?? "";
  const initialDefinition = findWidget(connectedServices, initialService, initialType);

  const [service, setService] = useState(initialService);
  const [type, setType] = useState(initialType);
  const [config, setConfig] = useState<Record<string, string>>(widget?.config ?? widgetDefaults(initialDefinition));
  const [title, setTitle] = useState(widget?.title ?? initialDefinition?.description ?? "");
  const [refreshSeconds, setRefreshSeconds] = useState(widget?.refreshSeconds ?? 300);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selected = findWidget(connectedServices, service, type);

  function choose(serviceName: string, typeName: string) {
    const definition = findWidget(connectedServices, serviceName, typeName);
    if (!definition) return;

    setService(serviceName);
    setType(typeName);
    setTitle(definition.description);
    setConfig(widgetDefaults(definition));
  }

  function updateConfig(name: string, value: string) {
    setConfig((current) => ({ ...current, [name]: value }));
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

  return {
    connectedServices,
    selected,
    service,
    type,
    config,
    title,
    refreshSeconds,
    busy,
    error,
    choose,
    updateConfig,
    setTitle,
    setRefreshSeconds,
    submit,
  };
}
