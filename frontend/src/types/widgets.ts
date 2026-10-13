import type { ComponentType, ReactNode } from "react";
import type { Widget, WidgetData, WidgetDataItem } from "./dashboard";
import type {
  WigggleWidgetDesign,
  WigggleWidgetSize,
  WigggleWidgetVariant,
} from "./widgetPrimitive";

export type WidgetTone = "accent" | "cool" | "warm" | "violet" | "danger";

export interface ViewProps {
  widget: Widget;
  items: WidgetDataItem[];
  history: WidgetData[];
}

export interface WidgetVisualChrome {
  title: string;
  subtitle: string;
  loading: boolean;
  error: string | null;
  data: WidgetData | null;
  refreshSeconds: number;
  busy: boolean;
  first: boolean;
  last: boolean;
  dragHandle: ReactNode;
  onRefresh: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (direction: number) => void;
}

export interface WidgetVisualProps extends ViewProps {
  chrome: WidgetVisualChrome;
}

export interface WidgetVisualMeta {
  icon: ComponentType<{ "aria-hidden"?: boolean }>;
  design: WigggleWidgetDesign;
  variant: WigggleWidgetVariant;
  size: WigggleWidgetSize;
}

export interface WidgetDragState {
  id: number;
  target: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  moved: boolean;
}
