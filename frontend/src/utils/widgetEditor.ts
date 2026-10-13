import type { NumberBounds } from "../types/widgetEditor";
import type { Service, WidgetType } from "../types/dashboard";

export const CURRENCY_CODES = [
  "EUR", "USD", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY", "INR",
  "SEK", "NOK", "DKK", "PLN", "BRL", "NZD", "ZAR", "KRW", "MXN",
] as const;

export const widgetFieldClass =
  "mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50";

export function findWidget(services: Service[], serviceName: string, typeName: string) {
  return services
    .find((service) => service.name === serviceName)
    ?.widgets.find((widget) => widget.name === typeName);
}

export function widgetDefaults(definition: WidgetType | undefined) {
  return Object.fromEntries(
    (definition?.params ?? []).map((param) => [param.name, param.defaultValue])
  );
}

export function numberBounds(name: string): NumberBounds {
  switch (name) {
    case "appid":
      return { min: 1, max: 2_147_483_647 };
    case "limit":
      return { min: 1, max: 10 };
    case "days":
      return { min: 1, max: 7 };
    case "amount":
      return { min: 1, max: 1_000_000 };
    default:
      return { min: 1 };
  }
}
