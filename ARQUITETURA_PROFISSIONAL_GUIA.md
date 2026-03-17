# 🧱 Arquitetura Profissional - Guia de Implementação

## ⚠️ IMPORTANTE: Ordem Correta (NÃO PULAR)

### FASE 1: Setup do Supabase (CRÍTICO)

#### 1.1 Executar SQL de Arquitetura
```
1. Acesse: https://app.supabase.com
2. Vá para: SQL Editor
3. Clique: New Query
4. Cole: conteúdo de supabase_professional_architecture.sql
5. Clique: Run
```

**O que será criado:**
- ✅ `partners` - Tabela central (afiliado/franqueado/diretor)
- ✅ `commission_rules` - Regras de comissão com níveis
- ✅ `commissions` - Histórico de comissões
- ✅ `automations` - Tipos de automação
- ✅ `automation_queue` - Fila de mensagens
- ✅ `accounting_services` - Serviços contábeis

#### 1.2 Verificar Criação
```sql
-- Execute no SQL Editor para confirmar
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('partners', 'commission_rules', 'commissions', 'automations', 'automation_queue', 'accounting_services');
```

---

## 🔥 FASE 2: Corrigir Frontend (Erros Atuais)

### 2.1 Evitar Tela Branca

**Antes (ERRADO):**
```typescript
const [data, setData] = useState([]);
useEffect(() => {
  supabase.from("table").select("*").then(({ data }) => setData(data || []));
}, []);

return data.map(...); // ❌ Pode quebrar se data for undefined
```

**Depois (CORRETO):**
```typescript
const [data, setData] = useState<any[]>([]);
useEffect(() => {
  supabase.from("table").select("*").then(({ data }) => setData(data || []));
}, []);

return (data || []).map(...); // ✅ Sempre um array
```

### 2.2 Evitar Erro 400 (Relacionamentos)

**Antes (ERRADO):**
```typescript
supabase.from("table").select("*, profiles(name)"); // ❌ Se não existir relacionamento
```

**Depois (CORRETO):**
```typescript
// Só usar se o relacionamento existir
supabase.from("table").select("*, profiles!inner(name)");
```

### 2.3 Evitar Crash Global

**Antes (ERRADO):**
```typescript
if (loading) return <div>Carregando...</div>;
return data.map(...); // ❌ Se data for null, quebra
```

**Depois (CORRETO):**
```typescript
if (loading) return <div>Carregando...</div>;
if (!data) return <div>Erro ao carregar dados</div>;
return (data || []).map(...); // ✅ Sempre seguro
```

---

## 💰 FASE 3: Implementar Parceiros UI

### 3.1 Super Admin - Gerenciar Parceiros

**Localização:** `src/pages/dashboards/SuperAdminDashboard.tsx`

**Adicionar nova seção:**
```typescript
const ParceirosPage = () => {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("partners")
      .select("*, users:user_id(name, email)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setPartners(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Parceiros</h1>
      
      {/* Filtros */}
      <div className="flex gap-2">
        <Button variant={filterType === "all" ? "gold" : "outline"} onClick={() => setFilterType("all")}>
          Todos
        </Button>
        <Button variant={filterType === "afiliado" ? "gold" : "outline"} onClick={() => setFilterType("afiliado")}>
          Afiliados
        </Button>
        <Button variant={filterType === "franqueado" ? "gold" : "outline"} onClick={() => setFilterType("franqueado")}>
          Franqueados
        </Button>
        <Button variant={filterType === "diretor" ? "gold" : "outline"} onClick={() => setFilterType("diretor")}>
          Diretores
        </Button>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left">Nome</th>
                <th className="p-4 text-left">Tipo</th>
                <th className="p-4 text-left">Nível</th>
                <th className="p-4 text-left">Indicados</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {partners.map(p => (
                <tr key={p.id} className="border-b hover:bg-muted/50">
                  <td className="p-4">{(p as any).users?.name || "N/A"}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {p.type}
                    </span>
                  </td>
                  <td className="p-4">{p.level}</td>
                  <td className="p-4">{p.total_indicados}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.status === 'ativo' 
                        ? 'bg-green-500/10 text-green-500' 
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(p)}>
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};
```

---

## 🎯 FASE 4: Implementar Comissões

### 4.1 Função de Distribuição (Backend)

**Localização:** `src/lib/commission-service.ts` (novo arquivo)

