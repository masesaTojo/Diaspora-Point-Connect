import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './Button';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
  isPermissionError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  declare state: ErrorBoundaryState;
  declare props: Readonly<{ children: React.ReactNode }>;

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      message: '',
      isPermissionError: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let message = error?.message || 'An unexpected application error occurred.';
    let isPermissionError = false;

    try {
      const parsed = JSON.parse(message) as { error?: string; operationType?: string; path?: string };
      if (parsed && typeof parsed.error === 'string') {
        if (parsed.error.toLowerCase().includes('permission')) {
          isPermissionError = true;
          message = `Access permission check triggered for ${parsed.operationType || 'operation'} on ${parsed.path || 'resource'}.`;
        } else {
          message = parsed.error;
        }
      }
    } catch {
      if (message.toLowerCase().includes('permission')) {
        isPermissionError = true;
      }
    }

    return {
      hasError: true,
      message,
      isPermissionError,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled React boundary error:', error?.message, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-bg flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-neutral-200 shadow-lg p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-display font-bold text-navy">
              {this.state.isPermissionError ? 'Permissions Update Needed' : 'Something Went Wrong'}
            </h1>
            <p className="text-sm text-text-muted leading-relaxed">
              {this.state.message}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
              <Button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Reload App
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  window.location.assign('/');
                }}
                className="flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" /> Return Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
