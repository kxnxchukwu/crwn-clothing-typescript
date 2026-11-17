import { ReactElement, ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { useSelector } from "react-redux";
import { ChevronRight, Search, SearchX } from "lucide-react";
import { useAppDispatch } from "../../redux/hooks";
import {
  fetchProducts,
  selectIsCollectionFetching,
  selectProducts,
  selectShopFailed,
} from "../../features/shop-slice";
import {
  filterProducts,
  parseSort,
  SORT_OPTIONS,
  type SortOption,
} from "../../features/product-search";
import { CATEGORIES, isCategoryId } from "../../catalogue/product";
import CollectionItem from "../../components/CollectionItem/CollectionItem";
import {
  ProductGrid,
  ProductGridSkeleton,
} from "../../components/ProductGrid/ProductGrid";
import NotFound from "../../components/NotFound/NotFound";

const SEARCH_DELAY_MS = 300;

// /shop and /shop/:category. Everything that shapes the list lives in the
// URL (?q= and ?sort=, plus the category in the path), so results can be
// shared, bookmarked and stepped through with Back.
export default function ShopPage(): ReactElement {
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const products = useSelector(selectProducts);
  const isLoading = useSelector(selectIsCollectionFetching);
  const failed = useSelector(selectShopFailed);

  const category = id ? CATEGORIES.find((c) => c.id === id) : undefined;
  const urlQuery = searchParams.get("q") ?? "";
  const sort = parseSort(searchParams.get("sort"));

  // The box updates the list on every keystroke, but the URL only once
  // typing pauses (one history entry, not one per letter). When the URL
  // changes on its own (Back, a shared link) the box follows it.
  const [query, setQuery] = useState(urlQuery);
  const [seenUrlQuery, setSeenUrlQuery] = useState(urlQuery);
  const [writtenQuery, setWrittenQuery] = useState(urlQuery);
  if (urlQuery !== seenUrlQuery) {
    setSeenUrlQuery(urlQuery);
    if (urlQuery !== writtenQuery) {
      setQuery(urlQuery);
      setWrittenQuery(urlQuery);
    }
  }

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === urlQuery) return;
    const timeout = setTimeout(() => {
      setWrittenQuery(trimmed);
      setSearchParams((params) => withParam(params, "q", trimmed), {
        replace: true,
      });
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [query, urlQuery, setSearchParams]);

  const setSort = (value: SortOption) =>
    setSearchParams((params) =>
      withParam(params, "sort", value === "featured" ? "" : value),
    );

  const clearSearch = () => {
    setQuery("");
    setWrittenQuery("");
    setSearchParams((params) => withParam(params, "q", ""), { replace: true });
  };

  const results = useMemo(
    () => filterProducts(products, { query, category: category?.id, sort }),
    [products, query, category, sort],
  );
  // When a category has no matches, say whether the whole shop does.
  const matchesElsewhere = useMemo(
    () =>
      category && query.trim() ? filterProducts(products, { query }).length : 0,
    [products, query, category],
  );

  const title = category?.title ?? "Shop";
  useEffect(() => {
    document.title = `${title} — CRWN Clothing`;
    return () => {
      document.title = "CRWN Clothing";
    };
  }, [title]);

  if (id && !isCategoryId(id)) return <NotFound />;

  // Category links keep the current search and sort.
  const search = searchParams.toString();
  const linkTo = (path: string) => (search ? `${path}?${search}` : path);
  const trimmedQuery = query.trim();

  return (
    <div className="space-y-8">
      <header>
        {category && (
          <nav aria-label="Breadcrumb" className="mb-3 text-sm text-muted">
            <ol className="flex items-center gap-1.5">
              <li>
                <Link to={linkTo("/shop")} className="hover:text-foreground">
                  Shop
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="size-3.5" />
              </li>
              <li aria-current="page" className="text-foreground">
                {category.title}
              </li>
            </ol>
          </nav>
        )}
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted" aria-live="polite">
          {isLoading
            ? "Loading products…"
            : resultSummary(results.length, trimmedQuery)}
        </p>
      </header>

      <div className="flex flex-col gap-4 border-y border-line py-4 xl:flex-row xl:items-center xl:justify-between">
        <nav aria-label="Categories">
          <ul className="flex flex-wrap gap-2">
            <CategoryChip to={linkTo("/shop")} active={!category}>
              All
            </CategoryChip>
            {CATEGORIES.map((c) => (
              <CategoryChip
                key={c.id}
                to={linkTo(`/shop/${c.id}`)}
                active={category?.id === c.id}
              >
                {c.title}
              </CategoryChip>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form
            role="search"
            className="relative sm:w-64"
            onSubmit={(event) => {
              event.preventDefault();
              setWrittenQuery(trimmedQuery);
              setSearchParams(
                (params) => withParam(params, "q", trimmedQuery),
                { replace: true },
              );
            }}
          >
            <label htmlFor="shop-search" className="sr-only">
              Search products
            </label>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              id="shop-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products"
              autoComplete="off"
              enterKeyHint="search"
              className="h-10 w-full rounded-md border border-line bg-background pr-3 pl-9 text-sm placeholder:text-muted focus:border-foreground focus:outline-none"
            />
          </form>

          <div className="flex items-center gap-2">
            <label htmlFor="shop-sort" className="shrink-0 text-sm text-muted">
              Sort by
            </label>
            <select
              id="shop-sort"
              value={sort}
              onChange={(event) => setSort(parseSort(event.target.value))}
              className="h-10 w-full rounded-md border border-line bg-background px-3 text-sm focus:border-foreground focus:outline-none sm:w-auto"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <ProductGridSkeleton count={8} />
      ) : failed ? (
        <EmptyState
          title="We couldn't load the products"
          message="Check your connection and try again."
        >
          <button
            type="button"
            onClick={() => dispatch(fetchProducts())}
            className={primaryButton}
          >
            Try again
          </button>
        </EmptyState>
      ) : results.length === 0 ? (
        <EmptyState
          title={
            trimmedQuery
              ? `No products match “${trimmedQuery}”`
              : "Nothing here yet"
          }
          message={
            matchesElsewhere > 0
              ? `There ${matchesElsewhere === 1 ? "is 1 match" : `are ${matchesElsewhere} matches`} in other categories.`
              : "Try a different word, or browse everything."
          }
        >
          {matchesElsewhere > 0 && (
            <Link to={linkTo("/shop")} className={primaryButton}>
              Search all products
            </Link>
          )}
          {trimmedQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className={secondaryButton}
            >
              Clear search
            </button>
          )}
        </EmptyState>
      ) : (
        <ProductGrid>
          {results.map((product) => (
            <CollectionItem key={product.id} item={product} />
          ))}
        </ProductGrid>
      )}
    </div>
  );
}

// Sets or (when empty) removes one search param, keeping the others.
function withParam(params: URLSearchParams, key: string, value: string) {
  const next = new URLSearchParams(params);
  if (value) next.set(key, value);
  else next.delete(key);
  return next;
}

function resultSummary(count: number, query: string) {
  const products = `${count} ${count === 1 ? "product" : "products"}`;
  return query ? `${products} for “${query}”` : products;
}

const primaryButton =
  "inline-flex h-10 items-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90";
const secondaryButton =
  "inline-flex h-10 items-center rounded-md border border-line px-5 text-sm font-medium transition-colors hover:bg-surface";

function CategoryChip({
  to,
  active,
  children,
}: {
  to: string;
  active: boolean;
  children: string;
}): ReactElement {
  return (
    <li>
      <Link
        to={to}
        aria-current={active ? "page" : undefined}
        className={`inline-flex h-9 items-center rounded-full border px-4 text-sm transition-colors ${
          active
            ? "border-foreground bg-foreground text-background"
            : "border-line hover:border-foreground"
        }`}
      >
        {children}
      </Link>
    </li>
  );
}

function EmptyState({
  title,
  message,
  children,
}: {
  title: string;
  message: string;
  children?: ReactNode;
}): ReactElement {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-line px-6 py-16 text-center">
      <SearchX className="size-10 text-muted" aria-hidden="true" />
      <div>
        <h2 className="font-medium">{title}</h2>
        <p className="mt-1 text-sm text-muted">{message}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">{children}</div>
    </div>
  );
}
