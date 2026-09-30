import { forwardRef, type HTMLAttributes } from "react";
import { classNames } from "./classNames";

const WidgetContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(function WidgetContent(
  { className, ...props },
  ref
) {
  return <div ref={ref} data-slot="widget-content" className={classNames("wigggle-widget__content", className)} {...props} />;
});

export default WidgetContent;
