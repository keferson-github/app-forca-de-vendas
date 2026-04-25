"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type HiddenFields = Record<string, string | undefined>;

type GlobalSearchAutocompleteConfig<TItem> = {
  endpoint: string;
  debounceMs?: number;
  minChars?: number;
  loadingLabel?: string;
  emptyLabel?: string;
  getItemsFromPayload?: (payload: unknown) => TItem[];
  getItemId: (item: TItem) => string;
  getItemValue: (item: TItem) => string;
  renderItem: (item: TItem) => React.ReactNode;
};

type GlobalSearchFormProps<TItem> = {
  actionPath: string;
  query: string;
  placeholder: string;
  hiddenFields?: HiddenFields;
  searchParamName?: string;
  minChars?: number;
  searchDebounceMs?: number;
  clearPageParamName?: string;
  submitLabel?: string;
  showHint?: boolean;
  hintLabel?: string;
  className?: string;
  autocomplete?: GlobalSearchAutocompleteConfig<TItem>;
};

function normalizeHiddenFields(entries: HiddenFields | undefined, params: URLSearchParams) {
  if (!entries) {
    return;
  }

  for (const [key, value] of Object.entries(entries)) {
    if (value) {
      params.set(key, value);
      continue;
    }

    params.delete(key);
  }
}

function buildQueryUrl(endpoint: string, paramName: string, value: string) {
  const [path, rawQuery = ""] = endpoint.split("?");
  const endpointParams = new URLSearchParams(rawQuery);
  endpointParams.set(paramName, value);
  return `${path}?${endpointParams.toString()}`;
}

function getDefaultItemsFromPayload<TItem>(payload: unknown): TItem[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const { items } = payload as { items?: unknown };

  if (!Array.isArray(items)) {
    return [];
  }

  return items as TItem[];
}

