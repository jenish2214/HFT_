"use client";

import type { QuantResearchData } from "@/lib/quantResearchTypes";
import { regimeClass, resolveMomentumLab } from "@/lib/quantMomentumLab";
import { resolvePredictions, scenarioClass } from "@/lib/quantPredictions";

interface Props {
  data: QuantResearchData;
  primary: string;
}

export default function QuantEducationLab({ data, primary }: Props) {
  const lab = resolveMomentumLab(data, primary);
  const demo = resolvePredictions(data, primary);
  const band = demo.price_band;

  return (
    <section className="site-section site-section-wide qr-edu-panel" aria-label="Research summary">
      {lab.data_found && (
        <div className="qr-edu-momentum">
          <div className="qr-edu-momentum-head">
            <div>
              <h2 className="site-section-title qr-edu-title">Momentum buy level — {primary}</h2>
              <p className="site-section-lead qr-edu-lead">
                Study entry near trend support based on recent momentum.
              </p>
            </div>
            <div className={`qr-edu-regime ${regimeClass(lab.momentum_regime)}`}>
              <span className="qr-edu-regime-label">{lab.momentum_regime}</span>
              <span className="qr-edu-regime-meta mono">
                63d {lab.momentum_63d_pct != null ? `${lab.momentum_63d_pct >= 0 ? "+" : ""}${lab.momentum_63d_pct}%` : "—"}
                {lab.rsi_14 != null ? ` · RSI ${lab.rsi_14.toFixed(0)}` : ""}
              </span>
            </div>
          </div>

          <div className="qr-edu-buy-hero">
            <div className="qr-edu-buy-main">
              <span className="qr-edu-buy-label">Study level</span>
              <strong className="qr-edu-buy-price mono">${lab.study_buy_price?.toFixed(2) ?? "—"}</strong>
              <span className="qr-edu-buy-vs mono">
                Last ${lab.current_price?.toFixed(2) ?? "—"}
                {lab.distance_from_current_pct != null && (
                  <> ({lab.distance_from_current_pct >= 0 ? "+" : ""}{lab.distance_from_current_pct}%)</>
                )}
              </span>
            </div>
            {lab.lesson && <p className="qr-edu-lesson">{lab.lesson}</p>}
          </div>

          <div className="qr-edu-zones">
            {lab.zones?.map((z) => (
              <div key={z.label} className={`qr-edu-zone${z.highlight ? " qr-edu-zone-highlight" : ""}`}>
                <span className="qr-edu-zone-label">{z.label}</span>
                <strong className="mono qr-edu-zone-price">${z.price.toFixed(2)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="qr-edu-grid qr-edu-grid-two">
        <div className="qr-edu-scenarios">
          <h3 className="qr-edu-block-title">Scenarios</h3>
          {demo.scenarios.map((s) => (
            <div key={s.label} className={`qr-pred-scenario ${scenarioClass(s.label)}`}>
              <div className="qr-pred-scenario-top">
                <span className="qr-pred-scenario-label">{s.label}</span>
                <span className="qr-pred-scenario-pct mono">{s.probability}%</span>
              </div>
              <div className="qr-pred-scenario-track">
                <div className="qr-pred-scenario-fill" style={{ width: `${s.probability}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="qr-edu-signals">
          <h3 className="qr-edu-block-title">Pattern scores</h3>
          <ul className="qr-pred-signal-list">
            {demo.signals.map((s) => (
              <li key={s.label} className="qr-pred-signal-item">
                <div className="qr-pred-signal-row">
                  <span>{s.label}</span>
                  <span className="mono qr-pred-signal-pct">{s.probability}%</span>
                </div>
                <div className="qr-pred-signal-track">
                  <div className="qr-pred-signal-fill" style={{ width: `${s.probability}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {band && (
        <div className="qr-edu-band">
          <h3 className="qr-edu-block-title">Price range</h3>
          <div className="qr-pred-band-row mono">
            <div className="qr-pred-band-cell">
              <span className="qr-pred-band-label">Low</span>
              <strong>${band.low.toFixed(2)}</strong>
            </div>
            <div className="qr-pred-band-cell qr-pred-band-now">
              <span className="qr-pred-band-label">Now</span>
              <strong>${band.current.toFixed(2)}</strong>
            </div>
            <div className="qr-pred-band-cell">
              <span className="qr-pred-band-label">Mid</span>
              <strong>${band.mid.toFixed(2)}</strong>
            </div>
            <div className="qr-pred-band-cell">
              <span className="qr-pred-band-label">High</span>
              <strong>${band.high.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
