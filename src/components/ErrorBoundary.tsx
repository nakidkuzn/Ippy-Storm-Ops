import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
    console.error('SnowOps Dispatch ErrorBoundary caught an exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-neutral-100 select-none">
          <div className="max-w-md w-full bg-neutral-900 border border-red-700/80 rounded-xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-600 flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <h2 className="font-display font-bold text-xl uppercase tracking-wider text-red-300">
                Dispatch System Recovered
              </h2>
              <p className="text-xs text-neutral-400 font-mono mt-1">
                A data parsing or map rendering error occurred while processing telemetry data.
              </p>
            </div>

            <div className="bg-neutral-950 p-3 rounded border border-neutral-800 text-left font-mono text-[11px] text-red-400 overflow-x-auto max-h-32">
              {this.state.error?.message || 'Unknown runtime error'}
            </div>

            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-cyan-600 hover:bg-cyan-500 text-neutral-950 font-mono font-bold text-xs rounded transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset & Reload Safe Operational State</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
