"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LoginState, loginAction } from "@/app/(auth)/login/actions";
import { AuthFormHeader } from "@/components/auth/auth-form-header";
import { PasswordField } from "@/components/auth/password-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action] = useActionState(loginAction, initialState);

  return (
    <div className="mx-auto w-full max-w-[430px]">
      <AuthFormHeader
        eyebrow="Acesso seguro"
        title="Acessar conta"
        description="Entre para acompanhar clientes, pedidos e agenda comercial."
      />

      <form action={action} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" placeholder="voce@empresa.com" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <PasswordField id="password" name="password" required autoComplete="current-password" />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input className="h-4 w-4 rounded border-border" type="checkbox" name="rememberMe" />
          Lembrar senha
        </label>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        <SubmitButton>Entrar</SubmitButton>
      </form>
      <div className="mt-5 text-center text-sm text-muted-foreground">
        Ainda nao tem conta?{" "}
        <Link className="text-foreground underline underline-offset-4" href="/register">
          Cadastre-se
        </Link>
      </div>
    </div>
  );
}
