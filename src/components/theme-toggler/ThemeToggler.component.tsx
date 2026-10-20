import { ReactElement } from "react";
import "./ThemeToggler.styles.scss";
import { useSelector } from "react-redux";
import { useAppDispatch } from "../../redux/hooks";
import { selectTheme, toggleTheme } from "../../features/theme-slice";

export default function ThemeToggler(): ReactElement {
  const dispatch = useAppDispatch();
  const checked = useSelector(selectTheme) === "dark";
  return (
    <>
      {" "}
      <input
        onClick={() => dispatch(toggleTheme())}
        type="checkbox"
        className="checkbox"
        id="checkbox"
        defaultChecked={checked}
      />
      <label htmlFor="checkbox" className="checkbox-label">
        <i className="fas fa-moon"></i>
        <i className="fas fa-sun"></i>
        <span className="ball"></span>
      </label>
    </>
  );
}
