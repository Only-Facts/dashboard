import type { WidgetVisualProps } from "../../types/widgets";
import {
  Widget,
  WidgetContent,
  WidgetFooter,
  WidgetHeader,
  WidgetTitle,
} from "./WigggleWidget";
import WidgetControls from "./WidgetControls";
import WidgetDataState from "./WidgetDataState";
import WidgetFooterInfo from "./WidgetFooterInfo";
import { defaultWidgetMeta, widgetMeta, widgetViews } from "./widgetRegistry";
import UnknownView from "./views/common/UnknownView";
import "./widgets.css";

export default function WidgetVisual(props: WidgetVisualProps) {
  const key = `${props.widget.service}:${props.widget.type}`;
  const View = widgetViews[key] ?? UnknownView;
  const meta = widgetMeta[key] ?? defaultWidgetMeta;
  const Icon = meta.icon;
  const safeKey = key.replaceAll(":", "-").replaceAll("_", "-");

  return (
    <div className={`widget-visual widget-visual--${props.widget.service} visual-${safeKey}`} aria-label={props.chrome.title}>
      <Widget size={meta.size} design={meta.design} variant={meta.variant} className="orbit-wigggle" role="article" aria-label={props.chrome.title}>
        <WidgetHeader className="orbit-widget-chrome">
          <div className="orbit-widget-identity">
            <span className="orbit-wigggle__icon" aria-hidden="true"><Icon /></span>
            <div className="orbit-widget-heading">
              <WidgetTitle>{props.chrome.title}</WidgetTitle>
              {props.chrome.subtitle && <span className="orbit-wigggle__subtitle">{props.chrome.subtitle}</span>}
            </div>
          </div>
          <WidgetControls chrome={props.chrome} />
        </WidgetHeader>

        <WidgetContent className="orbit-widget-content" aria-busy={props.chrome.loading}>
          <WidgetDataState {...props} View={View} />
        </WidgetContent>

        <WidgetFooter className="orbit-widget-footer">
          <WidgetFooterInfo widget={props.widget} data={props.chrome.data} refreshSeconds={props.chrome.refreshSeconds} />
        </WidgetFooter>
      </Widget>
    </div>
  );
}
