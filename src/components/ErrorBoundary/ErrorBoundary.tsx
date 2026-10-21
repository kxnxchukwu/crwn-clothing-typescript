import { Component, ErrorInfo, ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasErrored: boolean;
}

// Catches render errors below it and shows a recoverable fallback.
class ErrorBoundary extends Component<Props, State> {
  state: State = { hasErrored: false };

  static getDerivedStateFromError(): State {
    return { hasErrored: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.hasErrored) return this.props.children;

    return (
      <div
        role="alert"
        className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center"
      >
        <TriangleAlert className="size-12 text-muted" aria-hidden="true" />
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-3 text-muted">
          This page hit an unexpected error. Try again, or head back home.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => this.setState({ hasErrored: false })}
            className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Try again
          </button>
          {/* A full page load, so the app restarts from a clean state. */}
          <a
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-md border border-line px-6 text-sm font-medium transition-colors hover:bg-surface"
          >
            Go home
          </a>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
