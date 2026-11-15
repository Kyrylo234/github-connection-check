export function getReportOptions(scenarioId: string) {
  return scenarioId === "supply-chain"
    ? {
        priorities: ["Patient safety and urgent clinical supply", "Quality checks on alternate components", "Hospital stock shortages and delivery delays", "Fair allocation across clinical partners", "Contingency costs and commercial contracts"],
        people: ["Patients", "Hospitals and clinical partners", "Suppliers and freight partners", "Operations team", "Leadership and finance"],
      }
    : {
        priorities: ["Stop further customer data exposure", "Preserve evidence for investigation", "Maintain essential customer services", "Accurate customer and regulator communication", "Reputation and commercial impact"],
        people: ["Affected customers", "Security and operations team", "Regulators", "Leadership", "Customer support and communications"],
      };
}

export function movePriority(items: string[], index: number, direction: -1 | 1): string[] {
  const target = index + direction;
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return items;
  const result = [...items];
  const current = result[index];
  const other = result[target];
  if (current === undefined || other === undefined) return items;
  result[index] = other;
  result[target] = current;
  return result;
}

export function parsePriorities(text: string): string[] {
  return text ? text.split("\n").filter(Boolean).map((line) => line.replace(/^\d+\. /, "")) : [];
}

export function formatPriorities(items: string[]): string {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}