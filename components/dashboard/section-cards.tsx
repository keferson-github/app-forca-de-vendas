import {
  IconCalendarDue,
  IconTargetArrow,
  IconTrendingDown,
  IconTrendingUp,
  IconUsers,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NumberTicker } from "@/components/ui/number-ticker";

type SectionCardsProps = {
  customersCount: number;
  monthSales: number;
  ordersToday: number;
  monthRevenue: number;
  targetMonth: number;
  balance: number;
  balanceRaw: number;
  daysToMonthEnd: number;
};

type DashboardCard = {
  label: string;
  value: number;
  badge: string;
  icon: typeof IconUsers;
  footer: string;
  positive: boolean;
  format?: "currency";
};

const CURRENCY_FORMAT_OPTIONS: Intl.NumberFormatOptions = {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

export function SectionCards({
  customersCount,
  monthSales,
  ordersToday,
  monthRevenue,
  targetMonth,
  balance,
  balanceRaw,
  daysToMonthEnd,
}: SectionCardsProps) {
  const balanceReached = balanceRaw <= 0;

  const cards: DashboardCard[] = [
    {
      label: "Clientes cadastrados",
      value: customersCount,
      badge: "Base ativa",
      icon: IconUsers,
      footer: "Clientes e prospects alimentam CRM e pedidos.",
      positive: true,
    },
    {
      label: "Pedidos mes",
      value: monthSales,
      badge: "Mes atual",
      icon: IconTrendingUp,
      footer: `${ordersToday} pedido(s) registrado(s) hoje.`,
      positive: true,
    },
    {
      label: "Vendas",
      value: monthRevenue,
      format: "currency",
      badge: "Faturamento",
      icon: IconTrendingUp,
      footer: "Total de pedidos nao cancelados no mes.",
      positive: true,
    },
    {
      label: "Meta mes",
      value: targetMonth,
      format: "currency",
      badge: `${daysToMonthEnd} dias`,
      icon: IconTargetArrow,
      footer: `Falta(m) ${daysToMonthEnd} dias para completar o mes.`,
      positive: true,
    },
    {
      label: "Saldo",
      value: balance,
      format: "currency",
      badge: balanceReached ? "Meta batida" : "A realizar",
      icon: balanceReached ? IconTrendingUp : IconTrendingDown,
      footer: balanceReached
        ? "A meta mensal ja foi alcancada."
        : "Valor restante para atingir a meta mensal.",
      positive: balanceReached,
    },
    {
      label: "Pedidos hoje",
      value: ordersToday,
      badge: "Hoje",
      icon: IconCalendarDue,
      footer: "Ritmo diario conectado ao historico de pedidos.",
      positive: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3 dark:*:data-[slot=card]:bg-card">
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <Card key={card.label} className="@container/card">
            <CardHeader>
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                <NumberTicker
                  value={card.value}
                  locale="pt-BR"
                  decimalPlaces={card.format === "currency" ? 2 : 0}
                  formatOptions={
                    card.format === "currency" ? CURRENCY_FORMAT_OPTIONS : undefined
                  }
                  delay={index * 0.05}
                  className="tracking-normal text-inherit"
                />
              </CardTitle>
              <CardAction>
                <Badge variant="outline" className="gap-1">
                  <Icon className="size-3.5" />
                  {card.badge}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {card.positive ? "Indicador operacional" : "Ponto de atencao"}
                <Icon className="size-4" />
              </div>
              <div className="text-muted-foreground">{card.footer}</div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
