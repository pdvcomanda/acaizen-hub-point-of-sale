
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import Logo from "./Logo";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <div className="flex justify-center mb-6">
              <Logo size="large" />
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">Oops, algo deu errado!</h1>
            <p className="text-gray-600 mb-6">
              Ocorreu um erro ao carregar a aplicação. Isso pode acontecer se o navegador
              não suportar recursos necessários ou se houver um problema com a conexão.
            </p>
            <div className="space-y-4">
              <Button
                className="w-full"
                onClick={() => window.location.reload()}
              >
                Recarregar Página
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
              >
                Limpar Dados e Recarregar
              </Button>
            </div>
            {this.state.error && (
              <div className="mt-6 p-4 bg-gray-100 rounded-md">
                <p className="text-sm font-mono text-gray-700 whitespace-pre-wrap break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
