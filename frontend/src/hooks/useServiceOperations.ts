import { dashboardApi } from "../api/dashboardApi";
import type { Service } from "../types/dashboard";

interface ServiceOperationsOptions {
  reload: () => Promise<void>;
  run: (task: () => Promise<void>) => Promise<boolean>;
}

export function useServiceOperations({ reload, run }: ServiceOperationsOptions) {
  async function toggle(service: Service) {
    if (service.connected && !window.confirm(`Disconnect ${service.label}? Its widgets will also be removed.`)) {
      return;
    }

    await run(async () => {
      if (service.connected) {
        await dashboardApi.disconnect(service.name);
        await reload();
        return;
      }

      const result = await dashboardApi.connect(service.name);
      if (result.url) {
        window.location.assign(result.url);
        return;
      }
      await reload();
    });
  }

  return { toggle };
}
