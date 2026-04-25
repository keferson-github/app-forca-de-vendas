"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Eye, ImageIcon, Package, Pencil, Plus, RefreshCw, Search, Trash2, UploadCloud } from "lucide-react";
import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
  type ProductFormState,
} from "@/app/(protected)/produtos/actions";
import { SubmitButton } from "@/components/auth/submit-button";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { DataTable } from "@/components/shared/data-table";
import { GlobalSearchForm } from "@/components/shared/global-search-form";
import {
  MobileFloatingAction,
  MobileFloatingActionButton,
} from "@/components/shared/mobile-floating-action";
import { TablePagination } from "@/components/shared/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useNoticeToast } from "@/hooks/use-notice-toast";
import {
  getDefaultProductSubcategory,
  getProductCategoryLabel,
  getProductSubcategoryLabel,
  getProductSubcategoryOptions,
  productCategoryLabels,
  productCategoryValues,
  type ProductCategoryValue,
} from "@/lib/product-categories";

export type ProductListItem = {
  id: string;
  code: string;
  name: string;
  category: ProductCategoryValue;
  subcategory: string;
  price: number;
  imageUrl: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  itemsCount: number;
};

type ProductsPageClientProps = {
  products: ProductListItem[];
  query: string;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

type ProductFormSheetProps = {
  product?: ProductListItem;
  triggerLabel: string;
  title: string;
  description: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon-sm";
  trigger?: React.ReactNode;
};

type ProductAutocompleteItem = {
  id: string;
  code: string;
  name: string;
  price: number;
};

function parseProductAutocompletePayload(payload: unknown): ProductAutocompleteItem[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const { items } = payload as { items?: unknown };

  if (!Array.isArray(items)) {
    return [];
  }

  return items.filter((item): item is ProductAutocompleteItem => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const typedItem = item as {
      id?: unknown;
      code?: unknown;
      name?: unknown;
      price?: unknown;
    };

    return (
      typeof typedItem.id === "string"
      && typeof typedItem.code === "string"
      && typeof typedItem.name === "string"
      && typeof typedItem.price === "number"
    );
  });
}

const initialState: ProductFormState = {};

const noticeMessages: Record<string, string> = {
  "product-created": "Produto cadastrado com sucesso.",
  "product-updated": "Produto atualizado com sucesso.",
  "product-deleted": "Produto excluído com sucesso.",
};

function generateProductCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";

  for (let idx = 0; idx < 6; idx += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return `PRD-${suffix}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPriceInput(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPriceMask(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 12);

  if (!digits) {
    return "";
  }

  const amount = Number(digits) / 100;
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function EmptyState() {
  return (
    <div className="grid min-h-[280px] place-items-center px-4 py-12 text-center">
      <div>
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <Search className="size-5 text-muted-foreground" />
        </div>
        <h3 className="text-base font-semibold">Nenhum produto encontrado</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Ajuste sua busca ou crie um novo produto para montar seu catálogo comercial.
        </p>
      </div>
    </div>
  );
}

function ProductImage({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const ratioClassName = className ?? "aspect-video";

  if (!src) {
    return (
      <div className={`flex ${ratioClassName} w-full items-center justify-center rounded-md bg-muted`}>
        <ImageIcon className="size-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    // Dynamic external image URLs are user-provided and may not be present in Next image allowlists.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`${ratioClassName} w-full rounded-md bg-muted object-cover`}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}

function ProductListThumbnail({ src, alt }: { src?: string | null; alt: string }) {
  return (
    <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-muted to-muted/50 shadow-sm ring-1 ring-black/5 dark:ring-white/10 md:h-14 md:w-20">
      {src ? (
        // Dynamic external image URLs are user-provided and may not be present in Next image allowlists.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <ImageIcon className="size-5" />
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/8 via-transparent to-transparent" />
    </div>
  );
}

function ProductFormSheet({
  product,
  triggerLabel,
  title,
  description,
  variant = "default",
  size = "default",
  trigger,
}: ProductFormSheetProps) {
  const action = product ? updateProductAction : createProductAction;
  const [state, formAction] = useActionState(action, initialState);
  const codeInputRef = useRef<HTMLInputElement | null>(null);
  const generateAnimationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const initialCategory = product?.category ?? "ACESSORIOS";
  const [selectedCategory, setSelectedCategory] = useState<ProductCategoryValue>(initialCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState(
    product?.subcategory ?? getDefaultProductSubcategory(initialCategory)
  );
  const subcategoryOptions = getProductSubcategoryOptions(selectedCategory);
  const effectiveSubcategory = subcategoryOptions.some(
    (option) => option.value === selectedSubcategory
  )
    ? selectedSubcategory
    : getDefaultProductSubcategory(selectedCategory);

  useEffect(() => {
    return () => {
      if (generateAnimationTimeoutRef.current) {
        clearTimeout(generateAnimationTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant={variant} size={size}>
            <Package />
            {triggerLabel}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <form action={formAction} className="flex min-h-full flex-col">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>

          <div className="grid gap-4 px-4 pb-4">
            {product ? <input type="hidden" name="id" value={product.id} /> : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor={`${product?.id ?? "new"}-code`}>Código</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      if (codeInputRef.current) {
                        codeInputRef.current.value = generateProductCode();
                      }

                      setIsGeneratingCode(true);

                      if (generateAnimationTimeoutRef.current) {
                        clearTimeout(generateAnimationTimeoutRef.current);
                      }

                      generateAnimationTimeoutRef.current = setTimeout(() => {
                        setIsGeneratingCode(false);
                      }, 500);
                    }}
                  >
                    <RefreshCw className={`size-3.5 ${isGeneratingCode ? "animate-spin" : ""}`} />
                    Gerar
                  </Button>
                </div>
                <Input
                  ref={codeInputRef}
                  id={`${product?.id ?? "new"}-code`}
                  name="code"
                  defaultValue={product?.code ?? ""}
                  placeholder="Ex.: PRD-AB12CD"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${product?.id ?? "new"}-price`}>Preço</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                    R$
                  </span>
                  <Input
                    id={`${product?.id ?? "new"}-price`}
                    name="price"
                    defaultValue={product ? formatPriceInput(product.price) : ""}
                    placeholder="0,00"
                    inputMode="numeric"
                    maxLength={17}
                    className="pl-9"
                    onChange={(event) => {
                      event.currentTarget.value = formatPriceMask(event.currentTarget.value);
                    }}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`${product?.id ?? "new"}-name`}>Nome</Label>
              <Input
                id={`${product?.id ?? "new"}-name`}
                name="name"
                defaultValue={product?.name ?? ""}
                placeholder="Nome do produto"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`${product?.id ?? "new"}-category`}>Categoria</Label>
              <Select
                name="category"
                value={selectedCategory}
                onValueChange={(value) => {
                  const nextCategory = value as ProductCategoryValue;
                  setSelectedCategory(nextCategory);
                  setSelectedSubcategory(getDefaultProductSubcategory(nextCategory));
                }}
              >
                <SelectTrigger id={`${product?.id ?? "new"}-category`} className="w-full">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {productCategoryValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {productCategoryLabels[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`${product?.id ?? "new"}-subcategory`}>Subcategoria</Label>
              <Select
                name="subcategory"
                value={effectiveSubcategory}
                onValueChange={setSelectedSubcategory}
              >
                <SelectTrigger id={`${product?.id ?? "new"}-subcategory`} className="w-full">
                  <SelectValue placeholder="Selecione a subcategoria" />
                </SelectTrigger>
                <SelectContent>
                  {subcategoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor={`${product?.id ?? "new"}-imageFile`}
                className="flex items-center gap-2"
              >
                <UploadCloud className="size-4 text-muted-foreground" />
                Imagem do produto
              </Label>
              <Input
                id={`${product?.id ?? "new"}-imageFile`}
                name="imageFile"
                type="file"
                accept=".jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              />
              <p className="text-xs text-muted-foreground">
                Clique para selecionar uma imagem do produto. Formatos: .jpeg, .png ou .webp (até 5MB).
              </p>
              {product?.imageUrl ? (
                <p className="text-xs text-muted-foreground">
                  Se nenhum arquivo for selecionado, a imagem atual será mantida.
                </p>
              ) : null}
              {product?.imageUrl ? (
                <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2">
                  <Checkbox
                    id={`${product.id}-removeImage`}
                    name="removeImage"
                    defaultChecked={false}
                  />
                  <Label htmlFor={`${product.id}-removeImage`} className="cursor-pointer text-sm font-normal">
                    Remover imagem atual
                  </Label>
                </div>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor={`${product?.id ?? "new"}-description`}>Descrição</Label>
              <Textarea
                id={`${product?.id ?? "new"}-description`}
                name="description"
                defaultValue={product?.description ?? ""}
                placeholder="Detalhes técnicos, aplicações e observações comerciais"
              />
            </div>

            {state.error ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            ) : null}
          </div>

          <SheetFooter>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="reset" variant="outline">
                Limpar
              </Button>
              <SubmitButton>{product ? "Salvar alterações" : "Salvar produto"}</SubmitButton>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function ProductDeleteDialog({
  id,
  name,
  trigger,
}: {
  id: string;
  name: string;
  trigger?: React.ReactNode;
}) {
  return (
    <ConfirmActionDialog
      action={deleteProductAction}
      hiddenFields={{ id }}
      title="Excluir produto"
      description={
        <>
          Esta ação remove o produto {name}. Produtos vinculados a pedidos não podem ser
          excluídos.
        </>
      }
      confirmLabel="Excluir produto"
      pendingLabel="Excluindo..."
      confirmVariant="destructive"
      trigger={
        trigger ?? (
          <Button variant="ghost" size="icon-sm" aria-label={`Excluir ${name}`}>
            <Trash2 />
          </Button>
        )
      }
    />
  );
}

function ProductMobileCard({ product }: { product: ProductListItem }) {
  return (
    <Card className="h-full min-h-[17.5rem] overflow-hidden rounded-2xl border-border/70 bg-card/95 py-0 shadow-sm">
      <CardContent className="flex h-full flex-col gap-3 p-3">
        <ProductImage src={product.imageUrl} alt={product.name} className="aspect-square" />
        <div className="mt-auto grid min-h-[5.25rem] grid-rows-[auto_auto_auto_auto_auto] gap-1.5">
          <h3 className="line-clamp-2 min-h-10 break-words text-sm font-semibold leading-5">
            {product.name}
          </h3>
          <div className="grid gap-0.5">
            <p className="line-clamp-1 min-h-4 text-xs text-muted-foreground">
              {getProductCategoryLabel(product.category)}
            </p>
            <p className="line-clamp-1 min-h-4 text-xs text-muted-foreground/90">
              {getProductSubcategoryLabel(product.category, product.subcategory)}
            </p>
          </div>
          <div className="flex min-h-5 items-center gap-1">
            <Badge variant="secondary" className="max-w-[55%] truncate text-[10px]">
              {product.code}
            </Badge>
          </div>
          <p className="min-h-5 truncate text-sm font-medium text-primary">
            {formatCurrency(product.price)}
          </p>
          <div className="flex justify-end">
            <Badge variant="outline" className="shrink-0 text-[10px]">
              {product.itemsCount} item(ns)
            </Badge>
          </div>
        </div>
      </CardContent>

      <CardFooter className="mt-auto border-t border-border/60 px-2 py-2">
        <div className="grid w-full grid-cols-3 gap-1">
          <ProductDetailSheet
            product={product}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label={`Ver ${product.name}`}>
                <Eye />
              </Button>
            }
          />
          <ProductFormSheet
            product={product}
            triggerLabel="Editar"
            title="Editar produto"
            description="Atualize dados comerciais, preço e imagem do produto."
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label={`Editar ${product.name}`}>
                <Pencil />
              </Button>
            }
          />
          <ProductDeleteDialog
            id={product.id}
            name={product.name}
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label={`Excluir ${product.name}`}>
                <Trash2 />
              </Button>
            }
          />
        </div>
      </CardFooter>
    </Card>
  );
}

function ProductDetailSheet({
  product,
  trigger,
}: {
  product: ProductListItem;
  trigger?: React.ReactNode;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger ?? (
          <button type="button" className="text-left">
            <Card className="overflow-hidden border-transparent shadow-sm transition hover:bg-accent/30">
              <CardContent className="grid gap-3 p-4">
                <ProductImage src={product.imageUrl} alt={product.name} />
                <div className="grid gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {product.code}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {product.itemsCount} item(ns)
                    </Badge>
                  </div>
                  <h3 className="line-clamp-2 text-sm font-semibold">{product.name}</h3>
                  <p className="line-clamp-1 text-xs text-muted-foreground">
                    {getProductCategoryLabel(product.category)} - {getProductSubcategoryLabel(product.category, product.subcategory)}
                  </p>
                  <p className="text-sm text-primary">{formatCurrency(product.price)}</p>
                </div>
              </CardContent>
            </Card>
          </button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Visualizar produto</SheetTitle>
          <SheetDescription>Confira os dados cadastrados do produto.</SheetDescription>
        </SheetHeader>

        <div className="grid gap-4 px-4 pb-4">
          <ProductImage src={product.imageUrl} alt={product.name} className="aspect-square" />
          <div className="grid gap-1 rounded-lg bg-muted/45 p-3">
            <p className="text-xs font-medium text-muted-foreground">Código do produto</p>
            <p className="text-sm font-medium text-foreground">{product.code}</p>
          </div>
          <div className="grid gap-1 rounded-lg bg-muted/45 p-3">
            <p className="text-xs font-medium text-muted-foreground">Título do produto</p>
            <p className="text-sm font-medium text-foreground">{product.name}</p>
          </div>
          <div className="grid gap-1 rounded-lg bg-muted/45 p-3">
            <p className="text-xs font-medium text-muted-foreground">Categoria do produto</p>
            <p className="text-sm font-medium text-foreground">
              {getProductCategoryLabel(product.category)}
            </p>
          </div>
          <div className="grid gap-1 rounded-lg bg-muted/45 p-3">
            <p className="text-xs font-medium text-muted-foreground">Subcategoria do produto</p>
            <p className="text-sm font-medium text-foreground">
              {getProductSubcategoryLabel(product.category, product.subcategory)}
            </p>
          </div>
          <div className="grid gap-1 rounded-lg bg-muted/45 p-3">
            <p className="text-xs font-medium text-muted-foreground">Preço do produto</p>
            <p className="text-lg font-semibold text-foreground">{formatCurrency(product.price)}</p>
          </div>
          <div className="grid gap-1 rounded-lg bg-muted/45 p-3">
            <p className="text-xs font-medium text-muted-foreground">Descrição do produto</p>
            <p className="text-sm text-foreground">
              {product.description || "Sem descrição cadastrada."}
            </p>
          </div>
          <div className="grid gap-1 rounded-lg bg-muted/45 p-3">
            <p className="text-xs font-medium text-muted-foreground">Quantidade de item(ns)</p>
            <p className="text-sm font-medium text-foreground">{product.itemsCount} item(ns)</p>
          </div>
          <div className="grid gap-1 rounded-lg bg-muted/45 p-3">
            <p className="text-xs font-medium text-muted-foreground">Data de criação do produto</p>
            <p className="text-sm text-foreground">
              {new Date(product.createdAt).toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="grid gap-1 rounded-lg bg-muted/45 p-3">
            <p className="text-xs font-medium text-muted-foreground">Atualizado em</p>
            <p className="text-sm text-foreground">
              {new Date(product.updatedAt).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ProductsPageClient({ products, query, pagination }: ProductsPageClientProps) {
  useNoticeToast(noticeMessages);
  const totalCatalogValue = products.reduce((total, product) => total + product.price, 0);
  const totalLinkedItems = products.reduce((total, product) => total + product.itemsCount, 0);

  return (
    <div className="flex flex-col gap-4 p-4 pb-24 md:pb-4 lg:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Produtos</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Gerencie seu catálogo de produtos com preços, imagem e descrição para uso nos pedidos.
          </p>
        </div>
        <div className="hidden flex-wrap gap-2 md:flex">
          <ProductFormSheet
            triggerLabel="Novo produto"
            title="Novo produto"
            description="Cadastre os dados principais para disponibilizar o produto no catálogo."
          />
        </div>
      </div>

      <Card className="border-transparent shadow-sm">
        <CardHeader className="gap-4">
          <div>
            <CardTitle>Catálogo de produtos</CardTitle>
            <CardDescription>Busque por código, nome ou descrição.</CardDescription>
          </div>

          <GlobalSearchForm<ProductAutocompleteItem>
            actionPath="/produtos"
            query={query}
            placeholder="Buscar produto"
            autocomplete={{
              endpoint: "/api/produtos/autocomplete",
              getItemsFromPayload: parseProductAutocompletePayload,
              getItemId: (item) => item.id,
              getItemValue: (item) => item.code,
              renderItem: (item) => (
                <>
                  <span className="text-xs text-muted-foreground">{item.code}</span>
                  <span className="line-clamp-1 text-sm font-medium">{item.name}</span>
                  <span className="text-xs text-muted-foreground">{formatCurrency(item.price)}</span>
                </>
              ),
            }}
          />
        </CardHeader>

        <CardContent>
          {products.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="grid grid-cols-2 items-stretch gap-3 md:hidden">
                {products.map((product) => (
                  <ProductMobileCard key={product.id} product={product} />
                ))}
              </div>

              <DataTable
                columns={[
                  { id: "product", label: "Produto", className: "w-[420px]" },
                  { id: "code", label: "Código" },
                  { id: "items", label: "Itens", className: "text-center" },
                  { id: "price", label: "Preço", className: "text-right" },
                  { id: "actions", label: "Ações", className: "text-right" },
                ]}
                data={products}
                getRowKey={(product) => product.id}
                renderRow={(product) => (
                  <>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ProductListThumbnail src={product.imageUrl} alt={product.name} />
                        <div className="grid gap-0.5">
                          <span className="font-medium">{product.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {getProductCategoryLabel(product.category)} - {getProductSubcategoryLabel(product.category, product.subcategory)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Atualizado em {new Date(product.updatedAt).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.code}</Badge>
                    </TableCell>
                    <TableCell className="text-center">{product.itemsCount}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.price)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <ProductDetailSheet
                          product={product}
                          trigger={
                            <Button variant="ghost" size="icon-sm" aria-label={`Ver ${product.name}`}>
                              <Eye />
                            </Button>
                          }
                        />
                        <ProductFormSheet
                          product={product}
                          triggerLabel="Editar"
                          title="Editar produto"
                          description="Atualize dados comerciais, preço e imagem do produto."
                          variant="ghost"
                          size="sm"
                        />
                        <ProductDeleteDialog id={product.id} name={product.name} />
                      </div>
                    </TableCell>
                  </>
                )}
                footer={
                  products.length > 1 ? (
                    <TableRow>
                      <TableCell colSpan={2}>Totais</TableCell>
                      <TableCell className="text-center">{totalLinkedItems} item(ns)</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalCatalogValue)}</TableCell>
                      <TableCell />
                    </TableRow>
                  ) : null
                }
              />

              <TablePagination
                basePath="/produtos"
                pageSize={pagination.pageSize}
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                currentItemsCount={products.length}
                params={{ q: query || undefined }}
              />
            </>
          )}
        </CardContent>
      </Card>

      <MobileFloatingAction>
        <ProductFormSheet
          triggerLabel="Novo produto"
          title="Novo produto"
          description="Cadastre os dados principais para disponibilizar o produto no catálogo."
          trigger={
            <MobileFloatingActionButton>
              <Plus className="size-4" />
              Novo produto
            </MobileFloatingActionButton>
          }
        />
      </MobileFloatingAction>
    </div>
  );
}
