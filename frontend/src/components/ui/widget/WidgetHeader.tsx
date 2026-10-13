import { forwardRef, type HTMLAttributes } from "react";
import { classNames } from "./classNames";

const WidgetHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function WidgetHeader(
  { className, ...props },
  ref
) {
  return <div ref={ref} data-slot="widget-header" className={classNames("wigggle-widget__header", className)} {...props} />;
});

export default WidgetHeader;
