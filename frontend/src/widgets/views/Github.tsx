import { LuGitCommitHorizontal, LuUserRound, LuCircleDot, LuGitFork, LuStar } from "react-icons/lu";
import type { ViewProps } from "../WidgetUtils";
import { ItemLink } from "../WidgetUtils";

export function CommitsView({ items }: ViewProps) {
  return (
    <ol className="commit-list">
      {items.slice(0, 5).map((item, index) => (
        <li key={`${item.label}-${index}`}>
          <LuGitCommitHorizontal aria-hidden="true" />
          <div>
            <ItemLink item={item} />
            <small><LuUserRound aria-hidden="true" /> {item.label}</small>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function IssuesView({ items }: ViewProps) {
  return (
    <div className="issues-view">
      <div className="issue-total"><LuCircleDot aria-hidden="true" /><strong>{items.length}</strong><span>open</span></div>
      <div className="issue-list">
        {items.slice(0, 5).map((item, index) => (
          <div key={`${item.label}-${index}`}>
            <span>{item.label}</span>
            <ItemLink item={item} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RepositoryView({ widget, items }: ViewProps) {
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
