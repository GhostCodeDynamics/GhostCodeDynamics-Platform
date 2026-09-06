import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Admin ErrorBoundary caught:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-dvh place-items-center bg-background px-6 text-center">
          <div className="space-y-4">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Something went wrong
            </h1>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              An unexpected error occurred in the admin panel. Try again, refresh the page, or sign
              in again.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={this.handleRetry}
                className="inline-flex h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex h-11 items-center rounded-lg border border-border bg-transparent px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
              >
                Refresh page
              </button>
              <button
                type="button"
                onClick={() => {
                  // Router-independent: this boundary sits above <RouterProvider>,
                  // so it must not use router primitives (Link/useNavigate) here.
                  window.location.assign("/login");
                }}
                className="inline-flex h-11 items-center rounded-lg border border-border bg-transparent px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
              >
                Back to login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
