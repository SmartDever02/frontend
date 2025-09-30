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

@customElement("gas-view-strategy")
export class GasViewStrategy extends ReactiveElement {
  static async generate(
    _config: LovelaceStrategyConfig,
    hass: HomeAssistant
  ): Promise<LovelaceViewConfig> {
    const view: LovelaceViewConfig = { type: "sidebar", cards: [] };

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

    const hasGas = prefs.energy_sources.some(
      (source) => source.type === "gas"
    );

    // Only include if we have a gas source.
    if (hasGas) {
      view.cards!.push({
        title: hass.localize("ui.panel.energy.cards.energy_gas_graph_title"),
        type: "energy-gas-graph",
        collection_key: "energy_dashboard",
      });
    }

    return view;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "gas-view-strategy": GasViewStrategy;
  }
}
