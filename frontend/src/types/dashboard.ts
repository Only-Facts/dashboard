export type WidgetParamType = "string" | "integer";

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
