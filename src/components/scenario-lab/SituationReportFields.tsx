import { Textarea } from "@/components/ui/textarea";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatPriorities, getReportOptions, movePriority, parsePriorities } from "@/lib/report-options";
import { MAXIMUM_SITUATION_REPORT_CHARACTERS } from "@/lib/scenario-session";
import { parseReportDraft, REPORT_SECTIONS, serializeReportDraft } from "@/lib/situation-report-draft";

export function SituationReportFields({ value, onChange, scenarioId }: { value: string; onChange: (value: string) => void; scenarioId: string }) {
  const draft = parseReportDraft(value);
  const options = getReportOptions(scenarioId);
  const priorities = parsePriorities(draft.priority);
  const people = draft.people ? draft.people.split("\n").filter(Boolean) : [];
  const update = (id: keyof typeof draft, text: string) => {
    const next = serializeReportDraft({ ...draft, [id]: text });
    if (next.length <= MAXIMUM_SITUATION_REPORT_CHARACTERS) onChange(next);
  };
  return (
    <fieldset className="mt-5 space-y-5">
      <legend className="mb-4 font-system text-[10px] font-bold uppercase">Your situation report</legend>
      {REPORT_SECTIONS.map(({ id, label, prompt }, index) => (
        <div key={id}>
          <label htmlFor={`report-${id}`} className="block font-system text-[10px] font-bold uppercase">{String(index + 1).padStart(2, "0")} / {label}</label>
          <p id={`report-${id}-hint`} className="mt-1 text-[11px] font-medium leading-5">{id === "priority" ? "Which risks come first?" : id === "people" ? "Who is affected or needs an update?" : prompt}</p>
          {id === "priority" ? (
            <div className="mt-3 space-y-3">
              <ol className="space-y-2" aria-label="Ranked priorities">
                {priorities.map((item, rank) => (
                  <li key={item} className="flex items-center gap-2 border border-report-rule p-2">
                    <span className="font-system text-sm font-bold">{rank + 1}</span>
                    <span className="min-w-0 flex-1 text-[11px] font-semibold leading-5">{item}</span>
                    <div className="flex shrink-0 flex-col">
                      <Button type="button" variant="ghost" size="icon" className="size-8" title="Move up" aria-label={`Move ${item} up`} disabled={rank === 0} onClick={() => update("priority", formatPriorities(movePriority(priorities, rank, -1)))}><ArrowUp className="size-4" /></Button>
                      <Button type="button" variant="ghost" size="icon" className="size-8" title="Move down" aria-label={`Move ${item} down`} disabled={rank === priorities.length - 1} onClick={() => update("priority", formatPriorities(movePriority(priorities, rank, 1)))}><ArrowDown className="size-4" /></Button>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0" title="Remove priority" aria-label={`Remove ${item}`} onClick={() => update("priority", formatPriorities(priorities.filter((_, i) => i !== rank)))}><X className="size-4" /></Button>
                  </li>
                ))}
              </ol>
              <div className="space-y-2">
                {options.priorities.filter((item) => !priorities.includes(item)).map((item) => (
                  <Button key={item} type="button" variant="outline" className="h-auto w-full justify-start whitespace-normal rounded-none border-report-rule bg-transparent px-3 py-2 text-left text-[11px] leading-5" onClick={() => update("priority", formatPriorities([...priorities, item]))}><Plus className="size-4 shrink-0" />{item}</Button>
                ))}
              </div>
            </div>
          ) : id === "people" ? (
            <div className="mt-3 space-y-3">
              {[...new Set([...options.people, ...people])].map((person, personIndex) => (
                <label key={person} htmlFor={`person-${personIndex}`} className="flex items-start gap-3 text-[11px] font-semibold leading-5">
                  <Checkbox id={`person-${personIndex}`} className="mt-0.5 border-report-rule" checked={people.includes(person)} onCheckedChange={(checked) => update("people", (checked === true ? [...people, person] : people.filter((item) => item !== person)).join("\n"))} />{person}
                </label>
              ))}
            </div>
          ) : <Textarea
            id={`report-${id}`}
            aria-label={label}
            aria-describedby={`report-${id}-hint`}
            value={draft[id]}
            onChange={(event) => update(id, event.target.value)}
            placeholder="Your assessment…"
            className="mt-2 min-h-24 resize-y rounded-none border-report-rule bg-transparent text-xs font-medium leading-6 text-foreground placeholder:text-muted-foreground"
          />}
        </div>
      ))}
    </fieldset>
  );
}