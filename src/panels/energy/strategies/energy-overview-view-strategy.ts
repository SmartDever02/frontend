import { ReactiveElement } from "lit";
import { customElement } from "lit/decorators";
import type { GridSourceTypeEnergyPreference } from "../../../data/energy";
import { getEnergyDataCollection } from "../../../data/energy";
import type { HomeAssistant } from "../../../types";
import type { LovelaceViewConfig } from "../../../data/lovelace/config/view";
import type { LovelaceStrategyConfig } from "../../../data/lovelace/config/strategy";
import type { LovelaceSectionConfig } from "../../../data/lovelace/config/section";
import type { LovelaceCardConfig } from "../../../data/lovelace/config/card";
import { DEFAULT_ENERGY_COLLECTION_KEY } from "../ha-panel-energy";

@customElement("energy-overview-view-strategy")
export class EnergyViewStrategy extends ReactiveElement {
  static async generate(
    _config: LovelaceStrategyConfig,
    hass: HomeAssistant
  ): Promise<LovelaceViewConfig> {
    const view: LovelaceViewConfig = { type: "sections", sections: [] };

    const collectionKey =
      _config.collection_key || DEFAULT_ENERGY_COLLECTION_KEY;

    const energyCollection = getEnergyDataCollection(hass, {
      key: collectionKey,
    });
    const prefs = energyCollection.prefs;

    // No energy sources available
    if (
      !prefs ||
      (prefs.device_consumption.length === 0 &&
        prefs.energy_sources.length === 0)
    ) {
      return view;
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
      cards: [
        {
          type: "heading",
          heading: hass.localize("ui.panel.energy.overview.electricity"),
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
        collection_key: collectionKey,
      });
    }

    if (prefs!.device_consumption.length > 0) {
      energySection.cards!.push({
        title: hass.localize(
          "ui.panel.energy.cards.energy_top_consumers_title"
        ),
        type: "energy-devices-graph",
        collection_key: collectionKey,
        max_devices: 5,
      });
    } else if (hasGrid) {
      const gauges: LovelaceCardConfig[] = [];
      // Only include if we have a grid source & return.
      if (hasReturn) {
        gauges.push({
          type: "energy-grid-neutrality-gauge",
          view_layout: { position: "sidebar" },
          collection_key: collectionKey,
        });
      }

      gauges.push({
        type: "energy-carbon-consumed-gauge",
        view_layout: { position: "sidebar" },
        collection_key: collectionKey,
      });

      // Only include if we have a solar source.
      if (hasSolar) {
        if (hasReturn) {
          gauges.push({
            type: "energy-solar-consumed-gauge",
            view_layout: { position: "sidebar" },
            collection_key: collectionKey,
          });
        }
        gauges.push({
          type: "energy-self-sufficiency-gauge",
          view_layout: { position: "sidebar" },
          collection_key: collectionKey,
        });
      }

      energySection.cards!.push({
        type: "grid",
        columns: 2,
        square: true,
        cards: gauges,
      });
    }

    view.sections!.push(energySection);

    if (hasGrid || hasSolar || hasBattery || hasGas || hasWater) {
      view.sections!.push({
        type: "grid",
        cards: [
          {
            type: "heading",
            heading: hass.localize(
              "ui.panel.energy.cards.energy_sources_table_title"
            ),
          },
          {
            type: "energy-sources-table",
            collection_key: collectionKey,
          },
        ],
      });
    }

    if (hasGas) {
      view.sections!.push({
        type: "grid",
        cards: [
          {
            type: "heading",
            heading: hass.localize("ui.panel.energy.overview.gas"),
          },
          {
            title: hass.localize(
              "ui.panel.energy.cards.energy_gas_graph_title"
            ),
            type: "energy-gas-graph",
            collection_key: collectionKey,
          },
        ],
      });
    }

    if (hasWater) {
      view.sections!.push({
        type: "grid",
        cards: [
          {
            type: "heading",
            heading: hass.localize("ui.panel.energy.overview.water"),
          },
          {
            title: hass.localize(
              "ui.panel.energy.cards.energy_water_graph_title"
            ),
            type: "energy-water-graph",
            collection_key: collectionKey,
          },
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
