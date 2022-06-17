"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: { date: string; clicks: number }[];
}

function formatAxisDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Show only every 5th label
function tickFormatter(value: string, index: number) {
  if (index % 5 === 0) return formatAxisDate(value);
  return "";
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ink text-cream px-3 py-2 rounded-xl shadow-lg text-sm font-body">
      <p className="text-cream/50 text-xs mb-0.5">{label ? formatAxisDate(label) : ""}</p>
      <p className="font-medium">
        {payload[0].value.toLocaleString()}{" "}
        <span className="text-cream/50 font-normal">
          {payload[0].value === 1 ? "click" : "clicks"}
        </span>
      </p>
    </div>
  );
};

export default function StatsChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,13,13,0.06)" />
        <XAxis
          dataKey="date"
          tickFormatter={tickFormatter}
          tick={{ fontSize: 11, fill: "#8B8680", fontFamily: "DM Sans" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#8B8680", fontFamily: "DM Sans" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="clicks"
          stroke="#F59E0B"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#F59E0B", stroke: "#fff", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
