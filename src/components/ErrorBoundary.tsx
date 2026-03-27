import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
          style={{ backgroundColor: "#0A0A0B" }}
        >
          {/* Ícone */}
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-8"
            style={{ backgroundColor: "rgba(239,68,68,0.15)" }}
          >
            <AlertTriangle className="w-10 h-10" style={{ color: "#ef4444" }} />
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold text-white mb-3">
            Ops! Algo deu errado.
          </h1>

          {/* Descrição */}
          <p className="text-slate-400 mb-10 max-w-sm leading-relaxed">
            Ocorreu um erro inesperado na aplicação. Tente recarregar a página
            ou voltar para o início.
          </p>

          {/* Botões */}
          <div className="flex gap-4 flex-wrap justify-center">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full border text-white text-sm font-medium transition-colors hover:bg-white/5"
              style={{ borderColor: "#3b82f6", color: "#3b82f6" }}
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar
            </button>
            <button
              onClick={this.handleGoHome}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#D4AF37", color: "#0A0A0B" }}
            >
              <Home className="w-4 h-4" />
              Ir para o Início
            </button>
          </div>

          {/* Stack trace em dev */}
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre className="mt-10 p-4 bg-black/50 rounded-lg text-left text-xs overflow-auto max-w-2xl w-full text-red-400 border border-red-900/30">
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
