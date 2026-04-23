import Link from "next/link";
import {
  IconCalendar,
  IconClipboardList,
  IconFileDescription,
  IconMapPinCheck,
  IconMessageCircle,
  IconNotes,
  IconPackage,
  IconTruck,
  IconUserPlus,
  IconUsers,
} from "@tabler/icons-react";
import { auth } from "@/auth";
import { AnnualComparisonChart } from "@/components/dashboard/annual-comparison-chart";
import {
  OperationalTable,
  type OperationalRow,
} from "@/components/dashboard/operational-table";
import { SectionCards } from "@/components/dashboard/section-cards";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      icon: IconUsers,
    },
    {
      href: "/transportadoras",
      label: "Transportadoras",
      value: data.cards.carriersCount,
      extra: "Cadastros ativos",
      icon: IconTruck,
    },
    {
      href: "/produtos",
      label: "Produtos",
      value: data.cards.productsCount,
      extra: "Itens no catalogo",
      icon: IconPackage,
    },
    {
      href: "/pedidos",
      label: "Pedidos",
      value: data.cards.ordersCount,
      extra: `${data.cards.ordersToday} hoje`,
      icon: IconClipboardList,
    },
    {
      href: "/crm",
      label: "CRM",
      value: data.modules.crmNotesCount,
      extra: "Anotacoes registradas",
      icon: IconUserPlus,
    },
    {
      href: "/agenda",
      label: "Agenda",
      value: data.modules.agendaEventsCount,
      extra: `${data.modules.upcomingAgendaCount} proximos`,
      icon: IconCalendar,
    },
    {
      href: "/checkins",
      label: "Checkins",
      value: data.modules.checkinsCount,
      extra: `${data.modules.checkinsMonthCount} no mes`,
      icon: IconMapPinCheck,
    },
  ] satisfies OperationalRow[];

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit">
            Ola, {userName}
          </Badge>
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Visao comercial em tempo real
              </h2>
              <p className="text-sm text-muted-foreground">
                Dashboard no padrao shadcn/ui com metricas reais de clientes,
                pedidos, CRM, agenda, checkins e documentos.
              </p>
            </div>
            {data.hasDataError ? (
              <Badge variant="outline" className="border-amber-500/50 text-amber-700">
                Verifique migrations/conexao
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <SectionCards
        customersCount={data.cards.customersCount}
        monthSales={data.cards.monthSales}
        ordersToday={data.cards.ordersToday}
        monthRevenue={currency(data.cards.monthRevenue)}
        targetMonth={currency(data.cards.targetMonth)}
        balance={currency(data.cards.balance)}
        balanceRaw={data.cards.balance}
        daysToMonthEnd={data.daysToMonthEnd}
      />

      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Comparativo de Vendas Anual</CardTitle>
              <CardDescription>
                Filtro entre vendas e faturamento para o ano selecionado.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Tabs value={metric}>
                <TabsList>
                  <TabsTrigger asChild value="vendas">
                    <Link href={`?metric=vendas&year=${year}`}>Vendas</Link>
                  </TabsTrigger>
                  <TabsTrigger asChild value="faturamento">
                    <Link href={`?metric=faturamento&year=${year}`}>
                      Faturamento
                    </Link>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex flex-wrap gap-1">
                {yearOptions.map((option) => (
                  <Link
                    key={option}
                    href={`?metric=${metric}&year=${option}`}
                    className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                      option === year
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground hover:bg-muted/80"
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
      </div>

      <OperationalTable rows={sectionLinks} />

      <div className="grid gap-4 px-4 lg:grid-cols-3 lg:px-6">
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <IconNotes className="size-4" />
              CRM e contatos
            </CardDescription>
            <CardTitle className="text-2xl">
              {data.modules.crmNotesCount + data.modules.contactsCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {data.modules.crmNotesCount} anotacoes e {data.modules.contactsCount} contatos cadastrados.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <IconFileDescription className="size-4" />
              Documentos
            </CardDescription>
            <CardTitle className="text-2xl">{data.modules.documentsCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Declaracoes e documentos gerados a partir de pedidos.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <IconMessageCircle className="size-4" />
              WhatsApp
            </CardDescription>
            <CardTitle className="text-2xl">{data.modules.dispatchSentCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {data.modules.dispatchFailedCount} falha(s) registrada(s) no envio via Evolution API.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
