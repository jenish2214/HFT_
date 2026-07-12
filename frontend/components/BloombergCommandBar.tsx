"use client";

import { useState } from "react";
import { parseBloombergCommand, type BbFunction } from "@/lib/bloombergCommands";
import { PRODUCT_NAME } from "@/lib/orionAlpha";

interface Props {
  symbol: string;
  onSymbolChange: (sym: string) => void;
  onFunction: (fn: BbFunction, symbol?: string) => void;
}

export default function BloombergCommandBar({ symbol, onSymbolChange, onFunction }: Props) {
  const [cmd, setCmd] = useState("");

  const run = () => {
    const result = parseBloombergCommand(cmd);
    if (result.fn) {
      onFunction(result.fn, result.symbol);
      if (result.symbol) onSymbolChange(result.symbol);
      else if (result.fn === "WEI") onSymbolChange("SPY");
    } else if (result.symbol) {
      onSymbolChange(result.symbol);
      onFunction("GP", result.symbol);
    }
    setCmd("");
  };

  return (
    <div className="bb-cmd">
      <span className="bb-cmd-label mono">CMD</span>
      <span className="bb-cmd-prompt mono">&gt;</span>
      <input
        className="bb-cmd-input mono"
        placeholder={`${symbol} <GO> · ${PRODUCT_NAME} · FA · GP · IB · RES · HELP`}
        value={cmd}
        onChange={(e) => setCmd(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") run();
          if (e.key === "Escape") setCmd("");
        }}
      />
      <span className="bb-cmd-hint mono">&lt;GO&gt;</span>
    </div>
  );
}
