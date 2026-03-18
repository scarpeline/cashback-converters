// Componente de listagem de parceiros
// Integração com estrutura existente

import { useState } from 'react';
import { usePartners, useUpdatePartnerStatus } from '@/hooks/usePartners';
import { PartnerWithUser } from '@/services/partnersService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, User, Users, Crown, Shield, MoreVertical, Search } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface PartnerListProps {
  showFilters?: boolean;
  limit?: number;
  filterByType?: 'afiliado' | 'franqueado' | 'diretor';
}

export default function PartnerList({ showFilters = true, limit, filterByType }: PartnerListProps) {
  const { data: partners, isLoading, error } = usePartners();
  const updateStatus = useUpdatePartnerStatus();
  
  const [filterType, setFilterType] = useState<string>(filterByType || 'all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Carregando parceiros...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-destructive">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Erro ao carregar parceiros</p>
            <p className="text-sm text-muted-foreground mt-2">
              {error.message || 'Tente novamente mais tarde'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!partners || partners.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">Nenhum parceiro encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Quando parceiros forem criados, eles aparecerão aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Aplicar filtros e busca
  const filteredPartners = partners
    .filter(partner => {
      if (filterType !== 'all' && partner.type !== filterType) return false;
      if (filterStatus !== 'all' && partner.status !== filterStatus) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const name = partner.users?.name?.toLowerCase() || '';
        const email = partner.users?.email?.toLowerCase() || '';
        const whatsapp = partner.users?.whatsapp || '';
        if (!name.includes(term) && !email.includes(term) && !whatsapp.includes(term)) return false;
      }
      return true;
    })
    .slice(0, limit || partners.length);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'diretor': return <Crown className="w-4 h-4" />;
      case 'franqueado': return <Shield className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'diretor': return 'bg-purple-500/10 text-purple-500';
      case 'franqueado': return 'bg-blue-500/10 text-blue-500';
      default: return 'bg-green-500/10 text-green-500';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'ativo' 
      ? 'bg-green-500/10 text-green-500' 
      : 'bg-red-500/10 text-red-500';
  };

  const handleStatusChange = async (partnerId: string, newStatus: 'ativo' | 'bloqueado') => {
    try {
      await updateStatus.mutateAsync({ id: partnerId, status: newStatus });
      toast.success(`Status atualizado para ${newStatus}`);
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou WhatsApp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              Todos
            </Button>
          <Button
            variant={filterType === 'afiliado' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('afiliado')}
          >
            <User className="w-3 h-3 mr-1" />
            Afiliados
          </Button>
          <Button
            variant={filterType === 'franqueado' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('franqueado')}
          >
            <Shield className="w-3 h-3 mr-1" />
            Franqueados
          </Button>
          <Button
            variant={filterType === 'diretor' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType('diretor')}
          >
            <Crown className="w-3 h-3 mr-1" />
            Diretores
          </Button>

          <div className="ml-auto flex gap-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              Todos
            </Button>
            <Button
              variant={filterStatus === 'ativo' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('ativo')}
            >
              Ativos
            </Button>
            <Button
              variant={filterStatus === 'bloqueado' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('bloqueado')}
            >
              Bloqueados
            </Button>
          </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {filteredPartners.map((partner: PartnerWithUser) => (
          <Card key={partner.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-full ${getTypeColor(partner.type)}`}>
                      {getTypeIcon(partner.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {partner.users?.name || 'Parceiro sem nome'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {partner.users?.email || 'Sem email'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="outline" className={getTypeColor(partner.type)}>
                      {getTypeIcon(partner.type)}
                      <span className="ml-1 capitalize">{partner.type}</span>
                    </Badge>

                    <Badge variant="outline" className={getStatusColor(partner.status)}>
                      {partner.status === 'ativo' ? '✅ Ativo' : '❌ Bloqueado'}
                    </Badge>

                    <Badge variant="outline">
                      <Users className="w-3 h-3 mr-1" />
                      {partner.total_indicados || 0} indicados
                    </Badge>

                    <Badge variant="outline">
                      Nível {partner.level || 0}
                    </Badge>
                  </div>

                  {partner.users?.whatsapp && (
                    <p className="text-sm text-muted-foreground mt-2">
                      📱 {partner.users.whatsapp}
                    </p>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(
                        partner.id, 
                        partner.status === 'ativo' ? 'bloqueado' : 'ativo'
                      )}
                    >
                      {partner.status === 'ativo' ? 'Bloquear' : 'Ativar'}
                    </DropdownMenuItem>
                    <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                    <DropdownMenuItem>Ver comissões</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {limit && partners.length > limit && (
        <div className="text-center">
          <Button variant="outline">
            Ver todos os {partners.length} parceiros
          </Button>
        </div>
      )}
    </div>
  );
}