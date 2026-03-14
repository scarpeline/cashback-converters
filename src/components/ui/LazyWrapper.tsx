import React, { Suspense, ComponentType } from 'react';
import { ComponentFallback } from '@/components/ui/ComponentFallback';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

interface LazyWrapperProps {
  component: ComponentType<any>;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  props?: any;
}

/**
 * Wrapper seguro para componentes lazy-loaded
 * Impede tela branca e fornece fallbacks adequados
 */
export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  component: Component,
  fallback,
  errorFallback,
  props = {}
}) => {
  return (
    <Suspense 
      fallback={
        fallback || (
          <div className="min-h-[200px] flex items-center justify-center">
            <LoadingScreen message="Carregando componente..." />
          </div>
        )
      }
    >
      <ErrorBoundary fallback={errorFallback}>
        <Component {...props} />
      </ErrorBoundary>
    </Suspense>
  );
};

/**
 * ErrorBoundary simples para lazy components
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LazyWrapper ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <ComponentFallback 
            componentName="componente dinâmico"
            error={this.state.error}
          />
        )
      );
    }

    return this.props.children;
  }
}

/**
 * Factory para criar lazy imports seguros
 */
export function createLazyImport(
  importFunc: () => Promise<{ default: ComponentType<any> }>,
  componentName?: string
) {
  const LazyComponent = React.lazy(() => 
    importFunc().catch(error => {
      console.error(`Failed to load component ${componentName}:`, error);
      // Retorna um componente de fallback
      return {
        default: () => (
          <ComponentFallback 
            componentName={componentName}
            error={error}
          />
        )
      };
    })
  );

  return (props: any) => (
    <LazyWrapper 
      component={LazyComponent}
      props={props}
      errorFallback={
        <ComponentFallback 
          componentName={componentName}
        />
      }
    />
  );
}

export default LazyWrapper;
