"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface StatusData {
  name: string;
  value: number;
  label: string;
  [key: string]: string | number;
}

interface OrdersStatusChartProps {
  data: StatusData[];
}

const COLORS = {
  pending: "#f59e0b",
  processing: "#3b82f6",
  shipped: "#8b5cf6",
  delivered: "#10b981",
  cancelled: "#ef4444",
};

export function OrdersStatusChart({ data }: OrdersStatusChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: StatusData }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border">
          <p className="font-semibold">{data.payload.label}</p>
          <p className="text-sm text-gray-600">
            {data.value} pedidos ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = (props: unknown) => {
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      percent,
    } = props as {
      cx: number;
      cy: number;
      midAngle: number;
      innerRadius: number;
      outerRadius: number;
      percent: number;
    };
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Não mostra label para valores muito pequenos

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="font-semibold text-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status dos Pedidos</CardTitle>
        <CardDescription>Distribuição dos pedidos por status</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={COLORS[entry.name as keyof typeof COLORS]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value, entry) => (entry.payload as StatusData).label}
              wrapperStyle={{ fontSize: "14px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
