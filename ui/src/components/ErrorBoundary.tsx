import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 p-8 text-red-900">
          <h1 className="mb-4 text-2xl font-bold">Something went wrong.</h1>
          <pre className="overflow-auto rounded bg-white p-4 text-sm shadow">
            {this.state.error?.message}
            {"\n\n"}
            {this.state.errorInfo?.componentStack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
