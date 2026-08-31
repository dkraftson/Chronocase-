import React, { Component, ErrorInfo, ReactNode } from "react";
import { ShieldAlert, RotateCcw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  isCard?: boolean;
  key?: React.Key;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Horological ErrorBoundary caught error:", error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.isCard) {
        return (
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-amber-500/30 text-center flex flex-col items-center justify-center min-h-[300px] space-y-2">
            <ShieldAlert size={24} className="text-amber-400" />
            <p className="text-xs font-semibold text-neutral-200">Timepiece Rendering Calibrated</p>
            <p className="text-[10px] text-neutral-400">Specification recovered safely</p>
            <button
              type="button"
              onClick={this.handleReset}
              className="px-3 py-1 text-xs rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-semibold border border-neutral-700"
            >
              Re-render Slot
            </button>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
              <ShieldAlert size={28} />
            </div>
            <h2 className="text-xl font-bold font-serif text-neutral-100">
              {this.props.fallbackTitle || "Horological Vault Recovered"}
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              A temporary rendering anomaly was intercepted. Your collections and saved timepieces are completely safe in local storage and cloud database.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <RotateCcw size={14} />
                <span>Resume Vitrine</span>
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-neutral-700"
              >
                <Home size={14} />
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
