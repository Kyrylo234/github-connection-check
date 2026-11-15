export const REPORT_SECTIONS = [
  { id: "situation", label: "Situation", prompt: "What happened, what is affected, and where do things stand?" },
  { id: "priority", label: "Priority risk", prompt: "What needs attention first, and what harm could it cause?" },
  { id: "actions", label: "Actions taken", prompt: "Which decisions did you take, and why?" },
  { id: "people", label: "People affected", prompt: "Who is affected, and who needs an update?" },
  { id: "next", label: "Next steps", prompt: "What happens next, and who should take responsibility?" },
  { id: "unknowns", label: "Remaining uncertainty", prompt: "What is still unknown or needs checking?" },
] as const;

export type ReportSectionId = typeof REPORT_SECTIONS[number]["id"];
export type ReportDraft = Record<ReportSectionId, string>;

export function parseReportDraft(text: string): ReportDraft {
  const draft: ReportDraft = { situation: "", priority: "", actions: "", people: "", next: "", unknowns: "" };
  if (!text.startsWith("Situation:\n")) return { ...draft, situation: text };
  for (let index = 0; index < REPORT_SECTIONS.length; index++) {
    const section = REPORT_SECTIONS[index];
    if (!section) continue;
    const marker = `${section.label}:\n`;
    const start = text.indexOf(marker);
    if (start < 0) continue;
    const next = REPORT_SECTIONS[index + 1];
    const end = next ? text.indexOf(`\n\n${next.label}:\n`, start + marker.length) : -1;
    draft[section.id] = text.slice(start + marker.length, end < 0 ? undefined : end);
  }
  return draft;
}

export function serializeReportDraft(draft: ReportDraft): string {
  if (REPORT_SECTIONS.every(({ id }) => !draft[id])) return "";
  return REPORT_SECTIONS.map(({ id, label }) => `${label}:\n${draft[id]}`).join("\n\n");
}

export function reportBody(text: string): string {
  const draft = parseReportDraft(text);
  return REPORT_SECTIONS.map(({ id }) => draft[id]).filter(Boolean).join("\n\n");
}