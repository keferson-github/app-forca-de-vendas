import { SectionPlaceholder } from "@/components/layout/section-placeholder";

const CHECKINS_FONT_FAMILY =
  '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export default function CheckinsPage() {
  return (
    <div style={{ fontFamily: CHECKINS_FONT_FAMILY }}>
      <SectionPlaceholder
        title="Checkins"
        description="Area preparada para registrar checkins e historico."
      />
    </div>
  );
}
