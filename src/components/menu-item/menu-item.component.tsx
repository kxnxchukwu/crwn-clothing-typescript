import { ReactElement } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

export interface MenuItemProps {
  title: string;
  imageUrl: string;
  size?: string;
  linkUrl: string;
  id: number;
}

// A category card on the homepage: photo, then name and a "Shop now" cue.
export default function MenuItem({
  title,
  imageUrl,
  linkUrl,
}: MenuItemProps): ReactElement {
  return (
    <Link to={`/${linkUrl}`} className="group block">
      <div className="aspect-[4/3] overflow-hidden rounded-lg bg-surface">
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <h3 className="text-base font-medium capitalize">{title}</h3>
        <span className="flex items-center gap-1 text-sm text-muted transition-colors group-hover:text-foreground">
          Shop now
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}
