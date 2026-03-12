import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log detalhado para debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Salvar erro no localStorage para debugging
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      const existingLogs = JSON.parse(localStorage.getItem('error_logs') || '[]');
      existingLogs.push(errorLog);
      
      // Manter apenas os últimos 50 erros
      if (existingLogs.length > 50) {
        existingLogs.splice(0, existingLogs.length - 50);
      }
      
      localStorage.setItem('error_logs', JSON.stringify(existingLogs));
    } catch (e) {
      console.error('Failed to save error log:', e);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error} 
          errorInfo={this.state.errorInfo}
          resetError={() => this.setState({ hasError: false, error: null, errorInfo: null })}
        />
      );
    }

    return this.props.children;
  }
}

function ErrorFallback({ 
  error, 
  errorInfo, 
  resetError 
}: { 
  error: Error | null; 
  errorInfo: ErrorInfo | null; 
  resetError: () => void;
}) {
  const navigate = useNavigate();

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleCopyError = () => {
    const errorText = `
Error: ${error?.message}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      alert('Informações do erro copiadas para a área de transferência!');
    }).catch(() => {
      console.error('Failed to copy error info');
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--background-dark)" }}>
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Ops! Algo deu errado
          </h1>
          <p className="text-gray-400 mb-6">
            Encontramos um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver isso.
          </p>
        </div>

        <div className="space-y-3">
          <Button onClick={handleReload} className="w-full button-primary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Recarregar Página
          </Button>
          
          <Button onClick={handleGoHome} variant="outline" className="w-full border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white">
            <Home className="w-4 h-4 mr-2" />
            Ir para Página Inicial
          </Button>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                Detalhes do Erro (Desenvolvimento)
              </summary>
              <div className="mt-2 p-3 bg-gray-800/50 rounded border border-gray-700 text-xs font-mono text-gray-300 max-h-40 overflow-auto">
                <div className="text-red-400 font-bold mb-2">
                  {error?.message}
                </div>
                <div className="whitespace-pre-wrap">
                  {error?.stack}
                </div>
              </div>
              <Button
                onClick={handleCopyError}
                variant="ghost"
                size="sm"
                className="mt-2 text-xs text-gray-400 hover:text-gray-300"
              >
                Copiar Informações do Erro
              </Button>
            </details>
          )}
        </div>

        <div className="mt-8 text-sm text-gray-500">
          Se o problema persistir, entre em contato com o suporte.
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;
