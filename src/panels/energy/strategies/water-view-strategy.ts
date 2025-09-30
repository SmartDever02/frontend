import { ReactiveElement } from "lit";
import { customElement } from "lit/decorators";
import type { EnergyPreferences } from "../../../data/energy";
import { getEnergyPreferences } from "../../../data/energy";
import type { HomeAssistant } from "../../../types";
import type { LovelaceViewConfig } from "../../../data/lovelace/config/view";
import type { LovelaceStrategyConfig } from "../../../data/lovelace/config/strategy";

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

@customElement("water-view-strategy")
export class WaterViewStrategy extends ReactiveElement {
  static async generate(
    _config: LovelaceStrategyConfig,
    hass: HomeAssistant
  ): Promise<LovelaceViewConfig> {
    const view: LovelaceViewConfig = { cards: [] };

    let prefs: EnergyPreferences;

    try {
      prefs = await getEnergyPreferences(hass);
    } catch (err: any) {
      if (err.code === "not_found") {
        return setupWizard();
      }
      view.cards!.push({
        type: "markdown",
        content: `An error occurred while fetching your energy preferences: ${err.message}.`,
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

    view.type = "sidebar";

    const hasWater = prefs.energy_sources.some(
      (source) => source.type === "water"
    );

    // Only include if we have a water source.
    if (hasWater) {
      view.cards!.push({
        title: hass.localize("ui.panel.energy.cards.energy_water_graph_title"),
        type: "energy-water-graph",
        collection_key: "energy_dashboard",
      });
    }

    return view;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "water-view-strategy": WaterViewStrategy;
  }
}
