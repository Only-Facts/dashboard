import { LuAtom, LuBadgeDollarSign, LuCalendarClock, LuCloudRain, LuCloudSun, LuCoins, LuDroplets, LuGauge, LuGamepad2, LuGitCommitHorizontal, LuGitPullRequest, LuGithub, LuMedal, LuNewspaper, LuRadio, LuRadioTower, LuSun, LuThermometer, LuTrendingUp, LuUsers, LuWind } from "react-icons/lu";
import type { ComponentType } from "react";
import type { ViewProps } from "./WidgetUtils";
import { AqiView, GasesView, ParticlesView } from "./views/AirQuality";
import { ConvertView, RateView } from "./views/Currency";
import { CommitsView, IssuesView, RepositoryView } from "./views/Github";
import { LatestView, PopularView } from "./views/News";
import { AchievementsView, GameNewsView, PlayersView } from "./views/Steam";
import { ForecastView, PrecipitationView, SunView, TemperatureView, WindView } from "./views/Weather";
import { FollowedChannelsView, FollowedLiveView, ScheduleView } from "./views/Twitch";

import { SpotifyView } from "./views/Spotify";
import { SiSpotify } from "react-icons/si";

import { UnknownView } from "./WidgetUtils";

interface WidgetDefinition {
  View: ComponentType<ViewProps>;
  icon: ComponentType<{ "aria-hidden"?: boolean }>;
  design: "default" | "mumbai";
  size: "sm" | "md" | "lg";
}

export const widgetRegistry: Record<string, WidgetDefinition> = {
  "weather:temperature": define(TemperatureView, LuThermometer, "default", "sm"),
  "weather:forecast": define(ForecastView, LuCloudSun, "mumbai", "md"),
  "weather:wind": define(WindView, LuWind, "default", "md"),
  "weather:precipitation": define(PrecipitationView, LuCloudRain, "mumbai", "md"),
  "weather:sun": define(SunView, LuSun, "default", "md"),
  "github:repository": define(RepositoryView, LuGithub, "default", "md"),
  "github:commits": define(CommitsView, LuGitCommitHorizontal, "mumbai", "md"),
  "github:issues": define(IssuesView, LuGitPullRequest, "default", "md"),
  "currency:rate": define(RateView, LuTrendingUp, "default", "sm"),
  "currency:convert": define(ConvertView, LuBadgeDollarSign, "mumbai", "md"),
  "news:popular": define(PopularView, LuRadio, "default", "md"),
  "news:latest": define(LatestView, LuNewspaper, "mumbai", "md"),
  "air_quality:aqi": define(AqiView, LuGauge, "default", "sm"),
  "air_quality:particles": define(ParticlesView, LuDroplets, "mumbai", "md"),
  "air_quality:gases": define(GasesView, LuAtom, "default", "md"),
  "steam:players": define(PlayersView, LuGamepad2, "default", "sm"),
  "steam:game_news": define(GameNewsView, LuNewspaper, "mumbai", "md"),
  "steam:achievements": define(AchievementsView, LuMedal, "default", "md"),
  "twitch:followed_live": define(FollowedLiveView, LuRadioTower, "mumbai", "md"),
  "twitch:followed_channels": define(FollowedChannelsView, LuUsers, "default", "md"),
  "twitch:schedule": define(ScheduleView, LuCalendarClock, "default", "md"),
  "spotify:recently_played": define(SpotifyView, SiSpotify, "default", "md"),
  "spotify:top_tracks": define(SpotifyView, SiSpotify, "mumbai", "md"),
  "spotify:playlists": define(SpotifyView, SiSpotify, "default", "md"),
};

export const defaultWidget = define(UnknownView, LuCoins, "default", "md");

function define(View: WidgetDefinition["View"], icon: WidgetDefinition["icon"], design: WidgetDefinition["design"], size: WidgetDefinition["size"]): WidgetDefinition {
  return { View, icon, design, size };
}
