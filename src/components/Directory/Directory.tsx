import { ReactElement } from "react";
import MenuItem from "../MenuItem/MenuItem";
import { useSelector } from "react-redux";
import { selectDirectorySections } from "../../features/directory-slice";

export default function Directory(): ReactElement {
  const sections = useSelector(selectDirectorySections);
  const featured = sections.filter(({ size }) => size === "large");
  const categories = sections.filter(({ size }) => size !== "large");

  return (
    <div className="space-y-16">
      <div className="grid gap-6 md:grid-cols-2">
        {featured.map(({ id, ...section }) => (
          <MenuItem key={id} id={id} {...section} />
        ))}
      </div>

      <section aria-labelledby="categories-heading">
        <h2
          id="categories-heading"
          className="text-xl font-semibold tracking-tight"
        >
          Shop by category
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {categories.map(({ id, ...section }) => (
            <MenuItem key={id} id={id} {...section} />
          ))}
        </div>
      </section>
    </div>
  );
}
