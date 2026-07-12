"use client";

import EducationalDisclaimer from "@/components/EducationalDisclaimer";
import type { QuantResearchData } from "@/lib/quantResearchTypes";
import { regimeClass, resolveMomentumLab } from "@/lib/quantMomentumLab";
import { resolvePredictions, scenarioClass } from "@/lib/quantPredictions";

interface Props {
  data: QuantResearchData;
  primary: string;
}

function stackClass(stack: string): string {
  if (stack === "C++") return "qr-pred-stack-cpp";
  return "qr-pred-stack-python";
}

function fmtLatency(ns?: number): string {
  if (ns == null || ns <= 0) return "—";
  if (ns < 1000) return `${ns} ns`;
  if (ns < 1_000_000) return `${(ns / 1000).toFixed(1)} µs`;
  return `${(ns / 1_000_000).toFixed(2)} ms`;
}

export default function QuantEducationLab({ data, primary }: Props) {
  const lab = resolveMomentumLab(data, primary);
  const demo = resolvePredictions(data, primary);
  const band = demo.price_band;

  return (
    <section className="site-section site-section-wide qr-edu-panel" aria-label="Educational research lab">
      <EducationalDisclaimer />

      {lab.data_found && (
        <div className="qr-edu-momentum">
          <div className="qr-edu-momentum-head">
            <div>
              <p className="qr-edu-eyebrow mono">Momentum study lab</p>
              <h2 className="site-section-title qr-edu-title">Best price to study for a buy — {primary}</h2>
              <p className="site-section-lead qr-edu-lead">
                Momentum-based demo entry level for learning pullbacks and trend support — not a live order price.
              </p>
            </div>
            <div className={`qr-edu-regime ${regimeClass(lab.momentum_regime)}`}>
              <span className="qr-edu-regime-label">{lab.momentum_regime}</span>
              <span className="qr-edu-regime-meta mono">
                63d mom {lab.momentum_63d_pct != null ? `${lab.momentum_63d_pct >= 0 ? "+" : ""}${lab.momentum_63d_pct}%` : "—"}
                {lab.rsi_14 != null ? ` · RSI ${lab.rsi_14.toFixed(0)}` : ""}
              </span>
            </div>
          </div>

          <div className="qr-edu-buy-hero">
            <div className="qr-edu-buy-main">
              <span className="qr-edu-buy-label">Momentum study buy level</span>
              <strong className="qr-edu-buy-price mono">
                ${lab.study_buy_price?.toFixed(2) ?? "—"}
              </strong>
              <span className="qr-edu-buy-vs mono">
                vs last ${lab.current_price?.toFixed(2) ?? "—"}
                {lab.distance_from_current_pct != null && (
                  <> ({lab.distance_from_current_pct >= 0 ? "+" : ""}{lab.distance_from_current_pct}%)</>
                )}
              </span>
            </div>
            <p className="qr-edu-lesson">{lab.lesson}</p>
          </div>

          <div className="qr-edu-zones">
            {lab.zones?.map((z) => (
              <div
                key={z.label}
                className={`qr-edu-zone${z.highlight ? " qr-edu-zone-highlight" : ""}`}
              >
                <span className="qr-edu-zone-label">{z.label}</span>
                <strong className="mono qr-edu-zone-price">${z.price.toFixed(2)}</strong>
                <span className="qr-edu-zone-role">{z.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="qr-edu-grid">
        <div className="qr-edu-scenarios">
          <h3 className="qr-edu-block-title">Demo scenario scorecard</h3>
          <p className="qr-edu-block-note">Classroom exercise — not a forecast of future prices.</p>
          {demo.scenarios.map((s) => (
            <div key={s.label} className={`qr-pred-scenario ${scenarioClass(s.label)}`}>
              <div className="qr-pred-scenario-top">
                <span className="qr-pred-scenario-label">{s.label}</span>
                <span className="qr-pred-scenario-pct mono">{s.probability}%</span>
              </div>
              <div className="qr-pred-scenario-track">
                <div className="qr-pred-scenario-fill" style={{ width: `${s.probability}%` }} />
              </div>
              <p className="qr-pred-scenario-hint">{s.hint}</p>
            </div>
          ))}
        </div>

        <div className="qr-edu-signals">
          <h3 className="qr-edu-block-title">Pattern study scores</h3>
          <p className="qr-edu-block-note">Rule-based technical exercises for learning setups.</p>
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

        <div className="qr-edu-models">
          <h3 className="qr-edu-block-title">Stack used in this lab</h3>
          <ul className="qr-pred-model-list">
            {demo.models.map((m) => (
              <li key={m.id} className="qr-pred-model-card">
                <div className="qr-pred-model-top">
                  <span className={`qr-pred-stack mono ${stackClass(m.stack)}`}>{m.stack}</span>
                  <span className={`qr-pred-model-status${m.status === "live" ? " is-live" : ""}`}>
                    {m.status === "live" ? "Demo live" : "Offline"}
                  </span>
                </div>
                <strong className="qr-pred-model-name">{m.name}</strong>
                <p className="qr-pred-model-role">{m.role}</p>
                {m.id === "cpp-engine" && m.latency_ns != null && (
                  <p className="qr-pred-model-meta mono">Avg latency {fmtLatency(m.latency_ns)}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {band && (
        <div className="qr-edu-band">
          <h3 className="qr-edu-block-title">Monte Carlo simulation band (learning exercise)</h3>
          <div className="qr-pred-band-row mono">
            <div className="qr-pred-band-cell">
              <span className="qr-pred-band-label">P05</span>
              <strong>${band.low.toFixed(2)}</strong>
            </div>
            <div className="qr-pred-band-cell qr-pred-band-now">
              <span className="qr-pred-band-label">Now</span>
              <strong>${band.current.toFixed(2)}</strong>
            </div>
            <div className="qr-pred-band-cell">
              <span className="qr-pred-band-label">Median sim</span>
              <strong>${band.mid.toFixed(2)}</strong>
            </div>
            <div className="qr-pred-band-cell">
              <span className="qr-pred-band-label">P95</span>
              <strong>${band.high.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
