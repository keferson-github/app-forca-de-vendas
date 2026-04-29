"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type PasswordFieldProps = {
  id: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  inputClassName?: string;
  toggleClassName?: string;
};

export function PasswordField({
  id,
  name,
  placeholder,
  required,
  autoComplete,
  value,
  onChange,
  inputClassName,
  toggleClassName,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative group w-full">
      <Input
        id={id}
        name={name}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        className={`w-full pr-12 ${inputClassName ?? ""}`}
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={showPassword ? "Ocultar senha" : "Revelar senha"}
          onClick={() => setShowPassword((value) => !value)}
          className={`h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-0 focus-visible:ring-offset-0 ${toggleClassName ?? ""}`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={showPassword ? "visible" : "hidden"}
              initial={{ opacity: 0, scale: 0.8, rotate: -15 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotate: 15 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="flex items-center justify-center"
            >
              {showPassword ? (
                <Eye className="h-5 w-5" />
              ) : (
                <EyeOff className="h-5 w-5" />
              )}
            </motion.div>
          </AnimatePresence>
        </Button>
      </div>
    </div>
  );
}