export function GlobalSearchForm<TItem = never>({
  actionPath,
  query,
  placeholder,
  hiddenFields,
  searchParamName = "q",
  minChars = 3,
  searchDebounceMs = 300,
  clearPageParamName = "page",
  submitLabel = "Buscar",
  showHint = true,
  hintLabel,
  className,
  autocomplete,
}: GlobalSearchFormProps<TItem>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchDebounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autocompleteDebounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autocompleteAbortControllerRef = useRef<AbortController | null>(null);
  const autocompleteRequestIdRef = useRef(0);
  const autocompleteCacheRef = useRef<Map<string, TItem[]>>(new Map());
  const [autocompleteItems, setAutocompleteItems] = useState<TItem[]>([]);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const [isAutocompleteVisible, setIsAutocompleteVisible] = useState(false);
  const [autocompleteTerm, setAutocompleteTerm] = useState(query);

  function clearAutocompleteResources() {
    if (autocompleteDebounceTimeoutRef.current) {
      clearTimeout(autocompleteDebounceTimeoutRef.current);
      autocompleteDebounceTimeoutRef.current = null;
    }

    if (autocompleteAbortControllerRef.current) {
      autocompleteAbortControllerRef.current.abort();
      autocompleteAbortControllerRef.current = null;
    }
  }

  function buildSearchUrl(rawValue: string) {
    const normalized = rawValue.trim();
    const currentParams = new URLSearchParams(searchParams.toString());
    const nextParams = new URLSearchParams(searchParams.toString());

    normalizeHiddenFields(hiddenFields, nextParams);

    if (normalized.length >= minChars) {
      nextParams.set(searchParamName, normalized);
    } else {
      nextParams.delete(searchParamName);
    }

    if (clearPageParamName) {
      nextParams.delete(clearPageParamName);
    }

    const currentUrl = currentParams.toString() ? `${pathname}?${currentParams.toString()}` : pathname;
    const nextUrl = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;

    return { currentUrl, nextUrl };
  }

  function scheduleSearch(rawValue: string) {
    if (searchDebounceTimeoutRef.current) {
      clearTimeout(searchDebounceTimeoutRef.current);
    }

    searchDebounceTimeoutRef.current = setTimeout(() => {
      const { currentUrl, nextUrl } = buildSearchUrl(rawValue);

      if (nextUrl !== currentUrl) {
        router.replace(nextUrl, { scroll: false });
      }
    }, searchDebounceMs);
  }

  function applySearchImmediately(rawValue: string) {
    const { currentUrl, nextUrl } = buildSearchUrl(rawValue);

    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }

  function scheduleAutocomplete(rawValue: string) {
    const autocompleteConfig = autocomplete;
    const normalized = rawValue.trim();
    const autocompleteMinChars = autocompleteConfig?.minChars ?? minChars;

    setAutocompleteTerm(rawValue);
    clearAutocompleteResources();

    if (!autocompleteConfig || normalized.length < autocompleteMinChars) {
      autocompleteRequestIdRef.current += 1;
      setIsAutocompleteLoading(false);
      setAutocompleteItems([]);
      return;
    }

    const cacheKey = normalized.toLocaleLowerCase("pt-BR");
    const cachedItems = autocompleteCacheRef.current.get(cacheKey);

    if (cachedItems) {
      setAutocompleteItems(cachedItems);
      setIsAutocompleteLoading(false);
      return;
    }

    setIsAutocompleteLoading(true);

    autocompleteDebounceTimeoutRef.current = setTimeout(async () => {
      const requestId = autocompleteRequestIdRef.current + 1;
      autocompleteRequestIdRef.current = requestId;

      const controller = new AbortController();
      autocompleteAbortControllerRef.current = controller;

      try {
        const requestUrl = buildQueryUrl(autocompleteConfig.endpoint, searchParamName, normalized);
        const response = await fetch(requestUrl, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Autocomplete request failed with status ${response.status}`);
        }

        const payload = (await response.json()) as unknown;
        const getItems = autocompleteConfig.getItemsFromPayload ?? getDefaultItemsFromPayload<TItem>;
        const items = getItems(payload);

        autocompleteCacheRef.current.set(cacheKey, items);

        if (autocompleteRequestIdRef.current === requestId) {
          setAutocompleteItems(items);
          setIsAutocompleteLoading(false);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        if (autocompleteRequestIdRef.current === requestId) {
          setAutocompleteItems([]);
          setIsAutocompleteLoading(false);
        }
      }
    }, autocompleteConfig.debounceMs ?? 180);
  }

  function handleAutocompleteSelect(item: TItem) {
    if (!autocomplete) {
      return;
    }

    const nextValue = autocomplete.getItemValue(item);

    if (searchInputRef.current) {
      searchInputRef.current.value = nextValue;
    }

    setAutocompleteTerm(nextValue);
    setIsAutocompleteVisible(false);
    setAutocompleteItems([]);
    setIsAutocompleteLoading(false);
    applySearchImmediately(nextValue);
  }

  const shouldShowAutocomplete = Boolean(autocomplete)
    && isAutocompleteVisible
    && autocompleteTerm.trim().length >= (autocomplete?.minChars ?? minChars);

  return (
    <>
      <form action={actionPath} className={cn("flex flex-col gap-2 sm:flex-row", className)}>
        {hiddenFields
          ? Object.entries(hiddenFields).map(([key, value]) =>
              value ? <input key={key} type="hidden" name={key} value={value} /> : null
            )
          : null}

        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            name={searchParamName}
            defaultValue={query}
            placeholder={placeholder}
            className="pl-9"
            onChange={(event) => {
              const nextValue = event.currentTarget.value;
              scheduleSearch(nextValue);

              if (autocomplete) {
                scheduleAutocomplete(nextValue);
                setIsAutocompleteVisible(true);
              }
            }}
            onFocus={(event) => {
              if (!autocomplete) {
                return;
              }

              setIsAutocompleteVisible(true);
              scheduleAutocomplete(event.currentTarget.value);
            }}
            onBlur={() => {
              if (!autocomplete) {
                return;
              }

              setTimeout(() => {
                setIsAutocompleteVisible(false);
              }, 100);
            }}
          />

          {shouldShowAutocomplete ? (
            <div className="absolute top-full z-30 mt-2 w-full rounded-xl border bg-popover p-1 shadow-xl">
              {isAutocompleteLoading ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  {autocomplete?.loadingLabel ?? "Buscando sugestões..."}
                </p>
              ) : autocompleteItems.length > 0 ? (
                <ul className="grid gap-0.5">
                  {autocompleteItems.map((item) => (
                    <li key={autocomplete?.getItemId(item)}>
                      <button
                        type="button"
                        className="grid w-full gap-0.5 rounded-lg px-3 py-2 text-left transition hover:bg-accent"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          handleAutocompleteSelect(item);
                        }}
                      >
                        {autocomplete?.renderItem(item)}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  {autocomplete?.emptyLabel ?? "Nenhuma sugestão encontrada."}
                </p>
              )}
            </div>
          ) : null}
        </div>

        <Button type="submit" variant="outline">
          {submitLabel}
        </Button>
      </form>

      {showHint ? (
        <p className="text-xs text-muted-foreground">
          {hintLabel ?? `A busca automática inicia com ${minChars} caracteres.`}
        </p>
      ) : null}
    </>
  );
}
