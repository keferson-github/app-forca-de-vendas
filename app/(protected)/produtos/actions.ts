"use server";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { del, put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { syncProductToBlingById } from "@/lib/bling-sync";
import {
  isValidProductSubcategory,
  productCategoryValues,
} from "@/lib/product-categories";
import { prisma } from "@/lib/prisma";

export type ProductFormState = {
  error?: string;
};

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

const ALLOWED_IMAGE_EXTENSIONS = [".jpeg", ".png", ".webp"] as const;

class ImageUploadError extends Error {}

function parsePrice(value: string) {
  let normalized = value.trim().replace(/[R$\s]/g, "");

  if (normalized.includes(",")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  }

  normalized = normalized.replace(/[^0-9.]/g, "");

  if (!normalized) {
    return null;
  }

  if ((normalized.match(/\./g) ?? []).length > 1) {
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

const productSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(1, "Informe o código do produto."),
  name: z.string().trim().min(2, "Informe o nome do produto."),
  category: z.enum(productCategoryValues, {
    message: "Selecione a categoria do produto.",
  }),
  subcategory: z.string().trim().min(1, "Selecione a subcategoria do produto."),
  removeImage: z.boolean().optional().default(false),
  price: z
    .string()
    .trim()
    .min(1, "Informe o preço do produto.")
    .refine((value) => Boolean(parsePrice(value)), "Informe um preço válido maior que zero."),
  description: z.string().trim().optional(),
}).superRefine((data, ctx) => {
  if (!isValidProductSubcategory(data.category, data.subcategory)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["subcategory"],
      message: "Selecione uma subcategoria válida para a categoria escolhida.",
    });
  }
});

function nullable(value?: string) {
  return value ? value : null;
}

function getImageExtension(file: File) {
  const byMime = ALLOWED_IMAGE_TYPES[file.type as keyof typeof ALLOWED_IMAGE_TYPES];
  if (byMime) {
    return byMime;
  }

  const fileName = file.name.toLowerCase();
  const byExtension = ALLOWED_IMAGE_EXTENSIONS.find((extension) =>
    fileName.endsWith(extension)
  );

  return byExtension ? byExtension.slice(1) : null;
}

