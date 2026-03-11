import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { useAuth } from "@/lib/auth";

type Mode = "owner" | "accountant";

type MessageRow = {
  id: string;
  barbershop_id: string;
  accountant_id: string | null;
  sender_user_id: string;
  sender_role: string | null;
  body: string;
  created_at: string;
};

type LinkedBarbershop = {
  id: string;
  name: string | null;
};

export function AccountingMessagesPanel({
  mode,
  barbershopId,
}: {
  mode: Mode;
  barbershopId?: string | null;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [messageBody, setMessageBody] = useState("");

  const [linkedBarbershops, setLinkedBarbershops] = useState<LinkedBarbershop[]>([]);
  const [selectedBarbershopId, setSelectedBarbershopId] = useState<string | null>(barbershopId || null);

  const title = useMemo(() => {
    return "Mensagens Contábeis";
  }, []);

  const description = useMemo(() => {
    return mode === "owner"
      ? "Converse com seu contador sobre documentos, guias e questões fiscais."
      : "Converse com as empresas vinculadas sobre documentos, guias e questões fiscais.";
  }, [mode]);

  const fetchLinkedBarbershops = async () => {
    if (mode !== "accountant") return;

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    const currentUserId = authData?.user?.id || null;
    if (authErr || !currentUserId) {
      toast.error("Sessão inválida. Faça login novamente.");
      return;
    }

    const { data: accountantRow, error: accountantErr } = await supabase
      .from("accountants")
      .select("id")
      .eq("user_id", currentUserId)
      .maybeSingle();

    if (accountantErr) {
      toast.error(accountantErr.message);
      return;
    }

    const accountantId = (accountantRow as any)?.id as string | undefined;
    if (!accountantId) {
      return;
    }

    const { data: linkRows, error: linksErr } = await (supabase as any)
      .from("accountant_barbershop_links")
      .select("barbershop_id, barbershops(name)")
      .eq("accountant_id", accountantId)
      .eq("status", "active")
      .order("requested_at", { ascending: false });

    if (linksErr) {
      toast.error(linksErr.message);
      return;
    }

    const mapped = (linkRows || []).map((r: any) => ({
      id: r.barbershop_id,
      name: r.barbershops?.name || null,
    }));

    setLinkedBarbershops(mapped);
    if (!selectedBarbershopId && mapped[0]?.id) {
      setSelectedBarbershopId(mapped[0].id);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);

    const effectiveBarbershopId = mode === "owner" ? barbershopId : selectedBarbershopId;
    if (!effectiveBarbershopId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const { data, error } = await (supabase as any)
      .from("accounting_messages")
      .select("id,barbershop_id,accountant_id,sender_user_id,sender_role,body,created_at")
      .eq("barbershop_id", effectiveBarbershopId)
      .order("created_at", { ascending: true });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setMessages((data || []) as any);
  };

  useEffect(() => {
    fetchLinkedBarbershops();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (mode === "owner") {
      setSelectedBarbershopId(barbershopId || null);
    }
  }, [mode, barbershopId]);

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, barbershopId, selectedBarbershopId]);

  const sendMessage = async () => {
    if (!messageBody.trim()) {
      toast.error("Digite uma mensagem.");
      return;
    }

    const effectiveBarbershopId = mode === "owner" ? barbershopId : selectedBarbershopId;
    if (!effectiveBarbershopId) {
      toast.error("Selecione uma barbearia.");
      return;
    }

    if (!user?.id) {
      toast.error("Sessão inválida. Faça login novamente.");
      return;
    }

    setSending(true);

    let accountantId: string | null = null;
    if (mode === "accountant") {
      const { data: accountantRow, error: accountantErr } = await supabase
        .from("accountants")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (accountantErr || !accountantRow?.id) {
        setSending(false);
        toast.error("Contador não encontrado.");
        return;
      }

      accountantId = accountantRow.id;
    }

    const payload: any = {
      barbershop_id: effectiveBarbershopId,
      accountant_id: accountantId,
      sender_user_id: user.id,
      body: messageBody.trim(),
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("accounting_messages").insert(payload as never);

    setSending(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setMessageBody("");
    await fetchMessages();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      {mode === "accountant" && (
        <Card>
          <CardHeader>
            <CardTitle>Empresa</CardTitle>
            <CardDescription>Selecione uma empresa vinculada para visualizar as mensagens.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={selectedBarbershopId || ""}
                onChange={(e) => setSelectedBarbershopId(e.target.value || null)}
              >
                <option value="">Selecione...</option>
                {linkedBarbershops.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name || b.id}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Conversa</CardTitle>
          <CardDescription>Histórico de mensagens trocadas.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
              Carregando...
            </div>
          ) : messages.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Nenhuma mensagem ainda.</div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {messages.map((m) => {
                const isMine = m.sender_user_id === user?.id;
                return (
                  <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-lg p-3 ${isMine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                      <p className={`text-xs mt-1 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {new Date(m.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nova mensagem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            placeholder="Digite sua mensagem..."
            rows={4}
          />
          <Button variant="gold" onClick={sendMessage} disabled={sending} className="gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
