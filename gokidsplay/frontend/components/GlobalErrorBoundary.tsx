"use client";

import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

/**
 * GlobalErrorBoundary
 * Catches runtime errors in the React tree and renders a
 * branded Go Kids Play error UI instead of crashing the whole page.
 *
 * Usage:
 *   <GlobalErrorBoundary>
 *     <YourComponent />
 *   </GlobalErrorBoundary>
 */
export class GlobalErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ errorInfo: info });
    this.props.onError?.(error, info);
    // In production, report to monitoring service (e.g. Sentry)
    console.error("[GlobalErrorBoundary] Caught error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    const isDev = process.env.NODE_ENV === "development";

    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-20">
        <div className="max-w-lg w-full bg-surface-800/60 backdrop-blur-md border border-red-500/30 rounded-3xl p-10 text-center shadow-2xl">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>

          <h1 className="text-2xl font-display font-bold text-white mb-2">
            Something went wrong
          </h1>
          <p className="text-white/60 text-sm mb-8 leading-relaxed">
            An unexpected error occurred. Our team has been notified.<br />
            Please try refreshing the page — your data is safe.
          </p>

          {/* Dev-only error details */}
          {isDev && this.state.error && (
            <div className="bg-red-950/40 border border-red-500/20 rounded-xl p-4 mb-6 text-left">
              <p className="text-red-400 text-xs font-mono font-bold mb-2">
                {this.state.error.name}: {this.state.error.message}
              </p>
              {this.state.errorInfo?.componentStack && (
                <pre className="text-red-300/70 text-[10px] font-mono overflow-x-auto whitespace-pre-wrap max-h-32">
                  {this.state.errorInfo.componentStack.trim()}
                </pre>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={this.handleReset}
              className="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-black font-bold rounded-xl hover:opacity-90 transition-opacity"
            >
              Refresh Page
            </button>
            <a
              href="/"
              className="px-6 py-3 bg-surface-700 hover:bg-surface-600 text-white font-bold rounded-xl transition-colors text-center"
            >
              Back to Home
            </a>
          </div>

          <p className="mt-6 text-xs text-white/30">
            Need help?{" "}
            <a href="mailto:info@gokidsplay.co.uk" className="text-primary hover:underline">
              info@gokidsplay.co.uk
            </a>
            {" · "}
            <a href="tel:07349110865" className="text-primary hover:underline">
              07349 110865
            </a>
          </p>
        </div>
      </div>
    );
  }
}

/**
 * withErrorBoundary HOC
 * Wraps any component with a GlobalErrorBoundary.
 *
 * Usage:
 *   export default withErrorBoundary(MyComponent);
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  onError?: (error: Error, info: React.ErrorInfo) => void
) {
  const Wrapped = (props: P) => (
    <GlobalErrorBoundary onError={onError}>
      <Component {...props} />
    </GlobalErrorBoundary>
  );
  Wrapped.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return Wrapped;
}
