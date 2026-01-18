"use client";

interface BarChartProps {
  data: { label: string; value: number }[];
}

export default function BarChart({ data }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = 40;
  const barGap = 20;
  const height = 200;

  return (
    <svg width={data.length * (barWidth + barGap)} height={height + 50}>
      {data.map((d, i) => {
        const barHeight = (d.value / maxValue) * height;
        return (
          <g key={i}>
            <rect
              x={i * (barWidth + barGap)}
              y={height - barHeight}
              width={barWidth}
              height={barHeight}
              fill="blue"
            />
            <text
              x={i * (barWidth + barGap) + barWidth / 2}
              y={height + 15}
              textAnchor="middle"
              fontSize="12"
            >
              {d.label}
            </text>
            <text
              x={i * (barWidth + barGap) + barWidth / 2}
              y={height - barHeight - 5}
              textAnchor="middle"
              fontSize="12"
            >
              {d.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}