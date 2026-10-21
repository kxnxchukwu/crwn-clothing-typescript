import { ReactElement } from "react";
import { Link } from "react-router";
import { SearchX } from "lucide-react";

export default function NotFound(): ReactElement {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
      <SearchX className="size-12 text-muted" aria-hidden="true" />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="mt-3 text-muted">
        The page you're looking for doesn't exist or has moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/shop"
          className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Go to the shop
        </Link>
        <Link
          to="/"
          className="inline-flex h-11 items-center justify-center rounded-md border border-line px-6 text-sm font-medium transition-colors hover:bg-surface"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
