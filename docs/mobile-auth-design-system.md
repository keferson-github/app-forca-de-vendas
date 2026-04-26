# Mobile Auth Design System - "Native App" Look

Este documento contém todos os estilos e especificações utilizados para criar a interface de login e registro mobile com aparência de aplicativo nativo.

## 1. Estrutura do Contêiner (Bottom Sheet)
Utilizado no componente `AuthShell` para criar o efeito de folha que desliza sobre um fundo imersivo.

### Background Imersivo (Mobile)
```tsx
<main className="relative flex min-h-screen flex-col justify-end overflow-hidden bg-black sm:block">
  {/* Overlay de Imagem e Gradiente Escurecido */}
  <div className="absolute inset-0 z-0 sm:hidden">
    <Image src={authImage} fill className="object-cover" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/80 to-black/60" />
  </div>
</main>
```

### Cartão Bottom Sheet (Glassmorphism)
```tsx
<motion.div
  layout="position"
  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
  className="relative z-10 mt-20 flex w-full flex-col overflow-hidden rounded-t-[32px] bg-card/95 backdrop-blur-xl sm:rounded-[28px] sm:bg-card"
>
  {/* Grabber (Indicador de arraste) */}
  <div className="mb-6 w-full sm:hidden">
    <div className="mx-auto h-1.5 w-12 rounded-full bg-muted-foreground/20" />
  </div>
</motion.div>
```

## 2. Elementos de Formulário (Native Style)

### Inputs (Preenchidos e Arredondados)
Estilo focado em área de toque (touch) e limpeza visual.
- **Altura:** `h-12` (48px)
- **Bordas:** `rounded-xl`
- **Background:** `bg-muted/50 border-transparent`
- **Tailwind Classes:** `h-12 rounded-xl border-transparent bg-muted/50 text-base shadow-none sm:h-10 sm:rounded-md sm:border-input`

### Botão de Envio (Primário)
- **Altura:** `h-12`
- **Bordas:** `rounded-xl`
- **Tailwind Classes:** `h-12 w-full rounded-xl text-base font-medium sm:h-10 sm:rounded-md`

### Toggle de "Lembrar e-mail"
Substituição do Checkbox por um Switch moderno.
- **Componente:** `Radix UI Switch` + `Framer Motion Thumb`
- **Transição:** `ease-[cubic-bezier(0.16,1,0.3,1)]`

## 3. Animações de Transição (Framer Motion)
Utilizado para alternar entre Login e Registro sem "piscar" a tela.

### Fade + Scale + Blur
```tsx
<AnimatePresence mode="popLayout" initial={false}>
  <motion.div
    key={pathname}
    initial={{ opacity: 0, scale: 0.96, y: 10, filter: "blur(12px)" }}
    animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
    exit={{ opacity: 0, scale: 0.98, y: -10, filter: "blur(12px)" }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

## 4. Tipografia e Alinhamento
- **Cabeçalho:** `text-3xl font-bold tracking-tight` (Mobile)
- **Footer Links:** `mt-10 font-bold text-primary` (Mobile) vs `font-medium underline` (Desktop).

---
*Nota: Este design foi projetado para ser 100% responsivo, utilizando prefixos `sm:` para restaurar o comportamento padrão em desktops.*
