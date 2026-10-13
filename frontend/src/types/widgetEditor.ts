import type { Service, Widget, WidgetInput, WidgetType } from "./dashboard";

export interface WidgetEditorProps {
  services: Service[];
  widget?: Widget;
  onSave: (input: WidgetInput) => Promise<void>;
  onClose: () => void;
}

export interface WidgetEditorState {
  service: string;
  type: string;
  title: string;
  config: Record<string, string>;
  refreshSeconds: number;
  selected?: WidgetType;
  busy: boolean;
  error: string;
}

export interface NumberBounds {
  min: number;
  max?: number;
}
