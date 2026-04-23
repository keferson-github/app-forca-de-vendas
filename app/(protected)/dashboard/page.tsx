import Link from "next/link";
import {
  CalendarClock,
  CheckCheck,
  ClipboardList,
  Package,
  Truck,
  UserRoundPlus,
  Users,
} from "lucide-react";
import { auth } from "@/auth";
import { AnnualComparisonChart } from "@/components/dashboard/annual-comparison-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{
  metric?: string;
  year?: string;
}>;

type DashboardMetric = "vendas" | "faturamento";

const MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function daysUntilMonthEnd(date: Date) {
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(0, Math.ceil((endOfDay(end).getTime() - date.getTime()) / msPerDay));
}

async function getDashboardData(userId: string, year: number) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

  const baseMonthly = MONTH_LABELS.map((month) => ({
    month,
    sales: 0,
    revenue: 0,
  }));

  try {
    const [
      customersCount,
      prospectsCount,
      carriersCount,
      productsCount,
      ordersCount,
      ordersToday,
      ordersMonthAgg,
      crmNotesCount,
      agendaEventsCount,
      upcomingAgendaCount,
      checkinsCount,
      checkinsMonthCount,
      contactsCount,
      documentsCount,
      dispatchSentCount,
      dispatchFailedCount,
      annualOrders,
      salesTargetMonth,
    ] = await prisma.$transaction([
      prisma.customer.count({ where: { userId } }),
      prisma.customer.count({ where: { userId, isProspect: true } }),
      prisma.carrier.count({ where: { userId } }),
      prisma.product.count({ where: { userId } }),
      prisma.order.count({ where: { userId } }),
      prisma.order.count({
        where: { userId, createdAt: { gte: startOfDay(now), lte: endOfDay(now) } },
      }),
      prisma.order.aggregate({
        where: { userId, createdAt: { gte: monthStart, lte: monthEnd }, status: { not: "CANCELLED" } },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.crmNote.count({ where: { userId } }),
      prisma.agendaEvent.count({ where: { userId } }),
      prisma.agendaEvent.count({ where: { userId, startAt: { gte: now } } }),
      prisma.checkin.count({ where: { userId } }),
      prisma.checkin.count({ where: { userId, checkedAt: { gte: monthStart, lte: monthEnd } } }),
      prisma.customerContact.count({ where: { userId } }),
      prisma.orderDocument.count({ where: { userId } }),
      prisma.whatsappDispatchLog.count({ where: { userId, status: "SENT" } }),
      prisma.whatsappDispatchLog.count({ where: { userId, status: "FAILED" } }),
      prisma.order.findMany({
        where: {
          userId,
          createdAt: { gte: yearStart, lte: yearEnd },
          status: { not: "CANCELLED" },
        },
        select: {
          createdAt: true,
          total: true,
        },
      }),
      prisma.salesTarget.findUnique({
        where: {
          userId_year_month: {
            userId,
            year: now.getFullYear(),
            month: now.getMonth() + 1,
          },
        },
        select: {
          targetAmount: true,
          revenueAmount: true,
          salesAmount: true,
        },
      }),
    ]);

    const annualComparison = [...baseMonthly];
    for (const order of annualOrders) {
      const idx = order.createdAt.getMonth();
      annualComparison[idx].sales += 1;
      annualComparison[idx].revenue += Number(order.total);
    }

    const monthRevenue = Number(ordersMonthAgg._sum.total ?? 0);
    const monthSales = ordersMonthAgg._count.id;
    const targetMonth = Number(salesTargetMonth?.targetAmount ?? 0);
    const balance = targetMonth - monthRevenue;

    return {
      hasDataError: false,
      cards: {
        customersCount,
        prospectsCount,
        carriersCount,
        productsCount,
        ordersCount,
        ordersToday,
        monthSales,
        monthRevenue,
        targetMonth,
        balance,
      },
      modules: {
        crmNotesCount,
        agendaEventsCount,
        upcomingAgendaCount,
        checkinsCount,
        checkinsMonthCount,
        contactsCount,
        documentsCount,
        dispatchSentCount,
        dispatchFailedCount,
      },
      annualComparison,
      daysToMonthEnd: daysUntilMonthEnd(now),
    };
  } catch {
    return {
      hasDataError: true,
      cards: {
        customersCount: 0,
        prospectsCount: 0,
        carriersCount: 0,
        productsCount: 0,
        ordersCount: 0,
        ordersToday: 0,
        monthSales: 0,
        monthRevenue: 0,
        targetMonth: 0,
        balance: 0,
      },
      modules: {
        crmNotesCount: 0,
        agendaEventsCount: 0,
        upcomingAgendaCount: 0,
        checkinsCount: 0,
        checkinsMonthCount: 0,
        contactsCount: 0,
        documentsCount: 0,
        dispatchSentCount: 0,
        dispatchFailedCount: 0,
      },
      annualComparison: baseMonthly,
      daysToMonthEnd: 0,
    };
  }
}

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function DashboardPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const metric: DashboardMetric =
    searchParams.metric === "vendas" ? "vendas" : "faturamento";
  const currentYear = new Date().getFullYear();
  const selectedYear = Number(searchParams.year ?? currentYear);
  const year =
    Number.isFinite(selectedYear) && selectedYear >= 2020 && selectedYear <= 2100
      ? selectedYear
      : currentYear;

  const session = await auth();
  const userName = session?.user?.name ?? "Usuario";
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const data = await getDashboardData(userId, year);
  const yearOptions = Array.from({ length: 6 }, (_, idx) => currentYear - idx);

  const sectionLinks = [
    {
      href: "/clientes",
      label: "Clientes",
      value: data.cards.customersCount,
      extra: `${data.cards.prospectsCount} prospects`,
      icon: Users,
    },
    {
      href: "/transportadoras",
      label: "Transportadoras",
      value: data.cards.carriersCount,
      extra: "Cadastros ativos",
      icon: Truck,
    },
    {
      href: "/produtos",
      label: "Produtos",
      value: data.cards.productsCount,
      extra: "Itens no catalogo",
      icon: Package,
    },
    {
      href: "/pedidos",
      label: "Pedidos",
      value: data.cards.ordersCount,
      extra: `${data.cards.ordersToday} hoje`,
      icon: ClipboardList,
    },
    {
      href: "/crm",
      label: "CRM",
      value: data.modules.crmNotesCount,
      extra: "Anotacoes registradas",
      icon: UserRoundPlus,
    },
    {
      href: "/agenda",
      label: "Agenda",
      value: data.modules.agendaEventsCount,
      extra: `${data.modules.upcomingAgendaCount} proximos`,
      icon: CalendarClock,
    },
    {
      href: "/checkins",
      label: "Checkins",
      value: data.modules.checkinsCount,
      extra: `${data.modules.checkinsMonthCount} no mes`,
      icon: CheckCheck,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ola, {userName}</CardTitle>
          <CardDescription>
            Painel consolidado com indicadores reais de todas as secoes do Web App.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-lg bg-muted p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Pedidos no mes
              </p>
              <p className="mt-2 text-xl font-semibold sm:text-2xl">
                {data.cards.monthSales}
              </p>
            </div>
            <div className="rounded-lg bg-muted p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Pedidos hoje
              </p>
              <p className="mt-2 text-xl font-semibold sm:text-2xl">
                {data.cards.ordersToday}
              </p>
            </div>
            <div className="rounded-lg bg-muted p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Vendas / Faturamento no mes
              </p>
              <p className="mt-2 text-xl font-semibold sm:text-2xl">
                {currency(data.cards.monthRevenue)}
              </p>
            </div>
            <div className="rounded-lg bg-muted p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Meta mes
              </p>
              <p className="mt-2 text-xl font-semibold sm:text-2xl">
                {currency(data.cards.targetMonth)}
              </p>
            </div>
            <div className="rounded-lg bg-muted p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Saldo</p>
              <p className="mt-2 text-xl font-semibold sm:text-2xl">
                {currency(data.cards.balance)}
              </p>
            </div>
            <div className="rounded-lg bg-muted p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Falta(m) para fechar o mes
              </p>
              <p className="mt-2 text-xl font-semibold sm:text-2xl">
                {data.daysToMonthEnd} dias
              </p>
            </div>
          </div>
          {data.hasDataError ? (
            <p className="mt-4 text-sm text-amber-700">
              Nao foi possivel ler parte dos dados do banco. Verifique migrations e conexao.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Comparativo de Vendas Anual</CardTitle>
            <CardDescription>
              Filtro entre Vendas e Faturamento para o ano selecionado.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`?metric=vendas&year=${year}`}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                metric === "vendas"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              Vendas
            </Link>
            <Link
              href={`?metric=faturamento&year=${year}`}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                metric === "faturamento"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              Faturamento
            </Link>
            <div className="flex flex-wrap gap-1">
              {yearOptions.map((option) => (
                <Link
                  key={option}
                  href={`?metric=${metric}&year=${option}`}
                  className={`rounded-md px-2.5 py-1 text-xs ${
                    option === year
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {option}
                </Link>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AnnualComparisonChart data={data.annualComparison} metric={metric} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sectionLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="h-full transition-transform hover:-translate-y-0.5">
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </CardDescription>
                  <CardTitle className="text-2xl">{item.value}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{item.extra}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics Operacional</CardTitle>
          <CardDescription>
            Indicadores de CRM, agenda, contatos, documentos e envios via WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Anotacoes CRM</p>
              <p className="mt-2 text-xl font-semibold">{data.modules.crmNotesCount}</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Contatos</p>
              <p className="mt-2 text-xl font-semibold">{data.modules.contactsCount}</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Docs de pedido</p>
              <p className="mt-2 text-xl font-semibold">{data.modules.documentsCount}</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">WhatsApp (enviados)</p>
              <p className="mt-2 text-xl font-semibold">{data.modules.dispatchSentCount}</p>
            </div>
            <div className="rounded-lg bg-muted p-4 sm:col-span-2 lg:col-span-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">WhatsApp (falhas)</p>
              <p className="mt-2 text-xl font-semibold">{data.modules.dispatchFailedCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
