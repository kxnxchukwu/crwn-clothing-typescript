import { ReactElement } from "react";
import { LoaderCircle } from "lucide-react";

export default function Spinner(): ReactElement {
  return (
    <div role="status" className="flex h-[60vh] items-center justify-center">
      <LoaderCircle
        className="size-8 animate-spin text-muted"
        aria-hidden="true"
      />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
