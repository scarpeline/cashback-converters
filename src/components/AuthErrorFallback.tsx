import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AuthErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
}

export function AuthErrorFallback({ error, resetError }: AuthErrorFallbackProps) {
  const handleRefresh = () => {
    window.location.reload();
  };

  const handleHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <div className="p-8 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="bg-red-500/20 p-4 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-white">Erro de Autenticação</h1>
            <p className="text-slate-400">
              Ocorreu um problema ao conectar com o servidor
            </p>
          </div>

          {/* Error Details */}
          {error && (
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <p className="text-sm text-slate-300 font-mono break-words">
                {error.message || 'Erro desconhecido'}
              </p>
            </div>
          )}

          {/* Troubleshooting */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-400 mb-2">Dicas:</h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Verifique sua conexão com a internet</li>
              <li>• Limpe o cache do navegador</li>
              <li>• Tente novamente em alguns minutos</li>
              <li>• Verifique se o servidor está online</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleRefresh}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button
              onClick={handleHome}
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Home className="w-4 h-4 mr-2" />
              Voltar para Início
            </Button>
          </div>

          {/* Support */}
          <div className="text-center text-xs text-slate-500">
            <p>Se o problema persistir, entre em contato com o suporte</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
