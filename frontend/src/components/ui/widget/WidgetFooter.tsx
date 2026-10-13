import { forwardRef, type HTMLAttributes } from "react";
import { classNames } from "./classNames";

const WidgetFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function WidgetFooter(
  { className, ...props },
  ref
) {
  return <div ref={ref} data-slot="widget-footer" className={classNames("wigggle-widget__footer", className)} {...props} />;
});

export default WidgetFooter;
