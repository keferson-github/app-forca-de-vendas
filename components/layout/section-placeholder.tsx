import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SectionPlaceholderProps = {
  title: string;
  description: string;
};

export function SectionPlaceholder({ title, description }: SectionPlaceholderProps) {
  return (
    <Card className="m-4 w-auto max-w-3xl lg:m-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Estrutura base pronta com rota protegida e layout padrão. CRUD completo será entregue na próxima etapa.
        </p>
      </CardContent>
    </Card>
  );
}
