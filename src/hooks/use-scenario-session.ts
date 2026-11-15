import { useCallback, useEffect, useState } from "react";

import {
  applyScenarioChoice,
  createScenarioSession,
  isScenarioSession,
  startScenarioSession,
} from "@/lib/scenario-session";
import type { Scenario, ScenarioSession } from "@/types/scenario";

export function getScenarioStorageKey(scenarioId: string): string {
  return `sitrep.scenario.v1.${scenarioId}`;
}

function writeSession(session: ScenarioSession): void {
  try {
    window.sessionStorage.setItem(getScenarioStorageKey(session.scenarioId), JSON.stringify(session));
  } catch {
    // The exercise remains playable for this render if browser storage is unavailable.
  }
}

export function useScenarioSession(scenario: Scenario) {
  const [session, setSession] = useState<ScenarioSession>(() => createScenarioSession(scenario));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let restored: ScenarioSession | null = null;
    try {
      const stored: unknown = JSON.parse(window.sessionStorage.getItem(getScenarioStorageKey(scenario.id)) ?? "null");
      if (isScenarioSession(stored, scenario)) restored = stored;
    } catch {
      // Malformed or unavailable storage falls back to a clean exercise.
    }
    setSession(restored ?? createScenarioSession(scenario));
    setHydrated(true);
  }, [scenario]);

  const start = useCallback(() => {
    setSession((current) => {
      const next = startScenarioSession(current);
      writeSession(next);
      return next;
    });
  }, []);

  const choose = useCallback(
    (nodeId: string, choiceId: string): ScenarioSession | null => {
      const next = applyScenarioChoice(scenario, session, nodeId, choiceId);
      if (next) {
        setSession(next);
        writeSession(next);
      }
      return next;
    },
    [scenario, session],
  );

  const replay = useCallback(() => {
    const reset = createScenarioSession(scenario);
    setSession(reset);
    writeSession(reset);
  }, [scenario]);

  return { session, hydrated, start, choose, replay };
}
