import { LuCircleDot, LuGitFork, LuStar } from "react-icons/lu";
import type { ViewProps } from "../../../../types/widgets";

export default function RepositoryView({ widget, items }: ViewProps) {
  const icons = [LuStar, LuGitFork, LuCircleDot];

  return (
    <div className="repository-view">
      <strong className="repo-name">{widget.config.repository ?? "Repository"}</strong>
      <div className="repo-stats">
        {items.slice(0, 3).map((item, index) => {
          const Icon = icons[index] ?? LuCircleDot;
          return (
            <div className="repo-stat" key={item.label}>
              <Icon aria-hidden="true" />
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}
