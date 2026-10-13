import type { IconType } from "react-icons";
import {
  LuArrowLeftRight,
  LuCloudSun,
  LuLayoutGrid,
  LuNewspaper,
  LuWind,
} from "react-icons/lu";
import { SiGithub, SiSteam } from "react-icons/si";

const SERVICE_ICONS: Record<string, IconType> = {
  weather: LuCloudSun,
  github: SiGithub,
  currency: LuArrowLeftRight,
  news: LuNewspaper,
  air_quality: LuWind,
  steam: SiSteam,
};

export default function ServiceIcon({ service }: { service: string }) {
  const Icon = SERVICE_ICONS[service] ?? LuLayoutGrid;

  return (
    <span
      className={`service-icon service-icon--${service}`}
      aria-hidden="true"
    >
      <Icon size={22} />
    </span>
  );
}
