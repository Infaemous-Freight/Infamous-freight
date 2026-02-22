/**
 * Error Boundary Component
 * Catches React errors and displays user-friendly error UI
 * Integrates with Sentry for error tracking
 *
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */

"use client";

import React, { ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

/**
 * Error Boundary Component - catches and displays errors
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Update state so the next render will show the fallback UI
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Log error to Sentry when error boundary catches an error
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Store error info in state
    this.setState({ errorInfo });

    // Generate error ID
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    this.setState({ errorId });

    // Try to capture with Sentry (browser version)
    if (typeof window !== "undefined" && (window as any).__SENTRY__) {
      try {
        // Access Sentry from window
        const { captureException } = (window as any).__SENTRY__;
        if (captureException) {
          captureException(error, {
            tags: {
              errorBoundary: true,
              component: "React",
            },
            contexts: {
              react: {
                componentStack: errorInfo.componentStack,
              },
            },
            extra: {
              errorId,
            },
          });
        }
      } catch (e) {
        console.error("Failed to send error to Sentry", e);
      }
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by Error Boundary:", error);
      console.error("Error Info:", errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Reset error state
   */
  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div
          className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-50 p-4"
          role="alert"
        >
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Oops! Something went wrong
            </h1>

            {/* Error Message */}
            <p className="text-center text-gray-600 mb-6">
              An unexpected error occurred while rendering this page. Our team has been notified and
              we're working to fix it.
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
                <p className="text-sm font-mono text-red-600 break-words">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <details className="mt-4">
                    <summary className="text-sm font-semibold text-gray-700 cursor-pointer">
                      Component Stack
                    </summary>
                    <pre className="mt-2 text-xs text-gray-500 overflow-auto max-h-48">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Error ID */}
            {this.state.errorId && (
              <p className="text-xs text-gray-500 text-center mb-6">
                Error ID: <code className="font-mono">{this.state.errorId}</code>
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
              >
                Go Home
              </button>
            </div>

            {/* Help Text */}
            <p className="text-xs text-gray-600 text-center mt-6">
              If this problem persists, please{" "}
              <a href="/support" className="text-blue-600 hover:underline font-medium">
                contact support
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
