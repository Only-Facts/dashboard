import { forwardRef } from "react";
import { classNames } from "./classNames";
import type { WidgetProps } from "./types";

const Widget = forwardRef<HTMLDivElement, WidgetProps>(function Widget(
  { className, size = "sm", design = "default", variant = "default", ...props },
  ref
) {
  return (
    <div
      ref={ref}
      data-slot="widget"
      data-size={size}
      data-design={design}
      data-variant={variant}
      className={classNames(
        "wigggle-widget",
        `wigggle-widget--${size}`,
        `wigggle-widget--${design}`,
        `wigggle-widget--${variant}`,
        className
      )}
      {...props}
    />
  );
});

export default Widget;
