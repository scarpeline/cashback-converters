// Componente de formulário para criar/editar parceiros
// Integração com estrutura existente

import { useState } from 'react';
import { useCreatePartner, usePartners } from '@/hooks/usePartners';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PartnerFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultValues?: {
    user_id?: string;
    type?: 'afiliado' | 'franqueado' | 'diretor';
    parent_id?: string | null;
  };
}

export default function PartnerForm({ 
  onSuccess, 
  onCancel, 
  defaultValues 
}: PartnerFormProps) {
  const { data: partners } = usePartners();
  const createPartner = useCreatePartner();
  
  const [formData, setFormData] = useState({
    user_id: defaultValues?.user_id || '',
    type: defaultValues?.type || 'afiliado' as 'afiliado' | 'franqueado' | 'diretor',
    parent_id: defaultValues?.parent_id || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.user_id.trim()) {
      newErrors.user_id = 'ID do usuário é obrigatório';
    }

    if (!formData.type) {
      newErrors.type = 'Tipo de parceiro é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    try {
      const partnerData = {
        user_id: formData.user_id.trim(),
        type: formData.type,
        parent_id: formData.parent_id || null,
      };

      await createPartner.mutateAsync(partnerData);
      
      toast.success('Parceiro criado com sucesso!', {
        icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      });

      // Reset form
      setFormData({
        user_id: '',
        type: 'afiliado',
        parent_id: '',
      });
      setErrors({});

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Erro ao criar parceiro:', error);
      
      let errorMessage = 'Erro ao criar parceiro';
      if (error?.message?.includes('duplicate key')) {
        errorMessage = 'Este usuário já é um parceiro';
      } else if (error?.message?.includes('foreign key')) {
        errorMessage = 'Usuário não encontrado';
      }

      toast.error(errorMessage, {
        icon: <XCircle className="w-5 h-5 text-red-500" />,
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'afiliado':
        return 'Indica clientes e ganha comissão sobre vendas';
      case 'franqueado':
        return 'Gerencia uma unidade e ganha sobre faturamento';
      case 'diretor':
        return 'Coordena franqueados e ganha sobre rede';
      default:
        return '';
    }
  };

  const activePartners = partners?.filter(p => p.status === 'ativo') || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          {defaultValues?.user_id ? 'Editar Parceiro' : 'Novo Parceiro'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User ID */}
          <div className="space-y-2">
            <Label htmlFor="user_id">
              ID do Usuário <span className="text-destructive">*</span>
            </Label>
            <Input
              id="user_id"
              placeholder="Digite o ID do usuário (UUID)"
              value={formData.user_id}
              onChange={(e) => handleChange('user_id', e.target.value)}
              className={errors.user_id ? 'border-destructive' : ''}
              disabled={!!defaultValues?.user_id}
            />
            {errors.user_id && (
              <p className="text-sm text-destructive">{errors.user_id}</p>
            )}
            <p className="text-xs text-muted-foreground">
              ID único do usuário no sistema (geralmente do auth.users)
            </p>
          </div>

          {/* Partner Type */}
          <div className="space-y-2">
            <Label htmlFor="type">
              Tipo de Parceiro <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'afiliado' | 'franqueado' | 'diretor') => 
                handleChange('type', value)
              }
            >
              <SelectTrigger className={errors.type ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="afiliado">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Afiliado</span>
                  </div>
                </SelectItem>
                <SelectItem value="franqueado">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Franqueado</span>
                  </div>
                </SelectItem>
                <SelectItem value="diretor">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>Diretor</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {getTypeDescription(formData.type)}
            </p>
          </div>

          {/* Parent Partner (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="parent_id">Parceiro Pai (Opcional)</Label>
            <Select
              value={formData.parent_id}
              onValueChange={(value) => handleChange('parent_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o parceiro pai" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Nenhum (Parceiro raiz)</SelectItem>
                {activePartners.map(partner => (
                  <SelectItem key={partner.id} value={partner.id}>
                    <div className="flex items-center gap-2">
                      <span className="capitalize">{partner.type}</span>
                      <span className="text-muted-foreground text-xs">
                        - {partner.users?.name || 'Sem nome'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Selecione o parceiro que indicou este novo parceiro
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={createPartner.isPending}
              className="flex-1"
            >
              {createPartner.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {defaultValues?.user_id ? 'Atualizar' : 'Criar Parceiro'}
                </>
              )}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={createPartner.isPending}
              >
                Cancelar
              </Button>
            )}
          </div>

          {/* Help Text */}
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Importante:</strong> O usuário deve existir no sistema antes de ser cadastrado como parceiro.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Após a criação, o parceiro aparecerá na lista e poderá começar a indicar clientes.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}