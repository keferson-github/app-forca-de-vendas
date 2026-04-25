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
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXAttribute[name.name='className'][value.type='Literal'][value.value='grid gap-3 md:grid-cols-3']",
          message:
            "Nao use o grid de analytics de tres cards no topo. Prefira cabecalho + conteudo principal da pagina.",
        },
        {
          selector: "Literal[value='Total cadastrado']",
          message:
            "Este rotulo de KPI rapido foi descontinuado. Nao adicione cards de analytics nesse formato.",
        },
        {
          selector: "Literal[value='Com imagem']",
          message:
            "Este rotulo de KPI rapido foi descontinuado. Nao adicione cards de analytics nesse formato.",
        },
        {
          selector: "Literal[value='Itens vinculados']",
          message:
            "Este rotulo de KPI rapido foi descontinuado. Nao adicione cards de analytics nesse formato.",
        },
        {
          selector: "Literal[value='Confirmados']",
          message:
            "Este rotulo de KPI rapido foi descontinuado. Nao adicione cards de analytics nesse formato.",
        },
        {
          selector: "Literal[value='Cancelados']",
          message:
            "Este rotulo de KPI rapido foi descontinuado. Nao adicione cards de analytics nesse formato.",
        },
        {
          selector: "Literal[value='Com contato']",
          message:
            "Este rotulo de KPI rapido foi descontinuado. Nao adicione cards de analytics nesse formato.",
        },
        {
          selector: "Literal[value='Com telefone']",
          message:
            "Este rotulo de KPI rapido foi descontinuado. Nao adicione cards de analytics nesse formato.",
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
