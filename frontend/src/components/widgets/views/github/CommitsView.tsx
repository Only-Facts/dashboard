import { LuGitCommitHorizontal, LuUserRound } from "react-icons/lu";
import type { ViewProps } from "../../../../types/widgets";
import { ItemLink } from "../../shared";

export default function CommitsView({ items }: ViewProps) {
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
