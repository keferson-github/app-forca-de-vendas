import Link from "next/link";
import type { Icon } from "@tabler/icons-react";
import { IconArrowRight } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type OperationalRow = {
  href: string;
  label: string;
  value: number;
  extra: string;
  icon: Icon;
};

export function OperationalTable({ rows }: { rows: OperationalRow[] }) {
  return (
    <Card className="mx-4 lg:mx-6">
      <CardHeader>
        <CardTitle>Operacao do Web App</CardTitle>
        <CardDescription>
          Leitura consolidada das secoes conectadas ao PostgreSQL.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-hidden px-0">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Secao</TableHead>
              <TableHead className="w-[120px] text-right">Registros</TableHead>
              <TableHead className="hidden md:table-cell">Contexto</TableHead>
              <TableHead className="w-[100px] text-right">Acao</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const Icon = row.icon;

              return (
                <TableRow key={row.href}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <Icon className="size-4" />
                      </div>
                      <span className="font-medium">{row.label}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {row.value}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="secondary">{row.extra}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={row.href}>
                        Abrir
                        <IconArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
