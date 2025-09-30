import { ReactiveElement } from "lit";
import { customElement } from "lit/decorators";
import type {
  EnergyPreferences,
  GridSourceTypeEnergyPreference,
} from "../../../data/energy";
import { getEnergyPreferences } from "../../../data/energy";
import type { HomeAssistant } from "../../../types";
import type { LovelaceViewConfig } from "../../../data/lovelace/config/view";
import type { LovelaceStrategyConfig } from "../../../data/lovelace/config/strategy";
import type { LovelaceSectionConfig } from "../../../data/lovelace/config/section";
import type { LovelaceCardConfig } from "../../../data/lovelace/config/card";

const setupWizard = async (): Promise<LovelaceViewConfig> => {
  await import("../cards/energy-setup-wizard-card");
  return {
    type: "panel",
    cards: [
      {
        type: "custom:energy-setup-wizard-card",
      },
    ],
  };
};

const COLUMNS = 2;

@customElement("energy-overview-view-strategy")
export class EnergyViewStrategy extends ReactiveElement {
  static async generate(
    _config: LovelaceStrategyConfig,
    hass: HomeAssistant
  ): Promise<LovelaceViewConfig> {
    const view: LovelaceViewConfig = { type: "sections", sections: [] };

    let prefs: EnergyPreferences;

    try {
      prefs = await getEnergyPreferences(hass);
    } catch (err: any) {
      if (err.code === "not_found") {
        return setupWizard();
      }
      view.sections!.push({
        column_span: COLUMNS,
        cards: [
          {
            type: "markdown",
            content: `An error occurred while fetching your energy preferences: ${err.message}.`,
          },
        ],
      });
      return view;
    }

    // No energy sources available, start from scratch
    if (
      prefs!.device_consumption.length === 0 &&
      prefs!.energy_sources.length === 0
    ) {
      return setupWizard();
    }

    const hasGrid = prefs.energy_sources.find(
      (source) =>
        source.type === "grid" &&
        (source.flow_from?.length || source.flow_to?.length)
    ) as GridSourceTypeEnergyPreference;
    const hasReturn = hasGrid && hasGrid.flow_to.length;
    const hasSolar = prefs.energy_sources.some(
      (source) => source.type === "solar"
    );
    const hasGas = prefs.energy_sources.some((source) => source.type === "gas");
    const hasBattery = prefs.energy_sources.some(
      (source) => source.type === "battery"
    );
    const hasWater = prefs.energy_sources.some(
      (source) => source.type === "water"
    );

    const energySection: LovelaceSectionConfig = {
      type: "grid",
      column_span: COLUMNS,
      cards: [
        {
          type: "heading",
          heading: hass.localize("ui.panel.energy.electricity_overview_title"),
          tap_action: {
            action: "navigate",
            navigation_path: "/energy/electricity",
          },
        },
      ],
    };
    // Only include if we have a grid or battery.
    if (hasGrid || hasBattery) {
      energySection.cards!.push({
        title: hass.localize("ui.panel.energy.cards.energy_distribution_title"),
        type: "energy-distribution",
        view_layout: { position: "sidebar" },
        collection_key: "energy_dashboard",
      });
    }

    const gauges: LovelaceCardConfig[] = [];
    // Only include if we have a grid source & return.
    if (hasReturn) {
      gauges.push({
        type: "energy-grid-neutrality-gauge",
        view_layout: { position: "sidebar" },
        collection_key: "energy_dashboard",
      });
    }

    // Only include if we have a grid
    if (hasGrid) {
      gauges.push({
        type: "energy-carbon-consumed-gauge",
        view_layout: { position: "sidebar" },
        collection_key: "energy_dashboard",
      });
    }

    // Only include if we have a solar source.
    if (hasSolar) {
      if (hasReturn) {
        gauges.push({
          type: "energy-solar-consumed-gauge",
          view_layout: { position: "sidebar" },
          collection_key: "energy_dashboard",
        });
      }
      if (hasGrid) {
        gauges.push({
          type: "energy-self-sufficiency-gauge",
          view_layout: { position: "sidebar" },
          collection_key: "energy_dashboard",
        });
      }
    }

    if (gauges.length) {
      energySection.cards!.push({
        type: "grid",
        columns: 2,
        square: true,
        cards: gauges,
      });
    }

    view.sections!.push(energySection);

    if (hasGas) {
      view.sections!.push({
        type: "grid",
        column_span: 1,
        cards: [
          {
            type: "heading",
            heading: hass.localize("ui.panel.energy.gas_overview_title"),
            tap_action: { action: "navigate", navigation_path: "/energy/gas" },
          },
          {
            title: hass.localize("ui.panel.energy.cards.energy_gas_graph_title"),
            type: "energy-gas-graph",
            collection_key: "energy_dashboard",
          }
        ],
      });
    }

    return view;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "energy-overview-view-strategy": EnergyViewStrategy;
  }
}
