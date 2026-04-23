"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type AnnualPoint = {
  month: string;
  sales: number;
  revenue: number;
};

type AnnualComparisonChartProps = {
  data: AnnualPoint[];
  metric: "vendas" | "faturamento";
};

const chartConfig = {
  sales: {
    label: "Vendas",
    color: "var(--chart-2)",
  },
  revenue: {
    label: "Faturamento",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

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
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[280px] w-full md:h-[340px]"
    >
      <AreaChart data={data} margin={{ left: 0, right: 12, top: 8 }}>
        <defs>
          <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-sales)" stopOpacity={0.42} />
            <stop offset="95%" stopColor="var(--color-sales)" stopOpacity={0.04} />
          </linearGradient>
          <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.42} />
            <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={12}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={72}
          tickFormatter={(value: number) =>
            isRevenue ? currencyFormatter.format(value) : String(value)
          }
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="dot"
              formatter={(value) =>
                isRevenue
                  ? currencyFormatter.format(Number(value ?? 0))
                  : `${Number(value ?? 0)} vendas`
              }
            />
          }
        />
        <Area
          dataKey={dataKey}
          type="natural"
          fill={isRevenue ? "url(#fillRevenue)" : "url(#fillSales)"}
          stroke={isRevenue ? "var(--color-revenue)" : "var(--color-sales)"}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
