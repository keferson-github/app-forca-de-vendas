"use client";

import Link from "next/link";
import { useActionState } from "react";
import { RegisterState, registerAction } from "@/app/(auth)/register/actions";
import { AuthFormHeader } from "@/components/auth/auth-form-header";
import { PasswordField } from "@/components/auth/password-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: RegisterState = {};

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, initialState);

  return (
    <div className="mx-auto w-full max-w-[480px]">
      <AuthFormHeader
        eyebrow="Novo acesso"
        title="Criar conta"
        description="Cadastre seus dados para organizar clientes, pedidos e CRM."
      />

      <form action={action} className="space-y-5 sm:space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Nome
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="Digite seu nome"
              autoComplete="name"
              className="h-12 rounded-xl border-transparent bg-muted/50 text-base shadow-none sm:h-9 sm:rounded-md sm:border-input sm:bg-transparent"
              required
            />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="email" className="text-sm font-medium">
              E-mail
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Digite seu e-mail"
              autoComplete="email"
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
              autoComplete="new-password"
              inputClassName="h-12 rounded-xl border-transparent bg-muted/50 text-base shadow-none sm:h-9 sm:rounded-md sm:border-input sm:bg-transparent"
              toggleClassName="h-10 w-10 rounded-xl sm:h-8 sm:w-8 sm:rounded-md"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirmar senha
            </Label>
            <PasswordField
              id="confirmPassword"
              name="confirmPassword"
              required
              autoComplete="new-password"
              inputClassName="h-12 rounded-xl border-transparent bg-muted/50 text-base shadow-none sm:h-9 sm:rounded-md sm:border-input sm:bg-transparent"
              toggleClassName="h-10 w-10 rounded-xl sm:h-8 sm:w-8 sm:rounded-md"
            />
          </div>
        </div>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        <SubmitButton className="h-12 w-full rounded-xl text-base font-medium sm:h-9 sm:rounded-md sm:text-sm">
          Cadastrar
        </SubmitButton>
      </form>
      <div className="mt-8 text-center text-sm text-muted-foreground sm:mt-5">
        Já possui conta?{" "}
        <Link
          className="font-bold text-primary sm:font-normal sm:text-foreground sm:underline sm:underline-offset-4"
          href="/login"
        >
          Fazer login
        </Link>
      </div>
    </div>
  );
}
