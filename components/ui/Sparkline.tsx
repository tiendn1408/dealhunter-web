import React from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

export function Sparkline({
  data,
  width = 120,
  height = 36,
  className = "",
}: SparklineProps) {
  if (!data || data.length < 2) {
    return (
      <div
        style={{ width, height }}
        className={`flex items-center justify-center bg-pine-50 text-[13px] text-pine-700 ${className}`}
      >
        Chưa đủ dữ liệu
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Add padding inside SVG coordinates
  const paddingY = 4;
  const usableHeight = height - paddingY * 2;
  const stepX = width / (data.length - 1);

  const points = data.map((val, idx) => {
    const x = idx * stepX;
    // Invert Y because SVG origin is top-left
    const y = height - paddingY - ((val - min) / range) * usableHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(" L ")}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  // Determine trend color
  const first = data[0];
  const last = data[data.length - 1];
  const isDown = last < first;
  const isUp = last > first;

  // Drop in teal chalk, rise in red marker, flat in pine
  const strokeColor = isDown ? "#1A9988" : isUp ? "#D9412B" : "#2C7A6B";

  return (
    <svg
      width={width}
      height={height}
      className={`overflow-hidden ${className}`}
      viewBox={`0 0 ${width} ${height}`}
    >
      <path d={areaD} fill={strokeColor} fillOpacity={0.1} />
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
