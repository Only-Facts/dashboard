import type { Service, Widget } from "../../types/dashboard";
import WidgetGrid from "../WidgetGrid";
import DashboardEmptyState from "./DashboardEmptyState";

interface DashboardOverviewProps {
  widgets: Widget[];
  services: Service[];
  busy: boolean;
  canAddWidget: boolean;
  onAdd: () => void;
  onOpenServices: () => void;
  onEdit: (widget: Widget) => void;
  onMove: (index: number, direction: number) => void;
  onDelete: (widget: Widget) => void;
}

export default function DashboardOverview(props: DashboardOverviewProps) {
  const connected = props.services.filter((service) => service.connected).length;

  return (
    <>
      <section aria-label="Dashboard summary" className="board-toolbar">
        <div className="board-title">
          My dashboard <span className="count-pill">{props.widgets.length}</span>
        </div>
        <div className="board-meta">
          <span><i className="status-dot" />{connected} services connected</span>
          <span className="drag-hint">Drag the handles to rearrange</span>
        </div>
      </section>

      {props.widgets.length === 0 ? (
        <DashboardEmptyState
          canAddWidget={props.canAddWidget}
          onAdd={props.onAdd}
          onOpenServices={props.onOpenServices}
        />
      ) : (
        <WidgetGrid
          widgets={props.widgets}
          busy={props.busy}
          onEdit={props.onEdit}
          onMove={props.onMove}
          onDelete={props.onDelete}
        />
      )}
    </>
  );
}
