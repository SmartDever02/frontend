import type { LocalizeFunc } from "../../../../../common/translations/localize";

export const ENERGY_SUMMARIES = [
  "energy",
  "gas",
  "water",
] as const;

export type EnergySummary = (typeof ENERGY_SUMMARIES)[number];

export const ENERGY_SUMMARIES_ICONS: Record<EnergySummary, string> = {
  energy: "mdi:energy",
  gas: "mdi:gas",
  water: "mdi:water",
};

export const getSummaryLabel = (localize: LocalizeFunc, summary: EnergySummary) =>
  localize(`ui.panel.energy.summary_list.${summary}`);