"use client";

import { useState } from "react";

interface Props {
  symbol: string;
  onSymbolChange: (sym: string) => void;
}

export default function BloombergCommandBar({ symbol, onSymbolChange }: Props) {
  const [cmd, setCmd] = useState("");

  const run = () => {
    const parts = cmd.trim().toUpperCase().split(/\s+/);
    if (!parts[0]) return;
    if (parts[0] === "GP" && parts[1]) onSymbolChange(parts[1]);
    else if (/^[A-Z]{1,6}$/.test(parts[0])) onSymbolChange(parts[0]);
    setCmd("");
  };

  return (
    <div className="bb-cmd">
      <span className="bb-cmd-prompt mono">&gt;</span>
      <input
        className="bb-cmd-input mono"
        placeholder={`${symbol} <GO> · GP MSFT · DES`}
        value={cmd}
        onChange={(e) => setCmd(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && run()}
      />
      <span className="bb-cmd-hint">ENTER to load</span>
    </div>
  );
}
