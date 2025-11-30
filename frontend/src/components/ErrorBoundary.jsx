import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // You can log to an error reporting service here
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4">
          <div className="max-w-md w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <p className="text-[var(--text-secondary)] mb-6">
              We're sorry for the inconvenience. The page encountered an error.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[var(--accent)] rounded-lg hover:bg-[var(--accent-hover)] transition-colors font-medium"
            >
              Reload Page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-[var(--text-secondary)] hover:text-white">
                  Error Details (Dev Mode)
                </summary>
                <pre className="mt-2 p-4 bg-[var(--bg-tertiary)] rounded text-xs overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