function extractImageFile(formData: FormData) {
  const value = formData.get("imageFile");

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

function validateImageFile(file: File | null) {
  if (!file) {
    return null;
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "A imagem deve ter no máximo 5MB.";
  }

  if (!getImageExtension(file)) {
    return "Formato inválido. Use apenas arquivos .jpeg, .png ou .webp.";
  }

  return null;
}

async function saveImageFile(file: File) {
  const extension = getImageExtension(file);

  if (!extension) {
    throw new Error("Formato de imagem inválido.");
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  const fileName = `products/${Date.now()}-${randomUUID()}.${extension}`;

  if (blobToken) {
    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      const uploaded = await put(fileName, buffer, {
        access: "public",
        addRandomSuffix: false,
        contentType: file.type || undefined,
        token: blobToken,
      });

      return uploaded.url;
    } catch {
      throw new ImageUploadError("Não foi possível enviar a imagem do produto no momento.");
    }
  }

  if (process.env.VERCEL === "1") {
    throw new ImageUploadError(
      "Upload de imagem indisponível: configure a variável BLOB_READ_WRITE_TOKEN na Vercel."
    );
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(uploadDir, { recursive: true });

  const localFileName = `${Date.now()}-${randomUUID()}.${extension}`;
  const absolutePath = path.join(uploadDir, localFileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(absolutePath, buffer);

  return `/uploads/products/${localFileName}`;
}

function isManagedImagePath(imageUrl: string) {
  return imageUrl.startsWith("/uploads/products/") && !imageUrl.includes("..");
}

function isVercelBlobUrl(imageUrl: string) {
  return /^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\//i.test(imageUrl);
}

function getImageUploadErrorMessage(error: unknown) {
  if (error instanceof ImageUploadError) {
    return error.message;
  }

  return "Não foi possível processar a imagem do produto. Tente novamente.";
}

async function removeImageFile(imageUrl?: string | null) {
  if (!imageUrl) {
    return;
  }

  if (isVercelBlobUrl(imageUrl)) {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    if (!blobToken) {
      return;
    }

    try {
      await del(imageUrl, { token: blobToken });
    } catch {
      return;
    }

    return;
  }

  if (!isManagedImagePath(imageUrl)) {
    return;
  }

  const absolutePath = path.join(process.cwd(), "public", imageUrl.slice(1));

  try {
    await unlink(absolutePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

async function requireUserId() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  return session.user.id;
}

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
    id: String(formData.get("id") ?? "") || undefined,
    code: formData.get("code"),
    name: formData.get("name"),
    category: formData.get("category"),
    subcategory: formData.get("subcategory"),
    removeImage: formData.get("removeImage") === "on" || formData.get("removeImage") === "true",
    price: formData.get("price"),
    description: formData.get("description"),
  });
}

function productPayload(data: z.infer<typeof productSchema>, imageUrl: string | null) {
  const parsedPrice = parsePrice(data.price);

  if (!parsedPrice) {
    throw new Error("Preço do produto inválido.");
  }

  return {
    code: data.code,
    name: data.name,
    category: data.category,
    subcategory: data.subcategory,
    price: new Prisma.Decimal(parsedPrice.toFixed(2)),
    imageUrl,
    description: nullable(data.description),
  };
}

export async function createProductAction(
  _state: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const userId = await requireUserId();
  const parsed = parseProductForm(formData);
  const imageFile = extractImageFile(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const imageFileError = validateImageFile(imageFile);
  if (imageFileError) {
    return { error: imageFileError };
  }

  let imageUrl: string | null = null;

  if (imageFile) {
    try {
      imageUrl = await saveImageFile(imageFile);
    } catch (error) {
      return { error: getImageUploadErrorMessage(error) };
    }
  }

  try {
    const createdProduct = await prisma.product.create({
      data: {
        userId,
        ...productPayload(parsed.data, imageUrl),
      },
    });

    await syncProductToBlingById(userId, createdProduct.id);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "Já existe um produto com esse código." };
    }

    await removeImageFile(imageUrl);

    throw error;
  }

  revalidatePath("/produtos");
  redirect("/produtos?notice=product-created");
}

export async function updateProductAction(
  _state: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const userId = await requireUserId();
  const parsed = parseProductForm(formData);
  const imageFile = extractImageFile(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  if (!parsed.data.id) {
    return { error: "Produto não identificado." };
  }

  const imageFileError = validateImageFile(imageFile);
  if (imageFileError) {
    return { error: imageFileError };
  }

  const currentProduct = await prisma.product.findFirst({
    where: {
      id: parsed.data.id,
      userId,
    },
    select: {
      id: true,
      imageUrl: true,
    },
  });

  if (!currentProduct) {
    return { error: "Produto não encontrado ou sem permissão para editar." };
  }

  const shouldRemoveCurrentImage = parsed.data.removeImage && !imageFile;
  let nextImageUrl = shouldRemoveCurrentImage ? null : currentProduct.imageUrl;

  if (imageFile) {
    try {
      nextImageUrl = await saveImageFile(imageFile);
    } catch (error) {
      return { error: getImageUploadErrorMessage(error) };
    }
  }

  try {
    const updated = await prisma.product.updateMany({
      where: {
        id: currentProduct.id,
        userId,
      },
      data: productPayload(parsed.data, nextImageUrl),
    });

    if (updated.count === 0) {
      return { error: "Produto não encontrado ou sem permissão para editar." };
    }

    if (
      (imageFile || shouldRemoveCurrentImage)
      && currentProduct.imageUrl
      && currentProduct.imageUrl !== nextImageUrl
    ) {
      await removeImageFile(currentProduct.imageUrl);
    }

    await syncProductToBlingById(userId, currentProduct.id);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "Já existe um produto com esse código." };
    }

    if (imageFile && nextImageUrl) {
      await removeImageFile(nextImageUrl);
    }

    throw error;
  }

  revalidatePath("/produtos");
  redirect("/produtos?notice=product-updated");
}

export async function deleteProductAction(
  _state: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return { error: "Produto não identificado." };
  }

  const currentProduct = await prisma.product.findFirst({
    where: {
      id,
      userId,
    },
    select: {
      imageUrl: true,
    },
  });

  if (!currentProduct) {
    return { error: "Produto não encontrado ou sem permissão para excluir." };
  }

  try {
    const deleted = await prisma.product.deleteMany({
      where: {
        id,
        userId,
      },
    });

    if (deleted.count === 0) {
      return { error: "Produto não encontrado ou sem permissão para excluir." };
    }

    await removeImageFile(currentProduct.imageUrl);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        error:
          "Não foi possível excluir: este produto possui itens de pedidos vinculados.",
      };
    }

    throw error;
  }

  revalidatePath("/produtos");
  redirect("/produtos?notice=product-deleted");
}
