import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const AUTOCOMPLETE_LIMIT = 8;
const AUTOCOMPLETE_SCAN_LIMIT = 250;

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ items: [] }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();
  const normalizedQuery = normalizeText(query);
  const digitsQuery = onlyDigits(query);

  if (normalizedQuery.length < 2 && digitsQuery.length < 2) {
    return NextResponse.json({ items: [] });
  }

  const customers = await prisma.customer.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: [{ name: "asc" }, { updatedAt: "desc" }, { id: "desc" }],
    take: AUTOCOMPLETE_SCAN_LIMIT,
    select: {
      id: true,
      name: true,
      companyName: true,
      customerCode: true,
      phone: true,
    },
  });

  const filteredCustomers = customers.filter((customer) => {
    const searchableValues = [
      customer.name,
      customer.companyName,
      customer.customerCode,
      customer.phone,
    ];

    return searchableValues.some((value) => {
      if (!value) {
        return false;
      }

      const normalizedValue = normalizeText(value);

      if (normalizedQuery.length >= 2 && normalizedValue.includes(normalizedQuery)) {
        return true;
      }

      if (digitsQuery.length >= 2 && onlyDigits(value).includes(digitsQuery)) {
        return true;
      }

      return false;
    });
  });

  return NextResponse.json({
    items: filteredCustomers.slice(0, AUTOCOMPLETE_LIMIT).map((customer) => ({
      id: customer.id,
      name: customer.name,
      companyName: customer.companyName,
      customerCode: customer.customerCode,
      phone: customer.phone,
    })),
  });
}