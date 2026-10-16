"use client";
import { useCallback, useEffect, useState } from "react";
import type { Role } from "@/contracts/account";
import { draftKey, draftSchema, emptyFiles, emptyValues, stepsFor, switchRole, type RegistrationFileValues, type RegistrationValues } from "./schemas";

export type RegistrationState = {
  role: Role | null;
  step: number;
  /** Furthest step the person has reached, so earlier steps can be revisited. */
  reached: number;
  values: RegistrationValues;
  files: RegistrationFileValues;
  errors: Record<string, string>;
  /** Set when a role switch cleared role-only fields. */
  switched: boolean;
};

const initial: RegistrationState = { role: null, step: 0, reached: 0, values: emptyValues, files: emptyFiles, errors: {}, switched: false };

/**
 * Wizard state. Values survive Back and role changes. A draft without the password or files is kept in
 * sessionStorage so a refresh in the middle of filling does not lose everything.
 */
export function useRegistration(presetRole: Role | null) {
  const [state, setState] = useState<RegistrationState>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const raw = sessionStorage.getItem(draftKey);
        const parsed = raw ? draftSchema.safeParse(JSON.parse(raw)) : null;
        setState((previous) => {
          let next = previous;
          if (parsed?.success) {
            const draft = parsed.data;
            const step = draft.role ? Math.min(draft.step, stepsFor[draft.role].length - 1) : 0;
            next = { ...previous, role: draft.role, step, reached: step, values: { ...emptyValues, ...draft.values } };
          }
          if (presetRole && next.role !== presetRole) {
            if (next.role) {
              const moved = switchRole(next.values, next.files, next.role, presetRole);
              next = { ...next, role: presetRole, values: moved.values, files: moved.files, step: 0, reached: 0, switched: true };
            } else next = { ...next, role: presetRole };
          }
          return next;
        });
      } catch { /* A broken draft is ignored; the form simply starts empty. */ }
      setReady(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [presetRole]);

  useEffect(() => {
    if (!ready) return;
    const { password, confirm, ...safe } = state.values;
    void password; void confirm;
    try { sessionStorage.setItem(draftKey, JSON.stringify({ version: 1, role: state.role, step: state.step, values: safe })); }
    catch { /* Storage can be blocked; the form still works without a draft. */ }
  }, [ready, state.role, state.step, state.values]);

  const pickRole = useCallback((role: Role) => setState((previous) => {
    if (!previous.role) return { ...previous, role, step: 0, reached: 0, errors: {}, switched: false };
    if (previous.role === role) return previous;
    const moved = switchRole(previous.values, previous.files, previous.role, role);
    return { ...previous, role, values: moved.values, files: moved.files, step: 0, reached: 0, errors: {}, switched: true };
  }), []);
  const clearRole = useCallback(() => setState((previous) => ({ ...previous, role: null, errors: {}, switched: false })), []);
  const setValue = useCallback(<K extends keyof RegistrationValues>(key: K, value: RegistrationValues[K]) => setState((previous) => ({ ...previous, values: { ...previous.values, [key]: value }, errors: { ...previous.errors, [key]: "" }, switched: false })), []);
  const setFile = useCallback((key: keyof RegistrationFileValues, file: File | null) => setState((previous) => ({ ...previous, files: { ...previous.files, [key]: file }, errors: { ...previous.errors, [key]: "" } })), []);
  const setErrors = useCallback((errors: Record<string, string>) => setState((previous) => ({ ...previous, errors })), []);
  const goTo = useCallback((step: number, reach = false) => setState((previous) => ({ ...previous, step, reached: reach ? Math.max(previous.reached, step) : previous.reached, errors: {}, switched: false })), []);
  const clearDraft = useCallback(() => { try { sessionStorage.removeItem(draftKey); } catch { /* Nothing to clear. */ } }, []);

  return { state, ready, pickRole, clearRole, setValue, setFile, setErrors, goTo, clearDraft };
}
