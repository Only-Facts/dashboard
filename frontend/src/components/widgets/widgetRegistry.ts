import {
  LuAtom,
  LuBadgeDollarSign,
  LuCloudRain,
  LuCloudSun,
  LuCoins,
  LuDroplets,
  LuGauge,
  LuGamepad2,
  LuGitCommitHorizontal,
  LuGitPullRequest,
  LuGithub,
  LuMedal,
  LuNewspaper,
  LuRadio,
  LuSun,
  LuThermometer,
  LuTrendingUp,
  LuWind,
} from "react-icons/lu";
import type { ComponentType } from "react";
import type { ViewProps, WidgetVisualMeta } from "../../types/widgets";
import AqiView from "./views/air-quality/AqiView";
import GasesView from "./views/air-quality/GasesView";
import ParticlesView from "./views/air-quality/ParticlesView";
import ConvertView from "./views/currency/ConvertView";
import RateView from "./views/currency/RateView";
import CommitsView from "./views/github/CommitsView";
import IssuesView from "./views/github/IssuesView";
import RepositoryView from "./views/github/RepositoryView";
import LatestView from "./views/news/LatestView";
import PopularView from "./views/news/PopularView";
import AchievementsView from "./views/steam/AchievementsView";
import GameNewsView from "./views/steam/GameNewsView";
import PlayersView from "./views/steam/PlayersView";
import ForecastView from "./views/weather/ForecastView";
import PrecipitationView from "./views/weather/PrecipitationView";
import SunView from "./views/weather/SunView";
import TemperatureView from "./views/weather/TemperatureView";
import WindView from "./views/weather/WindView";

export const widgetViews: Record<string, ComponentType<ViewProps>> = {
  "weather:temperature": TemperatureView,
  "weather:forecast": ForecastView,
  "weather:wind": WindView,
  "weather:precipitation": PrecipitationView,
  "weather:sun": SunView,
  "github:repository": RepositoryView,
  "github:commits": CommitsView,
  "github:issues": IssuesView,
  "currency:rate": RateView,
  "currency:convert": ConvertView,
  "news:popular": PopularView,
  "news:latest": LatestView,
  "air_quality:aqi": AqiView,
  "air_quality:particles": ParticlesView,
  "air_quality:gases": GasesView,
  "steam:players": PlayersView,
  "steam:game_news": GameNewsView,
  "steam:achievements": AchievementsView,
};

export const widgetMeta: Record<string, WidgetVisualMeta> = {
  "weather:temperature": meta(LuThermometer, "default", "sm"),
  "weather:forecast": meta(LuCloudSun, "mumbai", "lg"),
  "weather:wind": meta(LuWind, "default", "md"),
  "weather:precipitation": meta(LuCloudRain, "mumbai", "md"),
  "weather:sun": meta(LuSun, "default", "md"),
  "github:repository": meta(LuGithub, "default", "md"),
  "github:commits": meta(LuGitCommitHorizontal, "mumbai", "lg"),
  "github:issues": meta(LuGitPullRequest, "default", "md"),
  "currency:rate": meta(LuTrendingUp, "default", "sm"),
  "currency:convert": meta(LuBadgeDollarSign, "mumbai", "md"),
  "news:popular": meta(LuRadio, "default", "md"),
  "news:latest": meta(LuNewspaper, "mumbai", "lg"),
  "air_quality:aqi": meta(LuGauge, "default", "sm"),
  "air_quality:particles": meta(LuDroplets, "mumbai", "md"),
  "air_quality:gases": meta(LuAtom, "default", "md"),
  "steam:players": meta(LuGamepad2, "default", "sm"),
  "steam:game_news": meta(LuNewspaper, "mumbai", "lg"),
  "steam:achievements": meta(LuMedal, "default", "md"),
};

export const defaultWidgetMeta = meta(LuCoins, "default", "md");

function meta(icon: WidgetVisualMeta["icon"], design: WidgetVisualMeta["design"], size: WidgetVisualMeta["size"]): WidgetVisualMeta {
  return { icon, design, variant: "default", size };
}
