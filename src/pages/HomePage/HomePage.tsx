import { ReactElement } from "react";
import { Link, Outlet } from "react-router";
import Directory from "../../components/Directory/Directory";

export default function HomePage(): ReactElement {
  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="text-sm text-muted">New season</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Everyday essentials, made to last
          </h1>
          <p className="mt-4 text-base text-muted">
            Hats, jackets, and sneakers for men and women.
          </p>
        </div>
        <Link
          to="/shop"
          className="inline-flex h-11 shrink-0 items-center justify-center self-start rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90 sm:self-auto"
        >
          Shop all
        </Link>
      </section>
      <Directory />
      <Outlet />
    </div>
  );
}
