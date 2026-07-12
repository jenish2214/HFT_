"use client";

import { BB_HELP_LINES } from "@/lib/bloombergCommands";
import { ORION_FEATURES, ORION_UNIVERSE, PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/orionAlpha";

interface Props {
  onClose: () => void;
}

export default function BloombergHelpPanel({ onClose }: Props) {
  const universeTotal =
    ORION_UNIVERSE.equities.length +
    ORION_UNIVERSE.crypto.length +
    ORION_UNIVERSE.commodities.length +
    ORION_UNIVERSE.indices.length +
    ORION_UNIVERSE.fx.length +
    ORION_UNIVERSE.rates.length;

  return (
    <div className="panel bb-help-panel">
      <div className="panel-head">
        <span className="panel-title">HELP — {PRODUCT_NAME} Guide</span>
        <button type="button" className="bb-help-close" onClick={onClose}>ESC</button>
      </div>
      <div className="panel-body bb-help-body">
        <p className="bb-help-intro">
          <strong>{PRODUCT_NAME}</strong> — {PRODUCT_TAGLINE}. Live stream from the Python API;
          {universeTotal} instruments across equities, crypto, commodities, indices, FX, and rates.
        </p>

        <div className="bb-help-section-title">Orion Alpha Universe</div>
        <ul className="bb-help-list mono">
          <li>Equities ({ORION_UNIVERSE.equities.length}) — {ORION_UNIVERSE.equities.join(", ")}</li>
          <li>Crypto ({ORION_UNIVERSE.crypto.length}) — {ORION_UNIVERSE.crypto.join(", ")}</li>
          <li>Commodities ({ORION_UNIVERSE.commodities.length}) — {ORION_UNIVERSE.commodities.join(", ")}</li>
          <li>Indices ({ORION_UNIVERSE.indices.length}) — {ORION_UNIVERSE.indices.join(", ")}</li>
          <li>FX ({ORION_UNIVERSE.fx.length}) — {ORION_UNIVERSE.fx.join(", ")}</li>
          <li>Rates ({ORION_UNIVERSE.rates.length}) — {ORION_UNIVERSE.rates.join(", ")}</li>
        </ul>

        <div className="bb-help-section-title">All features</div>
        <ul className="bb-help-list bb-help-features">
          {ORION_FEATURES.map((f) => (
            <li key={f.id}>
              <span className="mono bb-orange-text">{f.key}</span> — <strong>{f.title}</strong>
              <div className="bb-help-feature-detail">{f.details}</div>
            </li>
          ))}
        </ul>

        <div className="bb-help-section-title">Command line (CMD)</div>
        <ul className="bb-help-list mono">
          {BB_HELP_LINES.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
