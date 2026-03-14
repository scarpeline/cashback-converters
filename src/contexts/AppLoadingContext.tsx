import React, { createContext, useContext, useState, useEffect } from 'react';
import { GlobalLoading } from '@/components/ui/GlobalLoading';
import { useWhiteScreenDetector } from '@/hooks/useWhiteScreenDetector';

interface AppLoadingContextType {
  isLoading: boolean;
  loadingMessage: string;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  setLoadingMessage: (message: string) => void;
}

const AppLoadingContext = createContext<AppLoadingContextType | undefined>(undefined);

export function useAppLoading() {
  const context = useContext(AppLoadingContext);
  if (!context) {
    throw new Error('useAppLoading must be used within AppLoadingProvider');
  }
  return context;
}

interface AppLoadingProviderProps {
  children: React.ReactNode;
}

export function AppLoadingProvider({ children }: AppLoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);

  // Detector de tela branca
  const { isWhiteScreen, isRecovering, attemptRecovery } = useWhiteScreenDetector({
    timeout: 8000,
    onWhiteScreen: () => {
      console.warn('White screen detected, attempting recovery...');
      attemptRecovery();
    }
  });

  const showLoading = (message?: string) => {
    setLoadingMessage(message || 'Carregando...');
    setIsLoading(true);
    setLoadingStartTime(Date.now());
  };

  const hideLoading = () => {
    setIsLoading(false);
    setLoadingMessage('');
    setLoadingStartTime(null);
  };

  // Auto-hide se loading demorar muito
  useEffect(() => {
    if (isLoading && loadingStartTime) {
      const timer = setTimeout(() => {
        console.warn('Loading timeout - forcing hide');
        hideLoading();
      }, 30000); // 30 segundos max

      return () => clearTimeout(timer);
    }
  }, [isLoading, loadingStartTime]);

  // Debug info
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('AppLoading state:', { isLoading, message: loadingMessage, isWhiteScreen, isRecovering });
    }
  }, [isLoading, loadingMessage, isWhiteScreen, isRecovering]);

  const value: AppLoadingContextType = {
    isLoading,
    loadingMessage,
    showLoading,
    hideLoading,
    setLoadingMessage
  };

  return (
    <AppLoadingContext.Provider value={value}>
      {children}
      
      {/* Loading global */}
      {isLoading && (
        <GlobalLoading 
          message={loadingMessage}
          showRetry={true}
          onRetry={hideLoading}
        />
      )}
      
      {/* Indicador de recuperação de tela branca */}
      {isWhiteScreen && !isLoading && (
        <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">
              {isRecovering ? 'Recuperando...' : 'Detectado problema de carregamento'}
            </span>
          </div>
        </div>
      )}
    </AppLoadingContext.Provider>
  );
}

export default AppLoadingProvider;
