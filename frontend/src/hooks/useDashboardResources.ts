import { useCallback, useEffect, useState } from "react";
import { dashboardApi } from "../api/dashboardApi";
import type { Service, Widget } from "../types/dashboard";

export function useDashboardResources() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    const [nextWidgets, nextServices] = await Promise.all([
      dashboardApi.widgets(),
      dashboardApi.services(),
    ]);
    setWidgets(nextWidgets);
    setServices(nextServices);
    setLoadError("");
  }, []);

  useEffect(() => {
    let active = true;

    Promise.all([dashboardApi.widgets(), dashboardApi.services()])
      .then(([nextWidgets, nextServices]) => {
        if (!active) return;
        setWidgets(nextWidgets);
        setServices(nextServices);
      })
      .catch((err: unknown) => {
        if (active) setLoadError(errorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return {
    widgets,
    services,
    loading,
    loadError,
    setLoadError,
    setWidgets,
    load,
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to load the dashboard.";
}
