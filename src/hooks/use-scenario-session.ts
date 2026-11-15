import { useCallback, useEffect, useState } from "react";

import {
  acknowledgeScenarioEvent,
  applyScenarioChoice,
  continueScenarioMonitoring,
  createScenarioSession,
  isScenarioSession,
  receiveScenarioEvent,
  startScenarioSession,
  submitSituationReport,
  updateSituationReportDraft,
} from "@/lib/scenario-session";
import type { Scenario, ScenarioSession } from "@/types/scenario";

export function getScenarioStorageKey(scenarioId: string): string {
  return `sitrep.scenario.v2.${scenarioId}`;
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

  const commit = useCallback((update: (current: ScenarioSession) => ScenarioSession) => {
    setSession((current) => {
      const next = update(current);
      if (next !== current) writeSession(next);
      return next;
    });
  }, []);

  const start = useCallback(() => {
    commit((current) => startScenarioSession(current));
  }, [commit]);

  const receiveEvent = useCallback((nodeId: string) => {
    commit((current) => receiveScenarioEvent(current, nodeId));
  }, [commit]);

  const acknowledgeEvent = useCallback((nodeId: string) => {
    commit((current) => acknowledgeScenarioEvent(current, nodeId));
  }, [commit]);

  const continueMonitoring = useCallback(() => {
    commit(continueScenarioMonitoring);
  }, [commit]);

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

  const updateReportDraft = useCallback((text: string) => {
    commit((current) => updateSituationReportDraft(current, text));
  }, [commit]);

  const submitReport = useCallback((): ScenarioSession | null => {
    const next = submitSituationReport(session);
    if (next) {
      setSession(next);
      writeSession(next);
    }
    return next;
  }, [session]);

  const replay = useCallback(() => {
    const reset = createScenarioSession(scenario);
    setSession(reset);
    writeSession(reset);
  }, [scenario]);

  return {
    session,
    hydrated,
    start,
    receiveEvent,
    acknowledgeEvent,
    continueMonitoring,
    choose,
    updateReportDraft,
    submitReport,
    replay,
  };
}
