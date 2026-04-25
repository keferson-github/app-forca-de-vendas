import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "sonner",
              message:
                "Use appToast de '@/lib/toast' para disparar notificacoes e mantenha o estilo centralizado.",
            },
            {
              name: "@/components/ui/sonner",
              message:
                "Use AppToaster de '@/components/shared/app-toaster' para montar o toaster global.",
            },
            {
              name: "@/components/ui/toaster",
              message:
                "Use AppToaster de '@/components/shared/app-toaster' para manter o padrao de notificacoes.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "lib/toast.ts",
      "components/ui/sonner.tsx",
      "components/shared/app-toaster.tsx",
      "components/ui/toaster.tsx",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
