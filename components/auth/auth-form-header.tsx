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
    <div className="mb-4 text-center sm:mb-9">
      <div className="mb-4 hidden justify-center sm:mb-10 sm:flex">
        <div className="inline-flex items-center gap-2 rounded-full bg-muted/70 px-3 py-1.5 text-[11px] font-medium text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:shadow-none">
          <span className="size-1.5 rounded-full bg-foreground" />
          <span className="text-foreground">Força de Vendas</span>
          <span className="h-3 w-px bg-border" />
          <span>{eyebrow}</span>
        </div>
      </div>

      <p className="mb-1 text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase sm:hidden">
        {eyebrow}
      </p>

      <h1 className="text-[2rem] font-semibold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      <p className="mx-auto mt-2 max-w-[300px] text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
