import React from 'react';

/**
 * ErrorBoundary - Catches JavaScript errors in child components
 * Displays a fallback UI instead of crashing the whole app
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render shows the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console (in production, send to error tracking service)
        console.error('[ErrorBoundary] Caught error:', error);
        console.error('[ErrorBoundary] Error info:', errorInfo);

        this.setState({ errorInfo });

        // In production, you could send to Sentry or similar:
        // Sentry.captureException(error, { extra: errorInfo });
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[400px] flex items-center justify-center p-8">
                    <div className="max-w-md w-full bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] p-8 text-center shadow-lg">
                        {/* Error Icon */}
                        <div className="w-16 h-16 mx-auto mb-6 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                            <svg
                                className="w-8 h-8 text-[#d62e1f]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>

                        {/* Error Message */}
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Something went wrong
                        </h2>
                        <p className="text-gray-600 dark:text-[#a0a0a0] mb-6">
                            We're sorry, but something unexpected happened. Please try again.
                        </p>

                        {/* Error Details (dev only) */}
                        {import.meta.env.DEV && this.state.error && (
                            <details className="mb-6 text-left">
                                <summary className="cursor-pointer text-sm text-gray-500 dark:text-[#666666] hover:text-gray-700 dark:hover:text-[#a0a0a0]">
                                    Technical details
                                </summary>
                                <pre className="mt-2 p-3 bg-gray-100 dark:bg-[#0a0a0a] rounded-lg text-xs text-red-600 dark:text-red-400 overflow-auto max-h-32">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.handleRetry}
                                className="px-6 py-3 bg-[#d62e1f] text-white rounded-lg font-semibold hover:bg-[#b52518] transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="px-6 py-3 bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-[#a0a0a0] rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-[#3a3a3a] transition-colors"
                            >
                                Go to Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
