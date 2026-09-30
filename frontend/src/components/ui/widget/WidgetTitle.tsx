import { forwardRef, type HTMLAttributes } from "react";
import { classNames } from "./classNames";

const WidgetTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(function WidgetTitle(
  { className, ...props },
  ref
) {
  return <h5 ref={ref} data-slot="widget-title" className={classNames("wigggle-widget__title", className)} {...props} />;
});

export default WidgetTitle;
