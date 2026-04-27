import { SectionPlaceholder } from "@/components/layout/section-placeholder";

const CRM_FONT_FAMILY =
  '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export default function CrmPage() {
  return (
    <div style={{ fontFamily: CRM_FONT_FAMILY }}>
      <SectionPlaceholder
        title="CRM"
        description="Area preparada para anotacoes, agenda e ultimas vendas."
      />
    </div>
  );
}
