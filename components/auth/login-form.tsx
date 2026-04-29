"use client";

import Link from "next/link";
import { useState } from "react";
import { useActionState } from "react";
import { LoginState, loginAction } from "@/app/(auth)/login/actions";
import { AuthFormHeader } from "@/components/auth/auth-form-header";
import { PasswordField } from "@/components/auth/password-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const initialState: LoginState = {};
const REMEMBERED_CREDENTIALS_STORAGE_KEY = "forca-vendas-remembered-credentials";

type LoginFormProps = {
  rememberedEmail?: string;
  rememberEmail?: boolean;
};

export function LoginForm({
  rememberedEmail = "",
  rememberEmail = false,
}: LoginFormProps) {
  const [savedCredentials] = useState(() => {
    if (typeof window === "undefined") {
      return null as { email: string; password: string } | null;
    }

    const rawValue = window.localStorage.getItem(REMEMBERED_CREDENTIALS_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawValue) as { email?: unknown; password?: unknown };
      if (typeof parsed.email !== "string" || typeof parsed.password !== "string") {
        return null;
      }

      return { email: parsed.email, password: parsed.password };
    } catch {
      return null;
    }
  });
  const [state, action] = useActionState(loginAction, initialState);
  const [email, setEmail] = useState(savedCredentials?.email ?? rememberedEmail);
  const [password, setPassword] = useState(savedCredentials?.password ?? "");
  const [rememberMeEnabled, setRememberMeEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return rememberEmail;
    }

    return Boolean(savedCredentials) || rememberEmail;
  });

  function handleSubmit() {
    const normalizedEmail = email.trim().toLowerCase();
    if (rememberMeEnabled && normalizedEmail && password) {
      window.localStorage.setItem(
        REMEMBERED_CREDENTIALS_STORAGE_KEY,
        JSON.stringify({ email: normalizedEmail, password })
      );
      return;
    }

    window.localStorage.removeItem(REMEMBERED_CREDENTIALS_STORAGE_KEY);
  }

  return (
    <div className="mx-auto w-full max-w-[430px]">
      <AuthFormHeader
        eyebrow="Acesso seguro"
        title="Acessar conta"
        description="Entre para acompanhar clientes, pedidos e agenda comercial."
      />

      <form
        action={action}
        onSubmit={handleSubmit}
        className="space-y-5 sm:space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            E-mail
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Digite seu e-mail"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            className="h-12 rounded-xl border-transparent bg-muted/50 text-base shadow-none sm:h-9 sm:rounded-md sm:border-input sm:bg-transparent"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Senha
          </Label>
          <PasswordField
            id="password"
            name="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
            inputClassName="h-12 rounded-xl border-transparent bg-muted/50 text-base shadow-none sm:h-9 sm:rounded-md sm:border-input sm:bg-transparent"
            toggleClassName="h-10 w-10 rounded-xl sm:h-8 sm:w-8 sm:rounded-md"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <input
            type="hidden"
            name="rememberMe"
            value={rememberMeEnabled ? "true" : "false"}
          />
          <Label
            htmlFor="rememberMe"
            className="cursor-pointer text-sm font-normal text-muted-foreground"
          >
            Manter-me conectado
          </Label>
          <Switch
            id="rememberMe"
            checked={rememberMeEnabled}
            onCheckedChange={setRememberMeEnabled}
          />
        </div>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        <SubmitButton className="h-12 w-full rounded-xl text-base font-medium sm:h-9 sm:rounded-md sm:text-sm">
          Entrar
        </SubmitButton>
      </form>
      <div className="mt-10 text-center text-sm text-muted-foreground sm:mt-5">
        Ainda não tem conta?{" "}
        <Link
          className="font-bold text-primary sm:font-normal sm:text-foreground sm:underline sm:underline-offset-4"
          href="/register"
        >
          Cadastre-se
        </Link>
      </div>
    </div>
  );
}
