import { useProfessionalLimits } from "@/hooks/useProfessionalLimits";
import { Badge } from "@/components/ui/badge";
import { Users, AlertCircle, CheckCircle, Infinity } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function ProfessionalLimitBadge() {
  const { currentCount, maxAllowed, remaining, isUnlimited, isAtLimit, isLoading } = useProfessionalLimits();

  if (isLoading) {
    return (
      <Badge variant="outline" className="gap-1.5">
        <Users className="w-3.5 h-3.5" />
        <span>Carregando...</span>
      </Badge>
    );
  }

  if (isUnlimited) {
    return (
      <Badge variant="outline" className="gap-1.5 border-green-200 bg-green-50 text-green-700">
        <Infinity className="w-3.5 h-3.5" />
        <span>Profissionais ilimitados</span>
      </Badge>
    );
  }

  const percentage = (currentCount / maxAllowed) * 100;
  const isWarning = percentage >= 80;

  return (
    <Badge 
      variant="outline" 
      className={`gap-1.5 ${
        isAtLimit 
          ? 'border-red-200 bg-red-50 text-red-700' 
          : isWarning 
          ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
          : 'border-blue-200 bg-blue-50 text-blue-700'
      }`}
    >
      <Users className="w-3.5 h-3.5" />
      <span>
        {currentCount} / {maxAllowed} profissionais
      </span>
    </Badge>
  );
}

export function ProfessionalLimitAlert() {
  const { currentCount, maxAllowed, remaining, isUnlimited, isAtLimit } = useProfessionalLimits();

  if (isUnlimited || remaining > 2) {
    return null;
  }

  if (isAtLimit) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            Você atingiu o limite de {maxAllowed} profissionais do seu plano atual.
          </span>
          <Link to="/owner/financial">
            <Button size="sm" variant="outline" className="ml-4">
              Fazer upgrade
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-4 border-yellow-200 bg-yellow-50">
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        Você está usando {currentCount} de {maxAllowed} profissionais. 
        Restam apenas {remaining} {remaining === 1 ? 'vaga' : 'vagas'}.
      </AlertDescription>
    </Alert>
  );
}

export function ProfessionalLimitCard() {
  const { currentCount, maxAllowed, remaining, isUnlimited, isAtLimit } = useProfessionalLimits();

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">Limite de Profissionais</h3>
        <ProfessionalLimitBadge />
      </div>
      
      {!isUnlimited && (
        <>
          <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                isAtLimit 
                  ? 'bg-red-500' 
                  : remaining <= 2 
                  ? 'bg-yellow-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min((currentCount / maxAllowed) * 100, 100)}%` }}
            />
          </div>
          
          <p className="text-xs text-muted-foreground">
            {isAtLimit ? (
              <span className="text-red-600 font-medium">
                Limite atingido. Faça upgrade para adicionar mais profissionais.
              </span>
            ) : (
              <span>
                {remaining} {remaining === 1 ? 'vaga disponível' : 'vagas disponíveis'}
              </span>
            )}
          </p>
        </>
      )}
      
      {isUnlimited && (
        <p className="text-xs text-green-600 font-medium flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Você pode adicionar profissionais ilimitados
        </p>
      )}
    </div>
  );
}
