"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LoginState, loginAction } from "@/app/(auth)/login/actions";
import { AuthFormHeader } from "@/components/auth/auth-form-header";
import { PasswordField } from "@/components/auth/password-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const initialState: LoginState = {};

type LoginFormProps = {
  rememberedEmail?: string;
  rememberEmail?: boolean;
};

export function LoginForm({
  rememberedEmail = "",
  rememberEmail = false,
}: LoginFormProps) {
  const [state, action] = useActionState(loginAction, initialState);

  return (
    <div className="mx-auto w-full max-w-[430px]">
      <AuthFormHeader
        eyebrow="Acesso seguro"
        title="Acessar conta"
        description="Entre para acompanhar clientes, pedidos e agenda comercial."
      />

      <form action={action} className="space-y-5 sm:space-y-4">
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
            defaultValue={rememberedEmail}
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
            inputClassName="h-12 rounded-xl border-transparent bg-muted/50 text-base shadow-none sm:h-9 sm:rounded-md sm:border-input sm:bg-transparent"
            toggleClassName="h-10 w-10 rounded-xl sm:h-8 sm:w-8 sm:rounded-md"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label
            htmlFor="rememberMe"
            className="cursor-pointer text-sm font-normal text-muted-foreground"
          >
            Lembrar e-mail
          </Label>
          <Switch id="rememberMe" name="rememberMe" defaultChecked={rememberEmail} />
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
