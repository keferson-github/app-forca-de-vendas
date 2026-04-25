type AuthFormHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function AuthFormHeader({
  eyebrow,
  title,
  description,
}: AuthFormHeaderProps) {
  return (
    <div className="mb-7 text-left sm:mb-9 sm:text-center">
      <div className="mb-6 flex justify-start sm:mb-10 sm:justify-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-muted/70 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:shadow-none">
          <span className="size-1.5 rounded-full bg-foreground" />
          <span className="text-foreground">Força de Vendas</span>
          <span className="h-3 w-px bg-border" />
          <span>{eyebrow}</span>
        </div>
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl sm:font-semibold">
        {title}
      </h1>
      <p className="mt-3 max-w-[340px] text-sm leading-6 text-muted-foreground sm:mx-auto sm:max-w-[320px]">
        {description}
      </p>
    </div>
  );
}
