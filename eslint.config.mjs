import { defineConfig, globalIgnores } from "eslint/config";
import nextTs from "eslint-config-next/typescript";
import nextVitals from "eslint-config-next/core-web-vitals";

const features = ["account", "event", "registration", "committee", "attendance", "sponsorship", "workspace", "health"];

function otherFeaturePatterns(feature, layer) {
  return features.filter((name) => name !== feature).map((name) => ({
    group: [`@/${layer}/${name}`, `@/${layer}/${name}/**`, `**/${name}`, `**/${name}/**`],
    message: "Do not import another feature's internals. Agree on a shared contract first.",
  }));
}

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  ...features.map((feature) => ({
    files: [`src/features/${feature}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-imports": ["error", {
        paths: ["@prisma/client", "server-only"],
        patterns: [
          { group: ["@/backend", "@/backend/**", "**/backend/**"], message: "Frontend features must call API routes, not backend modules." },
          { group: ["@/app/**", "**/app/**"], message: "Features must not import route composition." },
          ...otherFeaturePatterns(feature, "features"),
        ],
      }],
    },
  })),
  ...features.map((feature) => ({
    files: [`src/backend/${feature}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          { group: ["@/features/**", "**/features/**", "@/app/**", "**/app/**"], message: "Backend modules must not import frontend or route modules." },
          ...otherFeaturePatterns(feature, "backend"),
        ],
      }],
    },
  })),
  {
    files: ["src/app/**/*.{ts,tsx}", "src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-modules": ["error", "@prisma/client"],
    },
  },
  {
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { paths: [{ name: "@prisma/client", message: "Database access belongs in src/backend." }] }],
    },
  },
  globalIgnores([".next/**", "build/**", "next-env.d.ts"]),
]);
