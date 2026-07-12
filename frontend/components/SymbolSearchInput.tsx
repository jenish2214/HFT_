"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ASSET_CLASS_SHORT } from "@/lib/orionAlpha";
import { searchSymbolGroups, type SymbolSearchGroup } from "@/lib/symbolCatalog";
import { validateSymbol } from "@/lib/security";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Props {
  value?: string;
  onSelect: (symbol: string) => void;
  onQueryChange?: (symbol: string) => void;
  loading?: boolean;
  dark?: boolean;
  compact?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  showGoButton?: boolean;
  /** When true, dropdown/typing only updates query; GO or Enter submits */
  submitOnGoOnly?: boolean;
  ariaLabel?: string;
}

export default function SymbolSearchInput({
  value,
  onSelect,
  onQueryChange,
  loading = false,
  dark = false,
  compact = false,
  placeholder = "Search stocks, forex, crypto…",
  className = "",
  inputClassName = "",
  showGoButton = false,
  submitOnGoOnly = false,
  ariaLabel = "Symbol search",
}: Props) {
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== undefined) setQuery(value);
  }, [value]);

  const groups = useMemo(() => searchSymbolGroups(query), [query]);
  const flatItems = useMemo(
    () => groups.flatMap((g) => g.items.map((item) => ({ ...item, groupLabel: g.label }))),
    [groups],
  );

  const pick = useCallback((sym: string, submit = !submitOnGoOnly) => {
    const valid = validateSymbol(sym);
    if (!valid) return;
    setOpen(false);
    setActiveIdx(-1);
    if (submitOnGoOnly && !submit) {
      if (value === undefined) setQuery(valid);
      onQueryChange?.(valid);
      return;
    }
    setQuery(value !== undefined ? valid : "");
    onSelect(valid);
  }, [onSelect, onQueryChange, submitOnGoOnly, value]);

  const submitRaw = useCallback(() => {
    const valid = validateSymbol(query);
    if (!valid) return;
    if (submitOnGoOnly) {
      onSelect(valid);
      return;
    }
    pick(valid, true);
  }, [query, pick, onSelect, submitOnGoOnly]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActiveIdx((i) => Math.min(i + 1, flatItems.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (open && activeIdx >= 0 && flatItems[activeIdx]) {
        pick(flatItems[activeIdx].symbol, !submitOnGoOnly);
      } else {
        submitRaw();
      }
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  };

  let flatOffset = 0;

  return (
    <div
      ref={rootRef}
      className={`sym-search${dark ? " sym-search-dark" : ""}${compact ? " sym-search-compact" : ""} ${className}`.trim()}
    >
      <div className="sym-search-row">
        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={loading}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          maxLength={14}
          className={`sym-search-input mono ${inputClassName}`.trim()}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            const next = e.target.value.toUpperCase();
            setQuery(next);
            onQueryChange?.(next);
            setOpen(true);
            setActiveIdx(-1);
          }}
          onKeyDown={onKeyDown}
        />
        {showGoButton && (
          <button
            type="button"
            className="sym-search-go"
            disabled={loading}
            onClick={submitRaw}
            aria-busy={loading}
          >
            {loading ? <LoadingSpinner size="sm" /> : "GO"}
          </button>
        )}
      </div>

      {open && groups.length > 0 && (
        <div className="sym-search-dropdown" role="listbox">
          {!query.trim() && (
            <div className="sym-search-hint">Recommendations — stocks, forex, crypto & more</div>
          )}
          {groups.map((group: SymbolSearchGroup) => {
            const startIdx = flatOffset;
            flatOffset += group.items.length;
            return (
              <div key={group.assetClass} className="sym-search-group">
                <div className="sym-search-group-label">{group.label}</div>
                {group.items.map((item, i) => {
                  const idx = startIdx + i;
                  const active = idx === activeIdx;
                  return (
                    <button
                      key={item.symbol}
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={`sym-search-item${active ? " sym-search-item-active" : ""}`}
                      onMouseEnter={() => setActiveIdx(idx)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pick(item.symbol, !submitOnGoOnly)}
                    >
                      <span className="sym-search-cls mono">{ASSET_CLASS_SHORT[item.assetClass]}</span>
                      <span className="sym-search-sym mono">{item.symbol}</span>
                      <span className="sym-search-name">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {open && query.trim() && groups.length === 0 && (
        <div className="sym-search-dropdown sym-search-empty">
          No matches — press Enter to try &quot;{query.trim().toUpperCase()}&quot;
        </div>
      )}
    </div>
  );
}
