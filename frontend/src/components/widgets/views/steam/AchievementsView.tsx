import { LuMedal } from "react-icons/lu";
import type { ViewProps } from "../../../../types/widgets";
import { number } from "../../format";
import { Bar } from "../../shared";

export default function AchievementsView({ items }: ViewProps) {
  return (
    <div className="achievement-list">
      {items.slice(0, 5).map((item, index) => (
        <div className="achievement-row" key={`${item.label}-${index}`}>
          <span className="medal"><LuMedal aria-hidden="true" />{index + 1}</span>
          <div>
            <div><span>{item.label.replaceAll("_", " ")}</span><strong>{item.value}</strong></div>
            <Bar value={number(item.value)} max={100} tone={index === 0 ? "warm" : "accent"} />
          </div>
        </div>
      ))}
    </div>
  );
}
