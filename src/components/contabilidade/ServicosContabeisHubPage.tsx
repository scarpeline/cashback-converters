// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MessageCircle, 
  Users, 
  FileText, 
  Calculator, 
  Search, 
  Plus,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ContadorBuscaPanel } from "./ContadorBuscaPanel";
import { ChatContadorPanel } from "./ChatContadorPanel";
import { PedidoContabilPanel } from "./PedidoContabilPanel";
import { AssinaturaContabilPanel } from "./AssinaturaContabilPanel";
import UniversalChatPanel from "@/components/shared/UniversalChatPanel";

interface Props {
  barbershopId?: string;
}

export function ServicosContabeisHubPage({ barbershopId }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeAccountant, setActiveAccountant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const basePath = location.pathname.split('/servicos-contabeis')[0] + '/servicos-contabeis';

  useEffect(() => {
    const checkExistingAccountant = async () => {
      if (!barbershopId) return;
      
      try {
        const { data, error } = await (supabase as any)
          .from("accountant_barbershop_links")
          .select(`
            *,
            accountants(
              id, name, email, whatsapp, empresa_contabil, 
              cidade, estado, crc_registro, status_verificado
            )
          `)
          .eq("barbershop_id", barbershopId)
          .eq("status", "active")
          .maybeSingle();

        if (error) throw error;
        
        if (data?.accountants) {
          setActiveAccountant(data.accountants);
        }
      } catch (error) {
        console.error("Erro ao verificar contador existente:", error);
      } finally {
        setLoading(false);
      }
    };
    checkExistingAccountant();
  }, [barbershopId]);

  const handleAccountantLinked = (accountant: any) => {
    setActiveAccountant(accountant);
    toast.success("Contador vinculado com sucesso!");
    navigate(`${basePath}/chat`);
  };

  const navigation = [
    { 
      name: "Buscar Contador", 
      href: `${basePath}/buscar`, 
      icon: Search,
      description: "Encontre e vincule um contador para sua barbearia"
    },
    { 
      name: "Chat", 
      href: `${basePath}/chat`, 
      icon: MessageCircle,
      description: "Converse com seu contador sobre serviços contábeis",
      disabled: !activeAccountant
    },
    { 
      name: "Pedidos de Serviço", 
      href: `${basePath}/pedidos`, 
      icon: FileText,
      description: "Solicite serviços contábeis específicos",
      disabled: !activeAccountant
    },
    { 
      name: "Assinatura Mensal", 
      href: `${basePath}/assinatura`, 
      icon: Calculator,
      description: "Contrate serviços contábeis recorrentes",
      disabled: !activeAccountant
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Serviços Contábeis</h1>
          <p className="text-muted-foreground">
            Gerencie seus serviços contábeis e converse com profissionais qualificados
          </p>
        </div>
        {activeAccountant && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Seu contador</p>
            <p className="font-semibold">{activeAccountant.name}</p>
            <p className="text-xs text-muted-foreground">
              {activeAccountant.empresa_contabil || activeAccountant.cidade}
            </p>
          </div>
        )}
      </div>

      {/* Status Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              activeAccountant 
                ? 'bg-green-100' 
                : 'bg-yellow-100'
            }`}>
              {activeAccountant ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">
                {activeAccountant ? 'Contador Vinculado' : 'Sem Contador Vinculado'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {activeAccountant 
                  ? 'Você já pode utilizar todos os serviços contábeis.'
                  : 'Busque e vincule um contador para começar a usar os serviços.'
                }
              </p>
            </div>
            {!activeAccountant && (
              <Button 
                variant="gold" 
                onClick={() => navigate(`${basePath}/buscar`)}
                className="gap-2"
              >
                <Search className="w-4 h-4" />
                Buscar Contador
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const isDisabled = item.disabled && !activeAccountant;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`block transition-all ${
                isDisabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:scale-105'
              }`}
              onClick={(e) => {
                if (isDisabled) {
                  e.preventDefault();
                  toast.error("Você precisa vincular um contador primeiro");
                }
              }}
            >
              <Card className={`h-full transition-all ${
                isActive 
                  ? 'border-primary bg-primary/5' 
                  : isDisabled
                  ? 'border-muted'
                  : 'hover:border-primary/30'
              }`}>
                <CardHeader className="text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : isDisabled
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-primary/10 text-primary'
                  }`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {item.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Routes */}
      <Routes>
        <Route index element={<ServicosContabeisHome activeAccountant={activeAccountant} />} />
        <Route 
          path="buscar" 
          element={
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => navigate(basePath)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </div>
              <ContadorBuscaPanel 
                onAccountantLinked={handleAccountantLinked}
                barbershopId={barbershopId}
              />
            </div>
          } 
        />
        <Route 
          path="chat" 
          element={
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => navigate(basePath)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </div>
              {activeAccountant ? (
                <UniversalChatPanel 
                  mode="usuario" 
                  contadorId={activeAccountant.id}
                  userType="barbershop"
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Nenhum contador vinculado</h3>
                    <p className="text-muted-foreground mb-4">
                      Você precisa vincular um contador antes de poder iniciar uma conversa.
                    </p>
                    <Button 
                      variant="gold" 
                      onClick={() => navigate(`${basePath}/buscar`)}
                    >
                      Buscar Contador
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          } 
        />
        <Route 
          path="pedidos" 
          element={
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => navigate(basePath)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </div>
              {activeAccountant ? (
                <PedidoContabilPanel 
                  contadorId={activeAccountant.id}
                  barbershopId={barbershopId}
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Nenhum contador vinculado</h3>
                    <p className="text-muted-foreground mb-4">
                      Você precisa vincular um contador antes de solicitar serviços.
                    </p>
                    <Button 
                      variant="gold" 
                      onClick={() => navigate(`${basePath}/buscar`)}
                    >
                      Buscar Contador
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          } 
        />
        <Route 
          path="assinatura" 
          element={
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="sm" onClick={() => navigate(basePath)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </div>
              {activeAccountant ? (
                <AssinaturaContabilPanel 
                  contadorId={activeAccountant.id}
                  barbershopId={barbershopId}
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Nenhum contador vinculado</h3>
                    <p className="text-muted-foreground mb-4">
                      Você precisa vincular um contador antes de contratar assinatura.
                    </p>
                    <Button 
                      variant="gold" 
                      onClick={() => navigate(`${basePath}/buscar`)}
                    >
                      Buscar Contador
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          } 
        />
      </Routes>
    </div>
  );
}

// Home component for the hub
function ServicosContabeisHome({ activeAccountant }: { activeAccountant: any }) {
  return (
    <div className="space-y-6">
      {activeAccountant ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Contador Vinculado
            </CardTitle>
            <CardDescription>
              Você já pode utilizar todos os serviços contábeis disponíveis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <MessageCircle className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h4 className="font-semibold">Chat Rápido</h4>
                  <p className="text-sm text-muted-foreground">
                    Tire dúvidas e converse diretamente com seu contador
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h4 className="font-semibold">Serviços Sob Demanda</h4>
                  <p className="text-sm text-muted-foreground">
                    Solicite serviços contábeis específicos quando precisar
                  </p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Calculator className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h4 className="font-semibold">Assinatura Mensal</h4>
                  <p className="text-sm text-muted-foreground">
                    Tenha atendimento contábil contínuo por um valor fixo
                  </p>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Informações do seu Contador</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">{activeAccountant.name}</p>
                    <p className="text-muted-foreground">{activeAccountant.email}</p>
                    {activeAccountant.whatsapp && (
                      <p className="text-muted-foreground">{activeAccountant.whatsapp}</p>
                    )}
                  </div>
                  <div>
                    {activeAccountant.empresa_contabil && (
                      <p className="text-muted-foreground">{activeAccountant.empresa_contabil}</p>
                    )}
                    {activeAccountant.crc_registro && (
                      <p className="text-muted-foreground">CRC: {activeAccountant.crc_registro}</p>
                    )}
                    {(activeAccountant.cidade || activeAccountant.estado) && (
                      <p className="text-muted-foreground">
                        {activeAccountant.cidade} - {activeAccountant.estado}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-xl mb-2">Bem-vindo aos Serviços Contábeis</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Conecte-se com contadores qualificados para gerenciar a contabilidade da sua barbearia.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="text-center">
                  <Search className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h4 className="font-semibold">1. Busque</h4>
                  <p className="text-sm text-muted-foreground">
                    Encontre contadores verificados na sua região
                  </p>
                </div>
                <div className="text-center">
                  <Plus className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h4 className="font-semibold">2. Vincule</h4>
                  <p className="text-sm text-muted-foreground">
                    Solicite vínculo com o contador de sua escolha
                  </p>
                </div>
                <div className="text-center">
                  <MessageCircle className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h4 className="font-semibold">3. Converse</h4>
                  <p className="text-sm text-muted-foreground">
                    Comece a usar os serviços contábeis disponíveis
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ServicosContabeisHubPage;
