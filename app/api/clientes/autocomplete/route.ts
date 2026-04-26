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

function levenshteinDistance(left: string, right: string) {
  if (left === right) {
    return 0;
  }

  if (!left.length) {
    return right.length;
  }

  if (!right.length) {
    return left.length;
  }

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = new Array<number>(right.length + 1);

  for (let leftIndex = 0; leftIndex < left.length; leftIndex += 1) {
    current[0] = leftIndex + 1;

    for (let rightIndex = 0; rightIndex < right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex] === right[rightIndex] ? 0 : 1;

      current[rightIndex + 1] = Math.min(
        current[rightIndex] + 1,
        previous[rightIndex + 1] + 1,
        previous[rightIndex] + substitutionCost,
      );
    }

    for (let column = 0; column < current.length; column += 1) {
      previous[column] = current[column];
    }
  }

  return previous[right.length];
}

function isCloseTokenMatch(sourceToken: string, queryToken: string) {
  if (sourceToken.includes(queryToken)) {
    return true;
  }

  if (queryToken.length < 3) {
    return false;
  }

  const sourcePrefix = sourceToken.slice(0, queryToken.length);

  if (Math.abs(sourcePrefix.length - queryToken.length) > 1) {
    return false;
  }

  const prefixDistance = levenshteinDistance(sourcePrefix, queryToken);
  const allowedPrefixDistance = queryToken.length >= 4 ? 2 : 1;

  if (prefixDistance <= allowedPrefixDistance) {
    return true;
  }

  if (queryToken.length < 5 || Math.abs(sourceToken.length - queryToken.length) > 2) {
    return false;
  }

  return levenshteinDistance(sourceToken, queryToken) <= 2;
}

function matchesNormalizedText(value: string, normalizedQuery: string) {
  if (!normalizedQuery) {
    return false;
  }

  if (value.includes(normalizedQuery)) {
    return true;
  }

  const valueTokens = value.split(/\s+/).filter(Boolean);
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

  if (queryTokens.length === 0) {
    return false;
  }

  if (queryTokens.length === 1) {
    return valueTokens.some((token) => isCloseTokenMatch(token, queryTokens[0]));
  }

  if (queryTokens.length > valueTokens.length) {
    return false;
  }

  for (let startIndex = 0; startIndex <= valueTokens.length - queryTokens.length; startIndex += 1) {
    const windowTokens = valueTokens.slice(startIndex, startIndex + queryTokens.length);
    const allTokensMatch = queryTokens.every((queryToken, tokenIndex) =>
      isCloseTokenMatch(windowTokens[tokenIndex], queryToken)
    );

    if (allTokensMatch) {
      return true;
    }
  }

  return false;
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

  if (normalizedQuery.length < 1 && digitsQuery.length < 1) {
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

      if (normalizedQuery.length >= 1 && matchesNormalizedText(normalizedValue, normalizedQuery)) {
        return true;
      }

      if (digitsQuery.length >= 1 && onlyDigits(value).includes(digitsQuery)) {
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