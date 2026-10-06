import assert from "node:assert/strict";
import test from "node:test";
import { ESLint } from "eslint";

const eslint = new ESLint();

for (const [filePath, source, forbidden] of [
  ["src/features/event/example.ts", 'import { service } from "@/backend/event/service"; void service;', true],
  ["src/features/event/example.ts", 'import { service } from "../../backend/event/service"; void service;', true],
  ["src/features/event/example.ts", 'import { form } from "@/features/registration/form"; void form;', true],
  ["src/features/event/example.ts", 'import { form } from "../registration/form"; void form;', true],
  ["src/backend/event/example.ts", 'import { service } from "@/backend/registration/service"; void service;', true],
  ["src/backend/event/example.ts", 'import { form } from "@/features/event/form"; void form;', true],
  ["src/app/example.ts", 'import { PrismaClient } from "@prisma/client"; void PrismaClient;', true],
  ["src/features/event/example.ts", 'import { form } from "./form"; void form;', false],
  ["src/backend/event/example.ts", 'import { service } from "./service"; void service;', false],
  ["src/app/api/health/route.ts", 'import { getHealthStatus } from "@/backend/health/service"; void getHealthStatus;', false],
]) {
  test(`${filePath}: ${source}`, async () => {
    const [result] = await eslint.lintText(source, { filePath });
    const restricted = result.messages.some((message) => message.ruleId === "no-restricted-imports");
    assert.equal(restricted, forbidden);
  });
}
