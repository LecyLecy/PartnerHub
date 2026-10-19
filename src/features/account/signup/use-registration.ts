"use client";
import { useCallback, useState } from "react";
import type { Role } from "@/contracts/account";
import { emptyFiles, emptyValues, switchRole, type RegistrationFileValues, type RegistrationValues } from "./schemas";

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

/** Form values stay in memory while navigating steps; reloading starts a new registration. */
export function useRegistration(presetRole: Role | null) {
  const [state, setState] = useState<RegistrationState>(() => ({ ...initial, role: presetRole }));

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

  return { state, pickRole, clearRole, setValue, setFile, setErrors, goTo };
}
