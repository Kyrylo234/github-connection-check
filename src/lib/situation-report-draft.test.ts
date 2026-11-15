import { describe, expect, it } from "vitest";
import { parseReportDraft, reportBody, serializeReportDraft } from "./situation-report-draft";

describe("structured situation reports", () => {
  it("preserves all six answers through storage", () => {
    const draft = { situation: "Shortage\nconfirmed.", priority: "Clinical risk", actions: "Qualified supplier", people: "Hospitals", next: "Verify stock", unknowns: "Delivery timing" };
    expect(parseReportDraft(serializeReportDraft(draft))).toEqual(draft);
  });
  it("retains older free-text drafts", () => {
    expect(parseReportDraft("My previous report").situation).toBe("My previous report");
  });
  it("does not count blank headings as authored assessment", () => {
    const text = serializeReportDraft({ situation: "Shortage", priority: "", actions: "", people: "", next: "", unknowns: "" });
    expect(reportBody(text)).toBe("Shortage");
  });
});