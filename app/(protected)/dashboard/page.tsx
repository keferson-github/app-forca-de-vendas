import { auth } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name ?? "Usuario";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ola, {userName}</CardTitle>
          <CardDescription>Fundacao da Etapa 1 concluida com autenticacao e estrutura protegida.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {["Clientes cadastrados", "Pedidos no mes", "Pedidos hoje", "Meta mes", "Vendas", "Saldo"].map((label) => (
              <div key={label} className="rounded-lg bg-muted p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="mt-2 text-2xl font-semibold">0</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground">Falta(m) 0 dias para completar o mes.</p>
    </div>
  );
}
