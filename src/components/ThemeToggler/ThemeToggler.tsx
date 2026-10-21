import { ReactElement } from "react";
import { useSelector } from "react-redux";
import { Moon, Sun } from "lucide-react";
import { useAppDispatch } from "../../redux/hooks";
import { selectTheme, toggleTheme } from "../../features/theme-slice";

export default function ThemeToggler({
  className,
}: {
  className?: string;
}): ReactElement {
  const dispatch = useAppDispatch();
  const isDark = useSelector(selectTheme) === "dark";
  return (
    <button
      type="button"
      className={className}
      onClick={() => dispatch(toggleTheme())}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
