import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true, 
      error,
      retryCount: 0 
    };
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
        url: window.location.href,
        retryCount: this.state.retryCount
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

    // Notificar componente pai
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    if (this.state.retryCount < 3) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Se tiver fallback customizado, usa ele
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback padrão melhorado
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-gray-900">
                Ops! Algo deu errado
              </CardTitle>
              <CardDescription className="text-gray-600">
                Encontramos um erro inesperado. Nossa equipe foi notificada 
                e estamos trabalhando para resolver.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Detalhes do erro (em modo dev) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Bug className="w-4 h-4 text-gray-600" />
                    <span className="font-mono text-sm text-gray-700">
                      Detalhes do erro (desenvolvimento):
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div><strong>Erro:</strong> {this.state.error.message}</div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component:</strong> {this.state.errorInfo.componentStack.split('\n')[1]?.trim()}
                      </div>
                    )}
                    <div><strong>Tentativas:</strong> {this.state.retryCount}/3</div>
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex flex-col sm:flex-row gap-3">
                {this.state.retryCount < 3 && (
                  <Button 
                    onClick={this.handleRetry}
                    className="flex-1"
                    variant="default"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tentar novamente ({3 - this.state.retryCount} restantes)
                  </Button>
                )}
                
                <Button 
                  onClick={this.handleReload}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recarregar página
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Ir para início
                </Button>
              </div>

              {/* Informações de suporte */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    Precisa de ajuda?
                  </span>
                </div>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>• Capture uma tela deste erro</div>
                  <div>• Entre em contato com nosso suporte</div>
                  <div>• Erro foi salvo automaticamente para análise</div>
                </div>
              </div>

              {/* ID do erro para referência */}
              {this.state.error && (
                <div className="text-center">
                  <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Error ID: {this.state.error.name.substring(0, 8)}-{Date.now().toString(36)}
                  </code>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
      
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
