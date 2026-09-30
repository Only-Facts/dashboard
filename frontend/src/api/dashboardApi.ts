import { request } from "./http";
import type {
  Service,
  Widget,
  WidgetData,
  WidgetInput,
} from "../types/dashboard";

export const dashboardApi = {
  services: () => request<Service[]>("/api/services"),

  widgets: () => request<Widget[]>("/api/widgets"),

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
};

export type {
  Service,
  Widget,
  WidgetData,
  WidgetInput,
  WidgetParam as Param,
  WidgetType,
} from "../types/dashboard";
