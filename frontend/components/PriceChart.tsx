interface Props {
  data: { ts: number; price: number }[];
}

export default function PriceChart({ data }: Props) {
  if (data.length < 2) {
    return (
      <svg className="price-chart" viewBox="0 0 300 60" preserveAspectRatio="none">
        <line x1="0" y1="30" x2="300" y2="30" stroke="#2a3142" strokeWidth="1" />
      </svg>
    );
  }

  const prices = data.map((d) => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const w = 300;
  const h = 60;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d.price - min) / range) * (h - 8) - 4;
    return `${x},${y}`;
  }).join(" ");

  const last = prices[prices.length - 1];
  const first = prices[0];
  const color = last >= first ? "#26a69a" : "#ef5350";

  return (
    <svg className="price-chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
}
