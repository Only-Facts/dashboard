import type { HTMLAttributes } from "react";

export type WigggleWidgetSize = "sm" | "md" | "lg";
export type WigggleWidgetDesign = "default" | "mumbai";
export type WigggleWidgetVariant = "default" | "secondary";

export interface WidgetProps extends HTMLAttributes<HTMLDivElement> {
  size?: WigggleWidgetSize;
  design?: WigggleWidgetDesign;
  variant?: WigggleWidgetVariant;
}
