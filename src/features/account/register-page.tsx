"use client";
import { SessionGate } from "@/lib/session";
import { SiteFrame } from "@/lib/ui";
import RegisterWizard from "./signup/register-wizard";

export default function RegisterPage() {
  return <SessionGate guest><SiteFrame><RegisterWizard /></SiteFrame></SessionGate>;
}
