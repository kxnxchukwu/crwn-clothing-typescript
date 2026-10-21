import { ReactElement, ReactNode } from "react";

export function ProductGrid({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
      {children}
    </div>
  );
}

// Placeholder cards shown while collections load.
export function ProductGridSkeleton({
  count = 4,
}: {
  count?: number;
}): ReactElement {
  return (
    <ProductGrid>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="animate-pulse" aria-hidden="true">
          <div className="aspect-[4/5] rounded-lg bg-surface" />
          <div className="mt-3 flex justify-between gap-3">
            <div className="h-4 w-2/3 rounded bg-surface" />
            <div className="h-4 w-10 rounded bg-surface" />
          </div>
        </div>
      ))}
    </ProductGrid>
  );
}
