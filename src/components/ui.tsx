import type { ReactNode } from "react";

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warn" | "danger" | "ok";
  title?: ReactNode;
  children: ReactNode;
}) {
  const icon =
    tone === "danger" ? "✕" : tone === "warn" ? "⚠" : tone === "ok" ? "✓" : "i";
  return (
    <div className={`callout ${tone}`}>
      {title ? (
        <div className="callout-title">
          <span aria-hidden>{icon}</span>
          {title}
        </div>
      ) : null}
      <div className="body">{children}</div>
    </div>
  );
}

export function PageHead({
  chapter,
  title,
  source,
  children,
}: {
  chapter: string;
  title: string;
  source?: string;
  children?: ReactNode;
}) {
  return (
    <>
      <p className="eyebrow">{chapter}</p>
      <h1>{title}</h1>
      {children ? <p className="lede">{children}</p> : null}
      {source ? <p className="small">{source}</p> : null}
    </>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}

export function DataTable({
  head,
  rows,
  numeric = [],
}: {
  head: string[];
  rows: ReactNode[][];
  numeric?: number[];
}) {
  return (
    <div className="tablewrap">
      <table className="data">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} className={numeric.includes(i) ? "n" : undefined}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className={numeric.includes(j) ? "n" : undefined}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div className="field">
      <div className="field-head">
        <span>{label}</span>
        <span className="v">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function Segmented({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="field" style={{ flex: "0 0 auto" }}>
      <div className="field-head">
        <span>{label}</span>
      </div>
      <div className="seg" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="switch">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

export function Section({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}

export function Caption({ children }: { children: ReactNode }) {
  return <p className="caption">{children}</p>;
}
