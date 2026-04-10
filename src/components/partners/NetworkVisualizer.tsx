import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DirectReferral {
  id: string;
  name: string;
  status: 'ativo' | 'trial' | 'inativo';
}

interface Affiliate {
  id: string;
  name: string;
  referrals_count: number;
  status: string;
}

interface Franchisee {
  id: string;
  name: string;
  affiliates_count: number;
  total_referrals: number;
}

interface Props {
  partnerType: 'afiliado' | 'franqueado' | 'diretor';
  directReferrals?: DirectReferral[];
  affiliates?: Affiliate[];
  franchisees?: Franchisee[];
}

function statusColor(status: string) {
  if (status === 'ativo') return 'text-orange-500';
  if (status === 'trial') return 'text-yellow-500';
  return 'text-gray-400';
}

function statusLabel(status: string) {
  if (status === 'ativo') return 'laranja';
  if (status === 'trial') return 'amarelo';
  return 'cinza';
}

export default function NetworkVisualizer({ partnerType, directReferrals = [], affiliates = [], franchisees = [] }: Props) {
  if (partnerType === 'afiliado') {
    const ativos = directReferrals.filter(r => r.status === 'ativo').length;
    const trial = directReferrals.filter(r => r.status === 'trial').length;
    const inativos = directReferrals.filter(r => r.status === 'inativo').length;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            👤 Rede de Indicados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {directReferrals.slice(0, 50).map(r => (
              <span
                key={r.id}
                title={`${r.name} — ${r.status}`}
                className={`text-xl cursor-default ${statusColor(r.status)}`}
              >
                👤
              </span>
            ))}
            {directReferrals.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum indicado ainda.</p>
            )}
          </div>
          {directReferrals.length > 0 && (
            <p className="text-sm text-muted-foreground">
              <span className="text-orange-500 font-medium">{ativos} ativos</span>
              {' · '}
              <span className="text-yellow-500 font-medium">{trial} em trial</span>
              {' · '}
              <span className="text-gray-400 font-medium">{inativos} inativos</span>
            </p>
          )}
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span><span className="text-orange-500">👤</span> Ativo</span>
            <span><span className="text-yellow-500">👤</span> Trial</span>
            <span><span className="text-gray-400">👤</span> Inativo</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (partnerType === 'franqueado') {
    const totalClientes = affiliates.reduce((s, a) => s + a.referrals_count, 0);
    const afiliAtivos = affiliates.filter(a => a.status === 'ativo').length;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            🏪 Rede de Afiliados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {affiliates.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum afiliado na rede ainda.</p>
          )}
          {affiliates.map(a => (
            <div key={a.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xl text-blue-500" title={a.name}>🏪</span>
                <span className="text-sm font-medium">{a.name}</span>
                <span className="text-xs text-muted-foreground">({a.referrals_count} clientes)</span>
              </div>
              <div className="flex flex-wrap gap-1 pl-7">
                {Array.from({ length: Math.min(a.referrals_count, 10) }).map((_, i) => (
                  <span key={i} className="text-sm text-orange-500">👤</span>
                ))}
                {a.referrals_count > 10 && (
                  <span className="text-xs text-muted-foreground self-center">+{a.referrals_count - 10}</span>
                )}
              </div>
            </div>
          ))}
          {affiliates.length > 0 && (
            <p className="text-sm text-muted-foreground">
              <span className="text-blue-500 font-medium">{affiliates.length} afiliados</span>
              {' · '}
              <span className="text-orange-500 font-medium">{totalClientes} clientes</span>
              {' · '}
              <span className="font-medium">{afiliAtivos} afiliados ativos</span>
            </p>
          )}
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span><span className="text-blue-500">🏪</span> Afiliado</span>
            <span><span className="text-orange-500">👤</span> Cliente</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // diretor
  const totalAfiliados = franchisees.reduce((s, f) => s + f.affiliates_count, 0);
  const totalClientes = franchisees.reduce((s, f) => s + f.total_referrals, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          👑 Rede de Franqueados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {franchisees.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum franqueado na rede ainda.</p>
        )}
        {franchisees.map(f => (
          <div key={f.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xl text-purple-500" title={f.name}>👑</span>
              <span className="text-sm font-medium">{f.name}</span>
              <span className="text-xs text-muted-foreground">
                ({f.affiliates_count} afiliados · {f.total_referrals} clientes)
              </span>
            </div>
            <div className="flex flex-wrap gap-1 pl-7">
              {Array.from({ length: Math.min(f.affiliates_count, 8) }).map((_, i) => (
                <span key={i} className="text-sm text-blue-500">🏪</span>
              ))}
              {f.affiliates_count > 8 && (
                <span className="text-xs text-muted-foreground self-center">+{f.affiliates_count - 8}</span>
              )}
            </div>
          </div>
        ))}
        {franchisees.length > 0 && (
          <p className="text-sm text-muted-foreground">
            <span className="text-purple-500 font-medium">{franchisees.length} franqueados</span>
            {' · '}
            <span className="text-blue-500 font-medium">{totalAfiliados} afiliados</span>
            {' · '}
            <span className="text-orange-500 font-medium">{totalClientes} clientes</span>
          </p>
        )}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span><span className="text-purple-500">👑</span> Franqueado</span>
          <span><span className="text-blue-500">🏪</span> Afiliado</span>
          <span><span className="text-orange-500">👤</span> Cliente</span>
        </div>
      </CardContent>
    </Card>
  );
}
