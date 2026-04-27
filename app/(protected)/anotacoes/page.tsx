import { SectionPlaceholder } from "@/components/layout/section-placeholder";

const ANOTACOES_FONT_FAMILY =
  '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export default function AnotacoesPage() {
  return (
    <div style={{ fontFamily: ANOTACOES_FONT_FAMILY }}>
      <SectionPlaceholder
        title="Anotacoes"
        description="Area preparada para anotacoes vinculadas ao CRM."
      />
    </div>
  );
}
