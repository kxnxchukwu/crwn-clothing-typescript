import { render, screen, fireEvent } from "@testing-library/react";
import ErrorBoundary from "../ErrorBoundary";

let shouldThrow = true;

function Flaky() {
  if (shouldThrow) throw new Error("boom");
  return <p>Recovered content</p>;
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    shouldThrow = true;
    // React logs caught render errors; keep test output clean.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it("shows a fallback when a child throws", () => {
    render(
      <ErrorBoundary>
        <Flaky />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("recovers when Try again is clicked and the child no longer throws", () => {
    render(
      <ErrorBoundary>
        <Flaky />
      </ErrorBoundary>,
    );
    shouldThrow = false;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByText("Recovered content")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
