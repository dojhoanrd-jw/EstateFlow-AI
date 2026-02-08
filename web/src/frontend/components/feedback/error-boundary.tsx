'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center p-6">
          <div className="text-center space-y-4 max-w-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
              {this.props.fallbackTitle ?? 'Something went wrong'}
            </h3>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              {this.props.fallbackMessage ?? 'An unexpected error occurred. Please try again.'}
            </p>
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent-600)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-accent-700)] transition-colors"
            >
              <RotateCcw size={14} />
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
