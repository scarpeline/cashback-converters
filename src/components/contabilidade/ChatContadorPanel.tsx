import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MessageCircle, Send, Loader2, UserCheck, User } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface Msg {
  id: string;
  mensagem: string;
  remetente: string;
  data_envio: string;
  lido: boolean;
}

interface ContadorInfo {
  id: string;
  name: string;
  empresa_contabil: string | null;
}

interface Props {
  contadorId: string;
  modo: "usuario" | "contador";
  usuarioId?: string;
}

export function ChatContadorPanel({ contadorId, modo, usuarioId }: Props) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [contador, setContador] = useState<ContadorInfo | null>(null);
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const uid = modo === "usuario" ? user?.id : usuarioId;

  useEffect(() => {
    if (!uid && modo === "contador") return;
    const carregarContador = async () => {
      const { data } = await (supabase as any)
        .from("accountants")
        .select("id, name, empresa_contabil")
        .eq("id", contadorId)
        .maybeSingle();
      if (data) setContador(data as ContadorInfo);
    };
    const carregarMensagens = async () => {
      setLoading(true);
      let query = (supabase as any)
        .from("chat_contador")
        .select("id, mensagem, remetente, data_envio, lido")
        .eq("contador_id", contadorId)
        .order("data_envio", { ascending: true });

      if (modo === "usuario" && user?.id) {
        query = query.eq("usuario_id", user.id);
      } else if (modo === "contador" && uid) {
        query = query.eq("usuario_id", uid);
      }

      const { data, error } = await query;
      setLoading(false);
      if (error) { toast.error("Erro ao carregar mensagens."); return; }
      setMsgs((data as Msg[]) || []);

      if (modo === "contador" && uid) {
        await (supabase as any)
          .from("chat_contador")
          .update({ lido: true })
          .eq("contador_id", contadorId)
          .eq("usuario_id", uid)
          .eq("remetente", "usuario");
      }
    };
    carregarContador();
    carregarMensagens();
    const channel = supabase
      .channel(`chat_${contadorId}_${uid}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_contador",
        filter: `contador_id=eq.${contadorId}`,
      }, (payload) => {
        const nova = payload.new as Msg;
        if (nova.usuario_id === uid || modo === "contador") {
          setMsgs((prev) => [...prev, nova]);
          scrollBottom();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [contadorId, uid, modo]);

  useEffect(() => { scrollBottom(); }, [msgs]);

  const scrollBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const enviarMensagem = async () => {
    if (!texto.trim() || !user) return;
    setEnviando(true);
    const payload = {
      usuario_id: modo === "usuario" ? user.id : (uid || ""),
      contador_id: contadorId,
      mensagem: texto.trim(),
      remetente: modo,
    };
    const { error } = await (supabase as any).from("chat_contador").insert(payload);
    setEnviando(false);
    if (error) { toast.error("Erro ao enviar: " + error.message); return; }
    setTexto("");
  };

  const formatHora = (dt: string) => {
    return new Date(dt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatData = (dt: string) => {
    return new Date(dt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return (
    <Card className="flex flex-col h-[520px]">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="w-4 h-4 text-primary" />
          {modo === "usuario"
            ? `Chat com ${contador?.name || "Contador"}`
            : "Chat com Cliente"}
        </CardTitle>
        {contador?.empresa_contabil && (
          <CardDescription>{contador.empresa_contabil}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : msgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">Nenhuma mensagem ainda.</p>
            <p className="text-xs text-muted-foreground mt-1">
              {modo === "usuario"
                ? "Apresente-se e descreva sua necessidade contábil."
                : "Aguardando mensagem do cliente."}
            </p>
          </div>
        ) : (
          msgs.map((m) => {
            const isMe = m.remetente === modo;
            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-xl px-3 py-2 space-y-1 ${
                  isMe
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {!isMe && (
                      <span className="text-xs font-medium opacity-70">
                        {m.remetente === "contador" ? (
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> Contador
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> Cliente
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed">{m.mensagem}</p>
                  <p className={`text-xs opacity-60 text-right`}>
                    {formatData(m.data_envio)} {formatHora(m.data_envio)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </CardContent>

      <div className="p-3 border-t flex gap-2">
        <Input
          placeholder="Digite sua mensagem..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && enviarMensagem()}
          disabled={enviando}
        />
        <Button variant="gold" size="icon" onClick={enviarMensagem} disabled={enviando || !texto.trim()}>
          {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </Card>
  );
}

export default ChatContadorPanel;
