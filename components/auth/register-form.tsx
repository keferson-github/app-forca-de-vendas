"use client";

import Link from "next/link";
import { useActionState } from "react";
import { RegisterState, registerAction } from "@/app/(auth)/register/actions";
import { PasswordField } from "@/components/auth/password-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: RegisterState = {};

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, initialState);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>Informe seus dados para comecar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" placeholder="Seu nome" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" placeholder="voce@empresa.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <PasswordField id="password" name="password" required autoComplete="new-password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <PasswordField id="confirmPassword" name="confirmPassword" required autoComplete="new-password" />
          </div>
          {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
          <SubmitButton>Cadastrar</SubmitButton>
        </form>
        <div className="mt-4 text-sm text-muted-foreground">
          Ja possui conta?{" "}
          <Link className="text-foreground underline underline-offset-4" href="/login">
            Fazer login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
