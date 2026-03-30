"use client";

import { TrendingDown, TrendingUp } from "lucide-react";

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  color?: "indigo" | "emerald" | "blue" | "amber" | "rose";
  label?: string;
}

export function ProgressRing({
  value,
  max = 100,
  size = 120,
  color = "indigo",
  label,
}: ProgressRingProps) {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (percentage / 100) * circumference;

  const colorMap = {
    indigo: "#4F46E5",
    emerald: "#10B981",
    blue: "#3B82F6",
    amber: "#F59E0B",
    rose: "#F43F5E",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{ width: size, height: size }} className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r="45"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r="45"
            fill="none"
            stroke={colorMap[color]}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-slate-900">{value}%</span>
        </div>
      </div>
      {label && <p className="text-xs font-medium text-slate-600">{label}</p>}
    </div>
  );
}

interface TrendingIndicatorProps {
  value: number;
  previousValue: number;
  label: string;
  unit?: string;
  showChange?: boolean;
}

export function TrendingIndicator({
  value,
  previousValue,
  label,
  unit = "",
  showChange = true,
}: TrendingIndicatorProps) {
  const change = value - previousValue;
  const changePercent = previousValue === 0 ? 0 : (change / previousValue) * 100;
  const isPositive = change >= 0;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-900">
          {value}
          {unit}
        </span>
        {showChange && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              isPositive ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {isPositive ? (
              <TrendingUp size={16} />
            ) : (
              <TrendingDown size={16} />
            )}
            {Math.abs(changePercent).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-slate-600">{label}</p>
    </div>
  );
}

interface SimpleBarChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  height?: number;
}

export function SimpleBarChart({ data, height = 200 }: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  const colorMap: { [key: string]: string } = {
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    slate: "bg-slate-500",
  };

  return (
    <div style={{ height }} className="flex items-end gap-3 justify-around">
      {data.map((item, idx) => (
        <div
          key={idx}
          className="flex-1 flex flex-col items-center gap-2"
        >
          <div className="w-full flex items-end justify-center" style={{ height }}>
            <div
              className={`w-full ${
                colorMap[item.color || "indigo"]
              } rounded-t-lg transition-all hover:opacity-80 cursor-pointer`}
              style={{
                height: `${(item.value / maxValue) * (height - 30)}px`,
                minHeight: "4px",
              }}
              title={`${item.label}: ${item.value}`}
            ></div>
          </div>
          <span className="text-xs font-medium text-slate-600 text-center">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CircleChart({
  data,
  size = 180,
}: {
  data: Array<{ label: string; value: number; color: string }>;
  size?: number;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -90;

  const colorMap: { [key: string]: string } = {
    indigo: "#4F46E5",
    emerald: "#10B981",
    blue: "#3B82F6",
    amber: "#F59E0B",
    rose: "#F43F5E",
    slate: "#64748B",
  };

  const slices = data.map((item) => {
    const sliceAngle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const radius = size / 2 - 10;
    const x1 = size / 2 + radius * Math.cos(startRad);
    const y1 = size / 2 + radius * Math.sin(startRad);
    const x2 = size / 2 + radius * Math.cos(endRad);
    const y2 = size / 2 + radius * Math.sin(endRad);

    const largeArc = sliceAngle > 180 ? 1 : 0;

    const path = `M ${size / 2} ${size / 2} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    currentAngle = endAngle;

    return {
      path,
      label: item.label,
      value: item.value,
      percentage: ((item.value / total) * 100).toFixed(0),
      color: colorMap[item.color] || item.color,
    };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((slice, idx) => (
          <path
            key={idx}
            d={slice.path}
            fill={slice.color}
            opacity="0.9"
            className="hover:opacity-100 transition-opacity cursor-pointer"
          />
        ))}
      </svg>
      <div className="space-y-2">
        {slices.map((slice, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: slice.color }}
            ></div>
            <span className="text-slate-600">
              {slice.label}: <strong>{slice.percentage}%</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
