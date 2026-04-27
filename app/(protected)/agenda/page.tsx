import { SectionPlaceholder } from "@/components/layout/section-placeholder";

const AGENDA_FONT_FAMILY =
  '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export default function AgendaPage() {
  return (
    <div style={{ fontFamily: AGENDA_FONT_FAMILY }}>
      <SectionPlaceholder
        title="Agenda"
        description="Area preparada para compromissos e eventos comerciais."
      />
    </div>
  );
}
