"use client"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

interface Props { data: { date: string; clicks: number }[] }

export function StatsChart({ data }: Props) {
  return (
    <LineChart width={600} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="clicks" stroke="#6366f1" />
    </LineChart>
  )
}
