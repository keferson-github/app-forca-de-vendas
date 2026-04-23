"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AnnualPoint = {
  month: string;
  sales: number;
  revenue: number;
};

type AnnualComparisonChartProps = {
  data: AnnualPoint[];
  metric: "vendas" | "faturamento";
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function AnnualComparisonChart({
  data,
  metric,
}: AnnualComparisonChartProps) {
  const isRevenue = metric === "faturamento";
  const dataKey = isRevenue ? "revenue" : "sales";

  return (
    <div className="h-[290px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 4, right: 4, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.35} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            fontSize={12}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={72}
            tickFormatter={(value: number) =>
              isRevenue ? currencyFormatter.format(value) : String(value)
            }
          />
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
            formatter={(value) =>
              isRevenue
                ? currencyFormatter.format(Number(value ?? 0))
                : `${Number(value ?? 0)} vendas`
            }
            labelFormatter={(label) => `Mes: ${label}`}
          />
          <Bar
            dataKey={dataKey}
            fill={isRevenue ? "#171717" : "#2563eb"}
            radius={[8, 8, 0, 0]}
            maxBarSize={34}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
