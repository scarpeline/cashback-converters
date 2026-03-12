import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FallbackProps {
  error?: Error;
  resetError?: () => void;
  context?: string;
}

export function GlobalErrorFallback({ error, resetError, context = 'desconhecido' }: FallbackProps) {
  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReportError = () => {
    const errorData = {
      error: error?.message || 'Erro desconhecido',
      stack: error?.stack || '',
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Criar mensagem para WhatsApp ou email
    const message = `🚨 ERRO NO SISTEMA\n\nContexto: ${context}\nErro: ${errorData.error}\nURL: ${errorData.url}\nTimestamp: ${errorData.timestamp}\n\nStack:\n${errorData.stack}`;
    
    // Copiar para clipboard
    navigator.clipboard.writeText(message).then(() => {
      alert('Informações do erro copiadas! Cole em um chat de suporte.');
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg w-full text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Sistema Indisponível
        </h1>
        
        <p className="text-gray-600 mb-6 text-lg">
          O sistema encontrou um erro crítico e não pode continuar. 
          Nossa equipe já foi notificada.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Bug className="w-4 h-4 text-red-600" />
              <span className="font-semibold text-red-800">Detalhes do Erro</span>
            </div>
            <div className="text-left text-sm text-red-700">
              <p className="font-mono break-all">{error.message}</p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Button 
            onClick={handleReload}
            className="flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Recarregar Página
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleGoHome}
            className="flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Página Inicial
          </Button>
        </div>

        <div className="space-y-3">
          <Button 
            variant="ghost"
            onClick={handleReportError}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            📋 Copiar Informações do Erro
          </Button>
          
          {resetError && (
            <Button 
              variant="ghost"
              onClick={resetError}
              className="text-sm text-gray-600 hover:text-gray-800 block w-full"
            >
              🔄 Tentar Recuperação
            </Button>
          )}
        </div>

        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Soluções Rápidas:</h3>
          <ul className="text-sm text-gray-600 text-left space-y-1">
            <li>• Limpe o cache do navegador (Ctrl+Shift+Del)</li>
            <li>• Tente acessar em uma janela anônima</li>
            <li>• Verifique sua conexão com a internet</li>
            <li>• Aguarde alguns minutos e tente novamente</li>
          </ul>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          Código do erro: {context} | {new Date().toISOString()}
        </div>
      </div>
    </div>
  );
}

// Fallback específico para erros de carregamento de chunks
export function ChunkLoadErrorFallback({ resetError }: { resetError?: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <RefreshCw className="w-8 h-8 text-yellow-600 animate-spin" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Atualizando Sistema
        </h1>
        
        <p className="text-gray-600 mb-6">
          O sistema está atualizando. Isso acontece quando liberamos novas funcionalidades.
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Recarregar Agora
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => {
              // Limpar cache e recarregar
              if ('caches' in window) {
                caches.keys().then(names => {
                  names.forEach(name => {
                    caches.delete(name);
                  });
                });
              }
              window.location.reload();
            }}
            className="w-full"
          >
            🧹 Limpar Cache e Recarregar
          </Button>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          Se o problema persistir, entre em contato com o suporte.
        </div>
      </div>
    </div>
  );
}

// Fallback para erros de rede
export function NetworkErrorFallback({ resetError }: { resetError?: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-orange-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Problema de Conexão
        </h1>
        
        <p className="text-gray-600 mb-6">
          Não foi possível conectar ao servidor. Verifique sua conexão com a internet.
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Tentar Novamente
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            🏠 Página Inicial
          </Button>
        </div>

        <div className="mt-6 p-4 bg-orange-50 rounded-lg">
          <h3 className="font-semibold text-orange-800 mb-2">Verifique:</h3>
          <ul className="text-sm text-orange-700 text-left space-y-1">
            <li>• Conexão com a internet</li>
            <li>• Firewall ou bloqueadores</li>
            <li>• Serviços de VPN</li>
            <li>• DNS do seu dispositivo</li>
          </ul>
        </div>
      </div>
    </div  );
}
