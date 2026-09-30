import type { Widget } from "../types/dashboard";

export function reorderWidgets(widgets: Widget[], index: number, direction: number) {
  const destination = index + direction;
  if (destination < 0 || destination >= widgets.length) return null;

  const reordered = [...widgets];
  const [moved] = reordered.splice(index, 1);
  reordered.splice(destination, 0, moved);
  return reordered;
}

export function readGithubNotice() {
  const result = new URLSearchParams(window.location.search).get("github");
  if (result === "connected") {
    return "GitHub is connected. You can now add GitHub widgets.";
  }
  if (result === "failed") {
    return "GitHub could not be connected. Try again from the Services page.";
  }
  return "";
}
