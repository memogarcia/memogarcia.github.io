import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    // Update state so the next render will show the fallback UI
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    
    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });
  }

  protected handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    // Optionally reload the page for a fresh start
    if (window.confirm('Would you like to reload the page for a fresh start?')) {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-bg">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="flex justify-center">
              <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-primary">
                Something went wrong
              </h2>
              <p className="text-secondary text-sm">
                An unexpected error occurred. Your work has been saved.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left bg-bg-secondary p-4 rounded-lg border border-border">
                <summary className="cursor-pointer text-sm font-medium text-secondary hover:text-primary">
                  Error details
                </summary>
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted font-mono">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="text-xs text-muted overflow-auto max-h-32 p-2 bg-bg rounded">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors"
              aria-label="Reset application"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Component-specific error boundary with custom message
export class ComponentErrorBoundary extends ErrorBoundary {
  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-border rounded-lg bg-bg-secondary">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <div className="flex-1">
              <p className="text-sm text-secondary">
                This component couldn't load properly
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="text-xs px-3 py-1 bg-bg hover:bg-hover rounded transition-colors"
              aria-label="Reload component"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}