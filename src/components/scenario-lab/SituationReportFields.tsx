import { Textarea } from "@/components/ui/textarea";
import { MAXIMUM_SITUATION_REPORT_CHARACTERS } from "@/lib/scenario-session";
import { parseReportDraft, REPORT_SECTIONS, serializeReportDraft } from "@/lib/situation-report-draft";

export function SituationReportFields({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const draft = parseReportDraft(value);
  return (
    <fieldset className="mt-5 space-y-5">
      <legend className="mb-4 font-system text-[10px] font-bold uppercase">Your situation report</legend>
      {REPORT_SECTIONS.map(({ id, label, prompt }, index) => (
        <div key={id}>
          <label htmlFor={`report-${id}`} className="block font-system text-[10px] font-bold uppercase">{String(index + 1).padStart(2, "0")} / {label}</label>
          <p id={`report-${id}-hint`} className="mt-1 text-[11px] font-medium leading-5">{prompt}</p>
          <Textarea
            id={`report-${id}`}
            aria-label={label}
            aria-describedby={`report-${id}-hint`}
            value={draft[id]}
            onChange={(event) => {
              const next = serializeReportDraft({ ...draft, [id]: event.target.value });
              if (next.length <= MAXIMUM_SITUATION_REPORT_CHARACTERS) onChange(next);
            }}
            placeholder="Your assessment…"
            className="mt-2 min-h-24 resize-y rounded-none border-report-rule bg-transparent text-xs font-medium leading-6 text-foreground placeholder:text-muted-foreground"
          />
        </div>
      ))}
    </fieldset>
  );
}