```typescript
import { supabase } from "@/integrations/supabase/client";

export async function distributeCommission(
  partnerId: string,
  amount: number,
  type: "adesao" | "recorrente" = "adesao"
) {
  try {
    const { data, error } = await supabase.rpc("distribute_commission", {
      p_partner_id: partnerId,
      p_amount: amount,
      p_type: type,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Erro ao distribuir comissão:", error);
    throw error;
  }
}

export async function getPartnerCommissions(partnerId: string) {
  const { data, error } = await supabase
    .from("commissions")
    .select("*")
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getTotalEarnings(partnerId: string) {
  const { data, error } = await supabase
    .from("commissions")
    .select("amount")
    .eq("partner_id", partnerId)
    .eq("status", "pago");

  if (error) throw error;
  return (data || []).reduce((sum, c) => sum + Number(c.amount), 0);
}
```

### 4.2 UI de Comissões (Afiliado Dashboard)

**Localização:** `src/pages/dashboards/AfiliadoDashboard.tsx`

```typescript
const ComissoesPage = () => {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<any[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Buscar parceiro
    supabase
      .from("partners")
      .select("id")
      .eq("user_id", user.id)
      .single()
      .then(async ({ data: partner }) => {
        if (!partner) {
          setLoading(false);
          return;
        }

        // Buscar comissões
        const { data: comms } = await supabase
          .from("commissions")
          .select("*")
          .eq("partner_id", partner.id)
          .order("created_at", { ascending: false });

        setCommissions(comms || []);

        // Calcular total
        const total = (comms || [])
          .filter(c => c.status === "pago")
          .reduce((sum, c) => sum + Number(c.amount), 0);

        setTotalEarnings(total);
        setLoading(false);
      });
  }, [user]);

  const pending = commissions.filter(c => c.status === "pendente");
  const paid = commissions.filter(c => c.status === "pago");

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Minhas Comissões</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Ganho</CardDescription>
            <CardTitle className="text-3xl text-gradient-gold">
              R$ {totalEarnings.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pendente</CardDescription>
            <CardTitle className="text-2xl">
              R$ {pending.reduce((s, c) => s + Number(c.amount), 0).toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Transações</CardDescription>
            <CardTitle className="text-2xl">{commissions.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comissões</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : commissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Nenhuma comissão registrada ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {commissions.map(c => (
                <div key={c.id} className="flex items-center justify-between p-4 border rounded-xl">
                  <div>
                    <p className="font-semibold">
                      {c.type === "adesao" ? "Comissão de Adesão" : "Comissão Recorrente"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gradient-gold">
                      R$ {Number(c.amount).toFixed(2)}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      c.status === "pago"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-yellow-500/10 text-yellow-500"
                    }`}>
                      {c.status === "pago" ? "Pago" : "Pendente"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
```

---

## 🤖 FASE 5: Automações

### 5.1 Enviar Mensagem Automática

**Localização:** `src/lib/automation-service.ts` (novo arquivo)

```typescript
import { supabase } from "@/integrations/supabase/client";

export async function scheduleAutomation(
  clientId: string,
  automationType: "reativacao" | "abandono" | "agenda_vazia" | "pagamento" | "comissao",
  channel: "sms" | "whatsapp" | "email" | "push",
  scheduledAt?: Date
) {
  try {
    // Buscar template
    const { data: automation } = await supabase
      .from("automations")
      .select("*")
      .eq("type", automationType)
      .eq("channel", channel)
      .single();

    if (!automation) throw new Error("Automação não encontrada");

    // Adicionar à fila
    const { error } = await supabase.from("automation_queue").insert({
      client_id: clientId,
      automation_id: automation.id,
      message: automation.template,
      status: "pendente",
      scheduled_at: scheduledAt || new Date(),
    });

    if (error) throw error;
  } catch (error) {
    console.error("Erro ao agendar automação:", error);
    throw error;
  }
}
```

---

## ✅ Checklist de Validação

- [ ] SQL executado no Supabase
- [ ] Tabelas criadas (verificar no SQL Editor)
- [ ] Build do frontend funcionando
- [ ] Super Admin consegue ver Parceiros
- [ ] Afiliado consegue ver Comissões
- [ ] Nenhuma tela branca
- [ ] Console sem erros críticos

---

## 🚀 Próximos Passos

1. **Executar SQL** (CRÍTICO)
2. **Corrigir Frontend** (Evitar tela branca)
3. **Implementar Parceiros UI**
4. **Implementar Comissões**
5. **Implementar Automações**
6. **Testar cada dashboard**
7. **Fazer commit**

---

## 📞 Suporte

Se encontrar erros:
1. Verifique o console (F12)
2. Verifique os logs do Supabase
3. Confirme que as tabelas foram criadas
4. Confirme que as RLS policies foram aplicadas

