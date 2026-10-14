import { request } from "./http";

export const dashboardApi = {
  services: async () =>
    (await request<Service[]>("/api/services")).filter(service => service.name !== "github"),

  widgets: () => request<Widget[]>("/api/widgets"),

  publicServices: () => request<Service[]>("/api/public/services"),

  publicWidgets: () => request<Widget[]>("/api/public/widgets"),

  save: (input: WidgetInput, id?: number) =>
    request<Widget>(id ? `/api/widgets/${id}` : "/api/widgets", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(input),
    }),

  remove: (id: number) =>
    request<void>(`/api/widgets/${id}`, { method: "DELETE" }),

  order: (ids: number[]) =>
    request<void>("/api/widgets/order", {
      method: "PUT",
      body: JSON.stringify({ ids }),
    }),

  connect: (service: string) =>
    request<{ url?: string }>(`/api/services/${service}/connect`, {
      method: "POST",
    }),

  disconnect: (service: string) =>
    request<void>(`/api/services/${service}`, { method: "DELETE" }),

  data: (id: number, signal: AbortSignal) =>
    request<WidgetData>(`/api/widgets/${id}/data`, { signal }),

  publicData: (service: string, type: string, signal: AbortSignal, config: Record<string, string>) =>
    request<WidgetData>(`/api/public/widgets/${service}/${type}/data?${new URLSearchParams(config)}`, { signal }),

  publicSteamPlayers: (game: string, signal: AbortSignal) =>
    request<WidgetData>(`/api/public/steam/players?game=${encodeURIComponent(game)}`, { signal }),
};

type WidgetParamType = "string" | "integer";

export interface WidgetParam {
  name: string;
  type: WidgetParamType;
  label: string;
  defaultValue: string;
}

export interface WidgetType {
  name: string;
  description: string;
  params: WidgetParam[];
}

export interface Service {
  name: string;
  label: string;
  oauth: boolean;
  connected: boolean;
  available: boolean;
  widgets: WidgetType[];
}

export interface WidgetInput {
  service: string;
  type: string;
  title: string;
  config: Record<string, string>;
  refreshSeconds: number;
}

export interface Widget extends WidgetInput {
  id: number;
  position: number;
}

export interface WidgetDataItem {
  label: string;
  value: string;
  url: string | null;
}

export interface WidgetData {
  source: string;
  updatedAt: string;
  items: WidgetDataItem[];
}

export type DashboardTab = "overview" | "services";
