import { Component } from "react";
import { Link } from "react-router";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
            Something went wrong
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            An unexpected error occurred. Try again, refresh the page, or return to the homepage.
          </p>
          <div className="mt-8 flex gap-3">
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-5 py-2.5 text-sm font-medium text-foreground backdrop-blur transition hover:bg-surface hover:border-primary/40"
            >
              Refresh page
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-5 py-2.5 text-sm font-medium text-foreground backdrop-blur transition hover:bg-surface hover:border-primary/40"
            >
              Back home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
